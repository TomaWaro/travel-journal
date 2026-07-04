export const appEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
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
