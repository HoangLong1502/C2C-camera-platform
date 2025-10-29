import pool from '../../database/config.js'

export interface User {
  id: number
  email: string
  role: string
  is_active: boolean
}

// Simple password hash for development
const hashPassword = (password: string): string => {
  // In production, use bcrypt
  // This is a simple hash for development only
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString()
}

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const passwordHash = hashPassword(password)
    const result = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE email = $1 AND password_hash = $2 AND is_active = TRUE',
      [email, passwordHash]
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export const createUser = async (email: string, password: string, role: string = 'user'): Promise<User | null> => {
  try {
    const passwordHash = hashPassword(password)
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, is_active',
      [email, passwordHash, role]
    )
    return result.rows[0]
  } catch (error) {
    console.error('Create user error:', error)
    return null
  }
}

export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [id]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}
