import jwt from 'jsonwebtoken';

export function auth(requiredRole = 'admin') {
  return (req, res, next) => {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      const roles = new Set([...(payload.roles || []), payload.role].filter(Boolean));
      if (requiredRole && !roles.has(requiredRole)) {
        return res.status(403).json({ ok: false, message: 'Forbidden' });
      }
      req.user = payload;
      next();
    } catch (e) {
      return res.status(401).json({ ok: false, message: 'Invalid token' });
    }
  };
}
