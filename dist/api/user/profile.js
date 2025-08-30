import { methodGuard, sendJSON } from "../_utils";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";
import { requireAuth } from "../_authGuard";
export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  await dbConnect();
  const auth = requireAuth(req, res);
  if (!auth) return;
  const user = await User.findById(auth.userId).lean();
  if (!user) return sendJSON(res, 404, { error: "Usuario no encontrado" });
  // Validación o aserción del tipo de _id antes de usar toString()
  let userId;
  if (typeof user._id === "string") {
    userId = user._id;
  } else if (
    typeof user._id === "object" &&
    user._id !== null &&
    "toString" in user._id
  ) {
    userId = user._id.toString();
  } else {
    return sendJSON(res, 500, { error: "ID de usuario inválido" });
  }
  return sendJSON(res, 200, {
    id: userId,
    username: user.username,
    email: user.email,
  });
}
