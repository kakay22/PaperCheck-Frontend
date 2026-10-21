
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileCheck2,
  UserRoundPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import { registerTeacher } from "../api/account";

const initialForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  confirm_password: "",
};

function getRegistrationError(error) {
  const data = error.response?.data;

  if (!error.response) {
    return "Unable to connect. Check that Django is running.";
  }

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data && typeof data === "object") {
    const preferredFields = [
      "username",
      "email",
      "first_name",
      "last_name",
      "password",
      "confirm_password",
      "non_field_errors",
    ];

    for (const field of preferredFields) {
      const value = data[field];

      if (typeof value === "string") return value;
      if (Array.isArray(value) && value.length) {
        return String(value[0]);
      }
    }

    for (const value of Object.values(data)) {
      if (typeof value === "string") return value;
      if (Array.isArray(value) && value.length) {
        return String(value[0]);
      }
    }
  }

  return "Unable to create your account. Please check your details.";
}

function TextField({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  required = true,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-400 transition hover:text-slate-700"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function togglePassword(name) {
    setVisiblePasswords((current) => ({
      ...current,
      [name]: !current[name],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirm_password
    ) {
      toast.error("Complete all fields.");
      return;
    }

    if (form.password !== form.confirm_password) {
      toast.error("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerTeacher({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
      });

      toast.success(
        result.detail || "Teacher account created successfully.",
      );

      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getRegistrationError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 size-80 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-96 rounded-full bg-indigo-100/60 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-blue-700 p-10 text-white lg:flex xl:p-12">
          <div className="absolute -right-20 -top-20 size-72 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-8 size-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -left-20 size-80 rounded-full bg-blue-600/70" />

          <div className="relative flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <FileCheck2 size={24} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">
                PaperCheck
              </p>
              <p className="text-xs text-blue-100">
                Teacher workspace
              </p>
            </div>
          </div>

          <div className="relative py-14">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
              Your teaching workspace starts here
            </span>

            <h1 className="mt-6 max-w-sm text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Make assessment checking simpler.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
              Create your teacher account to organize assessments,
              scan answer sheets, and review student results.
            </p>
          </div>

          <p className="relative text-xs text-blue-200">
            PaperCheck · Teacher assessment workspace
          </p>
        </section>

        <section className="flex min-w-0 flex-col justify-center px-6 py-8 sm:px-10 lg:px-12 xl:px-14">
          <Link
            to="/login"
            className="mb-7 flex w-fit items-center gap-3 lg:hidden"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
              <FileCheck2 size={24} />
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight text-slate-900">
                PaperCheck
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Teacher workspace
              </span>
            </span>
          </Link>

          <div className="mb-6">
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <UserRoundPlus size={21} />
            </div>

            <p className="text-xs font-bold tracking-[0.16em] text-blue-600">
              TEACHER REGISTRATION
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Create your account
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your details to register as a PaperCheck teacher.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="First name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                autoComplete="given-name"
                placeholder="First name"
              />

              <TextField
                label="Last name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                autoComplete="family-name"
                placeholder="Last name"
              />
            </div>

            <TextField
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              placeholder="Choose a username"
            />

            <TextField
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="you@school.edu"
            />

            <PasswordField
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              visible={!!visiblePasswords.password}
              onToggle={() => togglePassword("password")}
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              visible={!!visiblePasswords.confirm_password}
              onToggle={() => togglePassword("confirm_password")}
              autoComplete="new-password"
            />

            <p className="text-xs leading-5 text-slate-500">
              Your password must meet the password rules configured by
              the school system.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create teacher account"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
