import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    return;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/forgot-password") ||
          pathname.startsWith("/otp-verification") ||
          pathname.startsWith("/reset-password") ||
          pathname.startsWith("/success")
        ) {
          return true;
        }

        return Boolean(token?.role === "admin");
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/user-management/:path*",
    "/location-management/:path*",
    "/alert-management/:path*",
    "/settings/:path*",
    "/login",
    "/forgot-password",
    "/otp-verification",
    "/reset-password",
    "/success",
  ],
};
