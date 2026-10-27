import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET
const EXPIRES_IN = '30d'

/**
 * Maak een JWT aan voor een ingelogde user
 * Payload bevat userId zodat je hem in elke request beschikbaar hebt
 */
export function signToken(userObject) {
  return jwt.sign(userObject, SECRET, { expiresIn: EXPIRES_IN })
}

/**
 * Verifieer een JWT en geef de payload terug
 * Gooit een error als het token ongeldig of verlopen is
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { error: 'EXPIRED' };
    }
    console.error(error)
    return { error: 'INVALID' };
  }
}