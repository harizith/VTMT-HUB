import LoginForm from "@/components/LoginForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

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
          <span className="shell-logo" aria-hidden="true">VM</span>
          VM-HUB
        </div>
        <h1 className="auth-headline">Your timetable, attendance and notices in one place.</h1>
        <p className="auth-lede">
          Sign in with your college account to see today&apos;s periods, mark attendance and read
          announcements from your department.
        </p>
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
      </section>

      <section className="auth-panel">
        <LoginForm />
      </section>
    </div>
  );
}
