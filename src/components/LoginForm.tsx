"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, User } from "lucide-react";

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

    let targetEmail = email.trim().toLowerCase();
    const targetPassword = password.trim();

    // Friendly alias mappings
    if (targetEmail === "student") {
      targetEmail = "student@vtmt.org";
    } else if (targetEmail === "admin") {
      targetEmail = "admin@vtmt.org";
    } else if (targetEmail === "teacher" || targetEmail === "faculty") {
      targetEmail = "teacher@vtmt.org";
    } else if (targetEmail === "hod") {
      targetEmail = "hod@vtmt.org";
    }

    try {
      const res = await signIn("credentials", {
        email: targetEmail,
        password: targetPassword,
        redirect: false,
      });

      if (res?.ok && !res?.error) {
        // Direct role-based routing based on credential identity
        if (targetEmail.includes("admin") || targetEmail.includes("adm")) {
          window.location.href = "/admin";
        } else if (targetEmail.includes("hod")) {
          window.location.href = "/hod";
        } else if (targetEmail.includes("teacher") || targetEmail.includes("emp")) {
          window.location.href = "/teacher";
        } else {
          window.location.href = "/student";
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
        <h1 style={{ fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 0.35rem 0", color: "var(--text-main)" }}>
          Sign in
        </h1>
        <p className="auth-sub" style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Use your institutional college credentials to continue.
        </p>
      </div>

      {errorMsg && (
        <div className="auth-error" role="alert" style={{ marginBottom: "1.25rem" }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-field" style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="email" style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.4rem", display: "block", color: "var(--text-main)" }}>
            College Email or Roll Number
          </label>
          <div className="auth-input-wrap">
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@veltechmultitech.org or Roll No"
              className="auth-input"
              style={{ paddingLeft: "38px" }}
              required
              autoFocus
            />
            <User
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

        <div className="auth-field" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <label htmlFor="password" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)" }}>
              Password
            </label>
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

        <button type="submit" className="auth-submit" disabled={isLoading} style={{ width: "100%", padding: "0.8rem", borderRadius: "10px", fontWeight: 800 }}>
          {isLoading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              <span>Authenticating…</span>
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <span>Sign in to VM-HUB</span>
              <ArrowRight size={16} />
            </span>
          )}
        </button>
      </form>

      <p className="auth-help" style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", marginTop: "1.5rem" }}>
        Vel Tech Multi Tech Autonomous Portal • Secured Session
      </p>
    </div>
  );
}
