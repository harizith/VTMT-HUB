import Clock from "@/components/Clock";
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
    <div className="login-page-container">
      {/* Left Pane - Branding & Clock */}
      <div className="login-left-pane">
        <div className="left-pane-content">
          <p className="portal-label">DEPARTMENT PORTAL</p>
          <h1 className="brand-title">Period.</h1>
          
          <div className="clock-wrapper">
            <Clock />
          </div>
          
          <div className="bottom-text">
            <p>Welcome to VM-HUB.</p>
            <p>Your academic life, organized.</p>
          </div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="login-right-pane">
        <LoginForm />
      </div>
    </div>
  );
}
