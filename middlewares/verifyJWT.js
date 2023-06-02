export const verifyJWT = (req, res, next) => {
  if (req.query.token === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9") {
    next();
  } else {
    return res.status(401).json({ ok: false, msg: "denegado, falta el jwt" });
  }
};
