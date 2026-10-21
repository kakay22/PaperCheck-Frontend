
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileCheck2,
  LockKeyhole,
} from "lucide-react";
import toast from "react-hot-toast";
import { login } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      await login(username.trim(), password);
      toast.success("Welcome to PaperCheck.");
      navigate("/", { replace: true });
    } catch (error) {
      const data = error.response?.data;

      if (!error.response) {
        toast.error("Unable to connect. Check that Django is running.");
      } else {
        toast.error(
          data?.detail ||
          data?.non_field_errors?.[0] ||
          "Invalid username or password.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 size-80 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-96 rounded-full bg-indigo-100/60 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-2">
        {/* Brand panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-blue-700 p-10 text-white lg:flex xl:p-12">
          <div className="absolute -right-20 -top-20 size-72 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-8 size-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 -left-20 size-80 rounded-full bg-blue-600/70" />

          <div className="relative flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <FileCheck2 size={24} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">PaperCheck</p>
              <p className="text-xs text-blue-100">Teacher workspace</p>
            </div>
          </div>

          <div className="relative py-14">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
              Smarter assessment checking
            </span>

            <h1 className="mt-6 max-w-sm text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Spend less time checking papers.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
              Organize your classes, scan answer sheets, and review student
              results in one workspace.
            </p>

            <div className="mt-8 space-y-4 text-sm text-blue-50">
              {[
                "Manage classes and student records",
                "Automatically check multiple-choice answers",
                "Review scores before final approval",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/15 text-xs">
                    ✓
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-blue-200">
            A simpler way to manage assessment workflows.
          </p>
        </section>

        {/* Login form */}
        <section className="flex min-w-0 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-14">
          <Link
            to="/login"
            className="mb-10 flex w-fit items-center gap-3 lg:hidden"
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

          <div className="mb-8">
            <p className="text-xs font-bold tracking-[0.16em] text-blue-600">
              WELCOME BACK
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sign in to your account
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your credentials to access your school workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-400 transition hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>


          <div className="mt-5 text-center text-sm text-slate-600">
            Don't have a teacher account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Register here
            </Link>
          </div>


          <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <LockKeyhole
              size={18}
              className="mt-0.5 shrink-0 text-slate-500"
            />
            <div>
              <p className="text-xs font-semibold text-slate-700">
                Secure school access
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Sign in using the account provided by your school
                administrator.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            PaperCheck · Teacher assessment workspace
          </p>
        </section>
      </div>
    </main>
  );
}
