import { Redis } from '@upstash/redis'

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

const redis = redisUrl ? new Redis({ url: redisUrl, token: redisToken! }) : null

const mem = new Map<string, string>()

export async function kvGet<T = string>(key: string): Promise<T | null> {
  if (redis) return redis.get<T>(key)
  const val = mem.get(key)
  return val ? (JSON.parse(val) as T) : null
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  if (redis) {
    await redis.set(key, value)
  } else {
    mem.set(key, JSON.stringify(value))
  }
}

export async function kvDel(key: string): Promise<void> {
  if (redis) {
    await redis.del(key)
  } else {
    mem.delete(key)
  }
}

export async function kvKeys(pattern: string): Promise<string[]> {
  if (redis) return redis.keys(pattern)
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  return Array.from(mem.keys()).filter((k) => regex.test(k))
}

export async function kvSadd(key: string, value: string): Promise<number> {
  if (redis) return redis.sadd(key, value)
  const set = getMemSet(key)
  if (set.has(value)) return 0
  set.add(value)
  mem.set(key, JSON.stringify(Array.from(set)))
  return 1
}

export async function kvSrem(key: string, value: string): Promise<number> {
  if (redis) return redis.srem(key, value)
  const set = getMemSet(key)
  if (!set.has(value)) return 0
  set.delete(value)
  mem.set(key, JSON.stringify(Array.from(set)))
  return 1
}

export async function kvSmembers(key: string): Promise<string[]> {
  if (redis) return redis.smembers(key)
  return Array.from(getMemSet(key))
}

function getMemSet(key: string): Set<string> {
  const raw = mem.get(key)
  if (!raw) return new Set()
  try {
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}
