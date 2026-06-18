import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'
import { kvGet, kvSet, kvKeys } from './kv'

const DATA_PATH = join(process.cwd(), 'src', 'data', 'users.json')

export interface StoredUser {
  id: string
  name: string
  email: string
  password: string
  image?: string
  role: 'user'
  createdAt: string
}

function userKeyById(id: string): string {
  return `user:id:${id}`
}

function userKeyByEmail(email: string): string {
  return `user:email:${email.toLowerCase()}`
}

async function seedFromJson(): Promise<void> {
  try {
    const existing = await kvKeys('user:id:*')
    if (existing.length > 0) return

    const data = await readFile(DATA_PATH, 'utf-8')
    const users = JSON.parse(data) as StoredUser[]
    for (const user of users) {
      await kvSet(userKeyById(user.id), user)
      await kvSet(userKeyByEmail(user.email), user.id)
    }
  } catch {
    /* noop */
  }
}

export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  await seedFromJson()
  const id = await kvGet<string>(userKeyByEmail(email))
  if (!id) return undefined
  return (await kvGet<StoredUser>(userKeyById(id))) ?? undefined
}

export async function findUserById(id: string): Promise<StoredUser | undefined> {
  await seedFromJson()
  return (await kvGet<StoredUser>(userKeyById(id))) ?? undefined
}

export async function createUser(
  name: string,
  email: string,
  password: string,
): Promise<Omit<StoredUser, 'password'>> {
  const hashedPassword = await bcrypt.hash(password, 12)

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'user',
    createdAt: new Date().toISOString(),
  }

  await kvSet(userKeyById(user.id), user)
  await kvSet(userKeyByEmail(user.email), user.id)

  const { password: _, ...safeUser } = user
  return safeUser
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

export async function updateUserPassword(email: string, newPassword: string): Promise<void> {
  const existing = await findUserByEmail(email)
  if (!existing) throw new Error('User not found')
  existing.password = await bcrypt.hash(newPassword, 12)
  await kvSet(userKeyById(existing.id), existing)
}
