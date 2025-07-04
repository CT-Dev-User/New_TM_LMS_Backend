import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendMail from "../middlewares/sendMail.js";
import { TryCatch } from "../middlewares/TryCatch.js";
import { User } from "../models/user.js";

// Register user and send OTP for activation
export const register = TryCatch(async (req, res) => {
  const { name, email, password,contact } = req.body;
  let user = await User.findOne({ email });
  
  if (user) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user = {
    name,
    email,
    password: hashedPassword,
    contact
  };

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  const activationToken = jwt.sign(
    { user, otp },
    process.env.Activation_Secret,
    { expiresIn: '5m' }
  );

  const data = { name, otp };
  await sendMail(email, "TMLMS - Account Activation", data);
  
  res.status(200).json({
    message: 'OTP sent to your email',
    activationToken,
  });
});

// Verify OTP for user registration
export const verifyUser = TryCatch(async (req, res) => {
  const { otp, activationToken } = req.body;
  
  try {
    const decoded = jwt.verify(activationToken, process.env.Activation_Secret);

    if (String(decoded.otp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await User.create({
      name: decoded.user.name,
      email: decoded.user.email,
      password: decoded.user.password,
      contact: decoded.user.contact,
    });

    res.status(200).json({ message: "User registered successfully" });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "OTP has expired" });
    }
    return res.status(400).json({ message: "Error verifying user" });
  }
});

// User login
export const loginUser = TryCatch(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    return res.status(400).json({ message: "Wrong password" });
  }

  const token = jwt.sign(
    { _id: user._id },
    process.env.Jwt_Sec,
    { expiresIn: "15d" }
  );

  // Optional: Set token as HttpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure in production
    sameSite: 'strict',
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  });

  res.status(200).json({
    message: `Welcome back ${user.name}`,
    token, // Keep token in response for localStorage
    user,
  });
});

// User logout
export const logout = TryCatch(async (req, res) => {
  // Clear the cookie (if using cookies)
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0), // Expire immediately
  });

  res.status(200).json({
    message: "Logged out successfully",
  });
});

// Get user profile
export const myProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  res.json({ user });
});

// Forgot password: Generate OTP for reset
export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  const resetToken = jwt.sign(
    { email: user.email, otp },
    process.env.Reset_Secret,
    { expiresIn: '15m' }
  );

  await sendMail(email, "Password Reset", { otp }, 'reset-password-otp');
  
  res.status(200).json({
    message: "OTP sent to your email for password reset",
    resetToken,
  });
});

// Reset password after OTP verification
export const resetPassword = TryCatch(async (req, res) => {
  const { resetToken, otp, newPassword } = req.body;
  
  try {
    const { email, otp: correctOTP } = jwt.verify(resetToken, process.env.Reset_Secret);

    if (String(otp) !== String(correctOTP)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "Reset token has expired. Please request a new one." });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: "Invalid reset token" });
    }
    return res.status(400).json({ message: "Error resetting password" });
  }
});

// Update user profile (name, bio, profile image)
// export const updateProfile = TryCatch(async (req, res) => {
//   const { name, bio, location, profileImage, profileComplete } = req.body;
//   const userId = req.user._id;
  
//   const user = await User.findById(userId);
//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   if (name) user.name = name;
//   if (profileImage !== undefined) user.profileImage = profileImage;
//   if (profileComplete !== undefined) user.profileComplete = profileComplete;

//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Profile updated successfully",
//     user
//   });
// });



// Update user profile (name, bio, profile image, contact)
export const updateProfile = TryCatch(async (req, res) => {
  const { name, bio, location, profileImage, profileComplete, contact } = req.body; // ✅ Add contact here
  const userId = req.user._id;
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (name) user.name = name;
  if (profileImage !== undefined) user.profileImage = profileImage;
  if (profileComplete !== undefined) user.profileComplete = profileComplete;
  if (contact) user.contact = contact; // ✅ Add this line to handle contact updates

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user
  });
});
