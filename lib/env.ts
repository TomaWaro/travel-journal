function withProtocol(value?: string) {
  if (!value) {
    return undefined;
  }

  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

function resolveAppUrl() {
  const explicitAppUrl = withProtocol(process.env.NEXT_PUBLIC_APP_URL);

  if (explicitAppUrl) {
    return explicitAppUrl;
  }

  const productionUrl = withProtocol(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  );

  if (
    (process.env.VERCEL_ENV === "production" ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production") &&
    productionUrl
  ) {
    return productionUrl;
  }

  return (
    withProtocol(
      process.env.VERCEL_BRANCH_URL ?? process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
    ) ??
    withProtocol(process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL) ??
    productionUrl ??
    "http://localhost:3000"
  );
}

export const appEnv = {
  appUrl: resolveAppUrl(),
  mapStyleUrl:
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://demotiles.maplibre.org/style.json",
  ownerAccessToken: process.env.OWNER_ACCESS_TOKEN ?? "owner-demo-token",
  useFileStore: process.env.USE_FILE_STORE !== "false",
  postgresConfigured: Boolean(process.env.DATABASE_URL),
  redisConfigured: Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ),
  blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN)
};
