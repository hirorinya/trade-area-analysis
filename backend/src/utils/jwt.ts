import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const generateTokens = (payload: JWTPayload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h',
  });
  
  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
  
  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};