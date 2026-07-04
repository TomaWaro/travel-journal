import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("DATABASE_URL or POSTGRES_URL is required.");
  process.exit(1);
}

const seedPath = path.join(process.cwd(), "data", "seed.travel-journal.json");
const seed = JSON.parse(await readFile(seedPath, "utf8"));

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query("begin");
  await client.query("delete from access_links where trip_id is not null");
  await client.query("delete from contributors");
  await client.query("delete from trips");

  await client.query(
    `insert into access_links (id, workspace_id, trip_id, member_id, role, label, token, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id)
     do update set
       workspace_id = excluded.workspace_id,
       trip_id = excluded.trip_id,
       member_id = excluded.member_id,
       role = excluded.role,
       label = excluded.label,
       token = excluded.token,
       created_at = excluded.created_at`,
    [
      seed.accessLinks[0].id,
      seed.accessLinks[0].workspaceId,
      seed.accessLinks[0].tripId,
      seed.accessLinks[0].memberId,
      seed.accessLinks[0].role,
      seed.accessLinks[0].label,
      seed.accessLinks[0].token,
      seed.accessLinks[0].createdAt
    ]
  );

  await client.query("commit");
  console.log("Postgres travel journal reset to empty workspace state.");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
