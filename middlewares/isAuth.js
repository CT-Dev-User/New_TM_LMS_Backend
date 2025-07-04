import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

export const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.token || req.cookies.token; // Check both header and cookie
    if (!token) 
      return res.status(403).json({
        message: "Please Login"
      });

    const decodedData = jwt.verify(token, process.env.Jwt_Sec);
    req.user = await User.findById(decodedData._id);

    next();
  } catch (error) {
    res.status(500).json({
      message: "Login First"
    });
  }
};

export const isAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not an admin",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const isInstructorOrAdmin = (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "instructor")) {
      return res.status(403).json({
        message: "You are not authorized (admin or instructor required)",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};