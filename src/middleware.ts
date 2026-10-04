import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = Boolean(req.auth);
  const pathname = req.nextUrl.pathname;

  if (!isAuth && pathname !== "/signin") {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (isAuth && pathname === "/signin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
