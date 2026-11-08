"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const targetEmail = email.trim().toLowerCase();
    const targetPassword = password.trim();

    try {
      const res = await signIn("credentials", {
        email: targetEmail,
        password: targetPassword,
        redirect: false,
      });

      if (res?.ok && !res?.error) {
        // Fetch session to determine role from DB record
        const sessionRes = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        }).then((r) => r.json());
        const userRole = sessionRes?.user?.role;

        if (userRole === "ADMIN") {
          window.location.replace("/admin");
        } else if (userRole === "HOD") {
          window.location.replace("/hod");
        } else if (userRole === "TEACHER" || userRole === "STAFF" || userRole === "FACULTY") {
          window.location.replace("/teacher");
        } else {
          window.location.replace("/student");
        }
      } else {
        console.error("SignIn failed:", res);
        // NextAuth reports a wrong email or password as "CredentialsSignin".
        // Anything else (for example "Configuration") is a server problem, not the user's fault.
        if (res?.error && res.error !== "CredentialsSignin") {
          setErrorMsg(
            `Sign in is unavailable because of a server setup problem (${res.error}). Ask the site administrator to check NEXTAUTH_SECRET, NEXTAUTH_URL and the database settings.`
          );
        } else {
          setErrorMsg("The email or password is incorrect. Check both and try again.");
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("SignIn exception:", err);
      setErrorMsg("Sign in failed because of a connection problem. Try again in a moment.");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Sign in</h1>
      <p className="auth-sub">Use your college email and password.</p>

      {errorMsg && (
        <div className="auth-error" role="alert">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate={false}>
        <div className="auth-field">
          <label htmlFor="email">College email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@veltechmultitech.org"
            className="auth-input"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input has-toggle"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button type="submit" className="auth-submit" disabled={isLoading}>
          {isLoading && <span className="auth-spinner" aria-hidden="true" />}
          {isLoading ? "Signing in" : "Sign in"}
        </button>
      </form>

      <p className="auth-help">Forgot your password? Ask your department admin to reset it.</p>
    </div>
  );
}
