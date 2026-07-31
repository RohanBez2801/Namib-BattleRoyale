import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SUPABASE_JWT_SECRET = process.env["SUPABASE_JWT_SECRET"] || "dev-secret-only-for-local";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    isGuest: boolean;
  };
}

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  // We use 'any' for 'req' here temporarily to bypass the IDE's 
  // inability to see the Express Type definitions until you restart.
  const authHeader = req.headers?.authorization;
  const guestHeader = req.headers?.["nbr-profile-id"] as string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, SUPABASE_JWT_SECRET!) as { sub: string };
      req.user = { id: decoded.sub, isGuest: false };
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  } else if (guestHeader) {
    req.user = { id: guestHeader, isGuest: true };
    next();
  } else {
    res.status(401).json({ error: "Auth required" });
  }
};