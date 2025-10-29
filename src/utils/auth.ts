// Authentication utilities
export const hashPassword = async (password: string): Promise<string> => {
  // In production, use bcrypt or similar
  // For development, we'll use a simple hash
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const calculatedHash = await hashPassword(password)
  return calculatedHash === hash
}

// Simple session token generator
export const generateSessionToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Session expiration (24 hours)
export const getSessionExpiration = (): Date => {
  const date = new Date()
  date.setHours(date.getHours() + 24)
  return date
}

export const isSessionValid = (expiresAt: string): boolean => {
  return new Date(expiresAt) > new Date()
}
