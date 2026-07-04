import type { NextRequest } from "next/server";

const demoAccessTokens = new Set(["owner-demo-token", "son-demo-token"]);

export function getAccessTokenFromRequest(request: NextRequest | Request): string | null {
  return request.headers.get("x-access-token");
}

export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function isDemoAccessToken(token: string): boolean {
  return demoAccessTokens.has(token);
}

export function getConfiguredOwnerAccessToken(): string | null {
  const token = process.env.OWNER_ACCESS_TOKEN?.trim();
  return token ? token : null;
}

export function isConfiguredOwnerAccessToken(token: string): boolean {
  const configuredToken = getConfiguredOwnerAccessToken();
  return Boolean(configuredToken && token === configuredToken);
}

export function shouldHidePrivateAccessLinks(): boolean {
  return isProductionDeployment();
}
