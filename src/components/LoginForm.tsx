"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

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
        if (res?.error && res.error !== "CredentialsSignin") {
          setErrorMsg("Could not reach authentication service. Please retry in a moment.");
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
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Sign in</h1>
        <p className="auth-sub">Use your institutional college credentials to continue.</p>
      </div>

      {errorMsg && (
        <div className="auth-error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate={false}>
        <div className="auth-field">
          <label htmlFor="email">College email address</label>
          <div className="auth-input-wrap">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@veltechmultitech.org"
              className="auth-input"
              style={{ paddingLeft: "38px" }}
              required
              autoComplete="email"
              autoFocus
            />
            <Mail
              size={17}
              style={{
                position: "absolute",
                left: "12px",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        <div className="auth-field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor="password">Password</label>
          </div>
          <div className="auth-input-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input has-toggle"
              style={{ paddingLeft: "38px" }}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
            />
            <Lock
              size={17}
              style={{
                position: "absolute",
                left: "12px",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <button
              type="button"
              className="auth-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="auth-submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              <span>Authenticating…</span>
            </>
          ) : (
            <>
              <span>Sign in to VM-HUB</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="auth-help">
        Need assistance or account access? Contact your Department Coordinator or Admin.
      </p>
    </div>
  );
}
