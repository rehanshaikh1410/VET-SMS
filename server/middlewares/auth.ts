import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.ts";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        username: string;
        role: string;
      };
    }
  }
}

export const generateToken = (user: any) => {
  const { _id, username, role } = user;
  return jwt.sign(
    { _id, username, role },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as jwt.JwtPayload;

    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      _id: user._id.toString(),
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Optional: Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    next();
  };
};