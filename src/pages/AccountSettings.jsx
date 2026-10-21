
import { useEffect, useState } from "react";
import {
    AtSign,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
    Mail,
    Save,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    changeMyPassword,
    getMyAccount,
    updateMyAccount,
} from "../api/account";

const initialProfile = {
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    is_active: true,
};

console.log("ACCOUNT SETTINGS FILE LOADED - TEST 123");

const initialPassword = {
    current_password: "",
    new_password: "",
    confirm_password: "",
};

function getErrorMessage(error, fallback) {
    const data = error.response?.data;

    if (!data) {
        return "Unable to connect. Check that Django is running.";
    }

    if (typeof data.detail === "string") return data.detail;

    for (const value of Object.values(data)) {
        if (typeof value === "string") return value;
        if (Array.isArray(value) && value.length) {
            return String(value[0]);
        }
    }

    return fallback;
}

function Field({ label, icon: Icon, ...props }) {
    return (
        <div>
            <label
                htmlFor={props.id}
                className="mb-2 block text-sm font-medium text-slate-700"
            >
                {label}
            </label>

            <div className="relative">
                {Icon && (
                    <Icon
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                )}

                <input
                    {...props}
                    className={`min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${Icon ? "pl-10 pr-3.5" : "px-3.5"
                        }`}
                />
            </div>
        </div>
    );
}


function PasswordField({
    id,
    label,
    value,
    onChange,
    visible,
    onToggle,
    autoComplete,
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-medium text-slate-700"
            >
                {label}
            </label>

            <div className="relative">
                <input
                    id={id}
                    name={id}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    required
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-12 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-slate-400 hover:text-slate-700"
                >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
        </div>
    );
}

