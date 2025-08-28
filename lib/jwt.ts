import * as jwt from "jsonwebtoken";
import type { IncomingHttpHeaders } from "http";

const SECRET: jwt.Secret = process.env.JWT_SECRET as jwt.Secret;
if (!SECRET) throw new Error("Missing JWT_SECRET");

const DEFAULT_EXPIRES_IN = "7d" as const;

export interface JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  expiresIn: string | number = DEFAULT_EXPIRES_IN
) {
  const options: jwt.SignOptions = {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, SECRET, options);
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}

export function getBearer(headers: IncomingHttpHeaders) {
  const raw = (headers.authorization || (headers as any).Authorization) as string | undefined;
  if (!raw) return null;
  const [scheme, token] = raw.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

