import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/auth/login");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub), email: payload.email };
    return next();
  } catch {
    return res.redirect("/auth/login");
  }
}
