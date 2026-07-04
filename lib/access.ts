import type { NextRequest } from "next/server";

export function getAccessTokenFromRequest(request: NextRequest | Request): string | null {
  return request.headers.get("x-access-token");
}
