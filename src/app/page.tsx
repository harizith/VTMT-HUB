import LoginForm from "@/components/LoginForm";
import BrandLogo from "@/components/BrandLogo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldCheck, Calendar, Bell, Users } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const role = ((session.user as any)?.role || "").toUpperCase();
    if (role === "ADMIN") {
      redirect("/admin");
    } else if (role === "HOD") {
      redirect("/hod");
    } else if (["TEACHER", "FACULTY", "STAFF"].includes(role)) {
      redirect("/teacher");
    } else {
      redirect("/student");
    }
  }

  // A deterministic sample week: 0 = free period, 1 = class, 2 = lab, 3 = tutorial
  const week = [
    [1, 1, 0, 2, 2, 1],
    [1, 3, 1, 1, 0, 0],
    [2, 2, 1, 0, 1, 3],
    [1, 0, 1, 1, 3, 1],
    [3, 1, 1, 2, 2, 0],
  ];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="auth">
      <section className="auth-hero" aria-label="About VM-HUB">
        <div className="auth-brand">
          <BrandLogo size="lg" subtitle="ACADEMIC OPERATIONS HUB" />
        </div>

        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#93c5fd",
              marginBottom: "1.25rem",
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "#34d399",
                boxShadow: "0 0 8px #34d399",
              }}
            />
            Academic Session 2026–2027 • Live
          </div>

          <h1 className="auth-headline">
            Your timetable, attendance and notices in one place.
          </h1>

          <p className="auth-lede" style={{ marginTop: "1rem" }}>
            Sign in with your college account to see today&apos;s periods, mark attendance and read
            announcements from your department.
          </p>
        </div>

        {/* Interactive Period Matrix Preview */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              maxWidth: "580px",
              marginBottom: "0.5rem",
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.65)",
              fontWeight: 600,
            }}
          >
            <span>LIVE SCHEDULE MATRIX</span>
            <span style={{ color: "#38bdf8" }}>PERIODS 1 – 6</span>
          </div>

          <div className="auth-week" aria-hidden="true">
            {week.map((row, d) => (
              <div key={days[d]} style={{ display: "contents" }}>
                <span className="auth-week-label">{days[d]}</span>
                {row.map((kind, p) => {
                  const index = d * 6 + p;
                  const cls =
                    kind === 0
                      ? "auth-week-cell"
                      : `auth-week-cell filled${kind === 2 ? " alt" : kind === 3 ? " soft" : ""}`;
                  return (
                    <span
                      key={p}
                      className={cls}
                      style={{ ["--i" as string]: index } as React.CSSProperties}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
            paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: "0.8rem",
            color: "rgba(255, 255, 255, 0.7)",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ShieldCheck size={16} color="#34d399" />
            <span>Autonomous ERP 2.0</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Calendar size={16} color="#60a5fa" />
            <span>Day Order Dynamic</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Users size={16} color="#c084fc" />
            <span>Role-Based Access</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <LoginForm />
      </section>
    </div>
  );
}
