import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false as const, status: 401, error: "Not authenticated" };
  }

  if ((session.user as any).role !== "ADMIN") {
    return { ok: false as const, status: 403, error: "Administrator access required" };
  }

  return { ok: true as const, email: session.user.email };
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false as const, status: 401, error: "Not authenticated" };
  }

  return { ok: true as const, email: session.user.email };
}
