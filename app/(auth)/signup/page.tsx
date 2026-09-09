"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    console.log("🚀 Signup attempt started");
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);
    console.log("🔑 Password length:", password.length);

    const loadingToast = toast.loading("Creating your account...");

    try {
      console.log("📡 Sending request to /api/auth/signup");

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response status text:", response.statusText);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        throw new Error(
          data?.error || `Signup failed with status ${response.status}`,
        );
      }

      toast.success("Account created successfully! 🎉", {
        id: loadingToast,
      });

      console.log("✅ Signup successful, redirecting...");
      router.push("/");
      router.refresh();
    } catch (submitError) {
      console.error("❌ Signup error:", submitError);

      const errorMessage =
        submitError instanceof Error ? submitError.message : "Signup failed.";
      setError(errorMessage);

      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
      console.log("🏁 Signup process completed");
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">
            Focus & Copy
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">
            Create your account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-slate-200">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0 transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm text-slate-200"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0 transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm text-slate-200"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-10 text-white outline-none ring-0 transition focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-400 hover:text-emerald-300"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
