import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest, TOKEN_COOKIE } from "@/lib/auth/cookie";

/** Çıkış: cookie silinir. Backend'de oturum ya da token iptali olmadığı için başka bir şey yapılmaz. */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ title: "Forbidden", status: 403 }, { status: 403 });
  }
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(TOKEN_COOKIE);
  return response;
}
