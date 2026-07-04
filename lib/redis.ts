import { Redis as UpstashRedis } from "@upstash/redis";
import { createClient, type RedisClientType } from "redis";

export interface KeyValueCache {
  del(key: string): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<void>;
}

class UpstashCache implements KeyValueCache {
  constructor(private readonly client: UpstashRedis) {}

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async get(key: string): Promise<string | null> {
    return (await this.client.get<string>(key)) ?? null;
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    if (options?.ex) {
      await this.client.set(key, value, { ex: options.ex });
      return;
    }

    await this.client.set(key, value);
  }
}

class NodeRedisCache implements KeyValueCache {
  constructor(private readonly client: RedisClientType) {}

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    if (options?.ex) {
      await this.client.set(key, value, { EX: options.ex });
      return;
    }

    await this.client.set(key, value);
  }
}

let redisCache: KeyValueCache | null = null;
let nodeRedisClient: RedisClientType | null = null;

export function getRedisClient(): KeyValueCache | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!redisCache) {
      redisCache = new UpstashCache(
        new UpstashRedis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN
        })
      );
    }

    return redisCache;
  }

  if (process.env.REDIS_URL) {
    if (!nodeRedisClient) {
      nodeRedisClient = createClient({
        url: process.env.REDIS_URL
      });
      nodeRedisClient.on("error", () => {
        // Redis is optional for the app's core behavior.
      });
      void nodeRedisClient.connect();
      redisCache = new NodeRedisCache(nodeRedisClient);
    }

    return redisCache;
  }

  return null;
}
