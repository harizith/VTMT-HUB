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
  return (
    <div className="auth">
      <header className="auth-top">
        <div className="auth-brand">
          <span className="shell-logo" aria-hidden="true">VM</span>
          VM-HUB
        </div>
        <span className="auth-top-note">Vel Tech Multi Tech · Autonomous</span>
      </header>

      <main className="auth-stage">
        <div className="auth-intro">
          <span className="auth-eyebrow"><i /> Academic portal</span>
          <h1 className="auth-headline">Everything for your college day, in one place.</h1>
          <p className="auth-lede">
            Sign in to see today&apos;s periods, mark attendance and read announcements from your department.
          </p>
        </div>

        <div className="auth-card-wrap">
          <section className="auth-panel">
            <LoginForm />
          </section>
        </div>

        <div className="auth-features" aria-hidden="true">
          <span>Timetable</span>
          <span>Attendance</span>
          <span>Notices</span>
        </div>
      </main>
    </div>
  );
}
