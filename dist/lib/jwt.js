import * as jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("Missing JWT_SECRET");
const DEFAULT_EXPIRES_IN = "7d";
export function signJwt(payload, expiresIn = DEFAULT_EXPIRES_IN) {
  const options = {
    expiresIn: expiresIn,
  };
  return jwt.sign(payload, SECRET, options);
}
export function verifyJwt(token) {
  return jwt.verify(token, SECRET);
}
export function getBearer(headers) {
  const raw = headers.authorization || headers.Authorization;
  if (!raw) return null;
  const [scheme, token] = raw.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}
