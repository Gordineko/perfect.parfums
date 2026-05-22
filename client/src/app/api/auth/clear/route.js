import { NextResponse } from "next/server";

export function GET(request) {
  const url = new URL("/", request.url);
  const res = NextResponse.redirect(url);
  res.cookies.delete("auth_token");
  res.cookies.delete("auth_id");
  return res;
}