export default function AccountSettings() {
    const [profile, setProfile] = useState(initialProfile);
    const [originalProfile, setOriginalProfile] = useState(initialProfile);
    const [password, setPassword] = useState(initialPassword);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({});

    useEffect(() => {
        let active = true;

        async function loadAccount() {
            try {
                const data = await getMyAccount();

                if (active) {
                    setProfile({ ...initialProfile, ...data });
                    setOriginalProfile({ ...initialProfile, ...data });
                }
            } catch (error) {
                if (active) {
                    toast.error(
                        getErrorMessage(error, "Unable to load your account."),
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadAccount();

        return () => {
            active = false;
        };
    }, []);

    function updateProfileField(event) {
        const { name, value } = event.target;

        setProfile((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function updatePasswordField(event) {
        const { name, value } = event.target;

        console.log("Password change:", name, value.length);

        setPassword((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function togglePasswordVisibility(name) {
        setVisiblePasswords((current) => ({
            ...current,
            [name]: !current[name],
        }));
    }

    async function handleProfileSubmit(event) {
        event.preventDefault();

        if (!profile.first_name.trim() || !profile.last_name.trim()) {
            toast.error("Enter your first and last name.");
            return;
        }

        setSavingProfile(true);

        try {
            const updated = await updateMyAccount({
                first_name: profile.first_name.trim(),
                last_name: profile.last_name.trim(),
                email: profile.email.trim(),
            });

            setProfile((current) => ({ ...current, ...updated }));
            setOriginalProfile((current) => ({ ...current, ...updated }));

            toast.success("Account details updated.");
        } catch (error) {
            toast.error(
                getErrorMessage(error, "Unable to update your account."),
            );
        } finally {
            setSavingProfile(false);
        }
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();

        if (
            !password.current_password ||
            !password.new_password ||
            !password.confirm_password
        ) {
            toast.error("Complete all password fields.");
            return;
        }

        if (password.new_password !== password.confirm_password) {
            toast.error("Your new passwords do not match.");
            return;
        }

        if (password.new_password === password.current_password) {
            toast.error("Choose a password different from your current one.");
            return;
        }

        setSavingPassword(true);

        try {
            const result = await changeMyPassword(password);

            toast.success(result.detail || "Password changed successfully.");
            setPassword(initialPassword);
            setVisiblePasswords({});
        } catch (error) {
            toast.error(
                getErrorMessage(error, "Unable to change your password."),
            );
        } finally {
            setSavingPassword(false);
        }
    }

    const initials =
        `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`
            .toUpperCase() || profile.username?.[0]?.toUpperCase() || "U";

    const fullName =
        `${profile.first_name} ${profile.last_name}`.trim() ||
        profile.username ||
        "My account";

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-5">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl pb-8">
            <header className="mb-6">
                <p className="text-xs font-bold tracking-[0.14em] text-blue-600">
                    PERSONAL SETTINGS
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    My account
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                    Manage your profile and keep your account secure.
                </p>
            </header>

            <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-700">
                    {initials}
                </div>

                <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-slate-900">
                        {fullName}
                    </h2>
                    <p className="mt-1 truncate text-sm text-slate-500">
                        {profile.email || "No email address added"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            <ShieldCheck size={13} />
                            {profile.role || "Account"}
                        </span>
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${profile.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                                }`}
                        >
                            <span className="size-1.5 rounded-full bg-current" />
                            {profile.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>
                </div>
            </section>

            <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                        <UserRound size={19} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                            Profile information
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Update the personal details associated with your account.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-5 p-5 sm:p-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            id="username"
                            label="Username"
                            icon={AtSign}
                            value={profile.username}
                            disabled
                            readOnly
                        />

                        <Field
                            id="role"
                            label="Account role"
                            value={profile.role}
                            disabled
                            readOnly
                        />

                        <Field
                            id="first_name"
                            name="first_name"
                            label="First name"
                            value={profile.first_name}
                            onChange={updateProfileField}
                            autoComplete="given-name"
                            required
                        />

                        <Field
                            id="last_name"
                            name="last_name"
                            label="Last name"
                            value={profile.last_name}
                            onChange={updateProfileField}
                            autoComplete="family-name"
                            required
                        />

                        <div className="sm:col-span-2">
                            <Field
                                id="email"
                                name="email"
                                label="Email address"
                                icon={Mail}
                                type="email"
                                value={profile.email}
                                onChange={updateProfileField}
                                autoComplete="email"
                                placeholder="you@school.edu"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-400">
                            Username and role are managed by your administrator.
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setProfile(originalProfile)}
                                disabled={savingProfile}
                                className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Reset
                            </button>

                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {savingProfile ? (
                                    <LoaderCircle size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {savingProfile ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
                        <KeyRound size={19} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                            Change password
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Use your current password to set a new one.
                        </p>
                    </div>
                </div>



                <form
                    onSubmit={handlePasswordSubmit}
                    noValidate
                    className="space-y-5 p-5 sm:p-6"
                >
                    <PasswordField
                        id="current_password"
                        label="Current password"
                        value={password.current_password}
                        onChange={updatePasswordField}
                        visible={!!visiblePasswords.current_password}
                        onToggle={() => togglePasswordVisibility("current_password")}
                        autoComplete="current-password"
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                        <PasswordField
                            id="new_password"
                            label="New password"
                            value={password.new_password}
                            onChange={updatePasswordField}
                            visible={!!visiblePasswords.new_password}
                            onToggle={() => togglePasswordVisibility("new_password")}
                            autoComplete="new-password"
                        />

                        <PasswordField
                            id="confirm_password"
                            label="Confirm new password"
                            value={password.confirm_password}
                            onChange={updatePasswordField}
                            visible={!!visiblePasswords.confirm_password}
                            onToggle={() => togglePasswordVisibility("confirm_password")}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3.5">
                        <CheckCircle2
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-500"
                        />
                        <p className="text-xs leading-5 text-slate-600">
                            Choose a strong password that you do not use for other accounts.
                            Django's configured password rules will be enforced.
                        </p>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-5">
                        <button
                            type="submit"
                            disabled={savingPassword}
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            {savingPassword ? (
                                <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                                <KeyRound size={16} />
                            )}
                            {savingPassword ? "Updating password..." : "Update password"}
                        </button>
                    </div>
                </form>

            </section>
        </div>
    );
}
