import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET
const EXPIRES_IN = '7d'

/**
 * Maak een JWT aan voor een ingelogde user
 * Payload bevat userId zodat je hem in elke request beschikbaar hebt
 */
export function signToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: EXPIRES_IN })
}

/**
 * Verifieer een JWT en geef de payload terug
 * Gooit een error als het token ongeldig of verlopen is
 */
export function verifyToken(token) {
  return jwt.verify(token, SECRET)
}