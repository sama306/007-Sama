import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'

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

async function readUsers(): Promise<StoredUser[]> {
  try {
    const data = await readFile(DATA_PATH, 'utf-8')
    return JSON.parse(data) as StoredUser[]
  } catch {
    return []
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(users, null, 2), 'utf-8')
}

export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  const users = await readUsers()
  return users.find((u) => u.email === email.toLowerCase())
}

export async function findUserById(id: string): Promise<StoredUser | undefined> {
  const users = await readUsers()
  return users.find((u) => u.id === id)
}

export async function createUser(
  name: string,
  email: string,
  password: string,
): Promise<Omit<StoredUser, 'password'>> {
  const users = await readUsers()
  const hashedPassword = await bcrypt.hash(password, 12)

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'user',
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  await writeUsers(users)

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
  const users = await readUsers()
  const index = users.findIndex((u) => u.email === email.toLowerCase())

  if (index === -1) {
    throw new Error('User not found')
  }

  users[index].password = await bcrypt.hash(newPassword, 12)
  await writeUsers(users)
}
