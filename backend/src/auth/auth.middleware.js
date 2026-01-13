import jwt from "jsonwebtoken";

//////////
// Valide le JWT et retourne 401 sinon
// Extrait le payload du JWT et l'ajoute à requete.user
// Retourne: void ou redirect vers /auth/login
//////////
export function exigerAuthentification(requete, reponse, next) {
  const token = requete.cookies?.token;
  if (!token) return reponse.redirect("/auth/login");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    requete.user = { id: Number(payload.sub), email: payload.email };
    return next();
  } catch {
    return reponse.redirect("/auth/login");
  }
}






