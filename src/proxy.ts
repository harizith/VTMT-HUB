import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = (token?.role as string)?.toUpperCase();

    // Role-based route authorization
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/hod") && role !== "HOD" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      path.startsWith("/teacher") &&
      !["TEACHER", "FACULTY", "STAFF", "HOD", "ADMIN"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/",
    },
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/hod/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
