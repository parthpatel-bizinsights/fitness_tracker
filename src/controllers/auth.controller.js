const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, RefreshToken } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");
const { sendEmail, generateEmailTemplate } = require("../services/email.service");
const admin = require("../../utils/firebase.util");

// Access & Refresh token helpers
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET || "your_access_secret_min_32_chars",
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
  );
};

const generateRefreshTokenString = () => {
  return crypto.randomBytes(40).toString("hex");
};

// Set refresh token in HttpOnly cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "fullName, email, and password are required"));
    }

    // Check duplicate
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return next(new apiError(HTTP_STATUS.CONFLICT, HTTP_CODE.DATA_EXIST, "User with this email already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      verificationToken
    });

    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
    
    const emailHtml = generateEmailTemplate(
      "Verify your Email Address",
      "Welcome to Aura Fitness! Please verify your email.",
      `Hi ${fullName},<br><br>Welcome to Aura Fitness! To get started and unlock your personalized training dashboard, please verify your email address by clicking the button below.`,
      "Verify Email",
      verifyUrl
    );

    await sendEmail({
      to: email,
      subject: "Welcome to Aura Fitness - Verify your Email",
      html: emailHtml
    });

    res.status(HTTP_STATUS.CREATED).json(
      new apiResponse(HTTP_STATUS.CREATED, HTTP_CODE.CREATED, "Registration successful. Please check your email to verify your account.", null)
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Email and password are required"));
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new apiError(HTTP_STATUS.UNAUTHORIZED, HTTP_CODE.UNAUTHORIZED, "Invalid email or password"));
    }

    if (!user.isEmailVerified) {
      return next(new apiError(HTTP_STATUS.FORBIDDEN, HTTP_CODE.FORBIDDEN, "Please verify your email address before logging in."));
    }

    const accessToken = generateAccessToken(user);
    const refreshTokenVal = generateRefreshTokenString();
    
    // Store in DB
    await RefreshToken.create({
      userId: user.id,
      token: refreshTokenVal,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshTokenCookie(res, refreshTokenVal);

    const cleanUser = user.toJSON();
    delete cleanUser.password;

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Login successful", {
        accessToken,
        refreshToken: refreshTokenVal,
        user: cleanUser,
      })
    );
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Verification token is required"));
    }

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Invalid or expired verification token"));
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    await user.save();

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Email verified successfully. You can now log in.", null)
    );
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await RefreshToken.destroy({ where: { token } });
    }
    
    res.clearCookie("refreshToken");
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Logout successful", null)
    );
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return next(new apiError(HTTP_STATUS.UNAUTHORIZED, HTTP_CODE.UNAUTHORIZED, "Refresh token is missing"));
    }

    const storedToken = await RefreshToken.findOne({ where: { token } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) await RefreshToken.destroy({ where: { id: storedToken.id } });
      return next(new apiError(HTTP_STATUS.REAUTHENTICATE, HTTP_CODE.REAUTHENTICATE, "Refresh token expired or invalid"));
    }

    const user = await User.findByPk(storedToken.userId);
    if (!user) {
      return next(new apiError(HTTP_STATUS.UNAUTHORIZED, HTTP_CODE.UNAUTHORIZED, "User not found"));
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshTokenVal = generateRefreshTokenString();

    await RefreshToken.destroy({ where: { id: storedToken.id } });
    await RefreshToken.create({
      userId: user.id,
      token: newRefreshTokenVal,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshTokenCookie(res, newRefreshTokenVal);

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Token refreshed successfully", {
        accessToken: newAccessToken,
      })
    );
  } catch (error) {
    next(error);
  }
};

// Temp store for resets (mocking Redis/DB token with memory store in dev)
const resetOTPStore = new Map();

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Email is required"));
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "User with this email not found"));
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    resetOTPStore.set(email, {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    });

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?email=${encodeURIComponent(email)}`;
    
    const emailHtml = generateEmailTemplate(
      "Reset your Password",
      "We received a request to reset your password.",
      `Hi ${user.fullName},<br><br>We received a request to reset your Aura Fitness password. Use the verification code below to securely reset it:<br><br><strong style="font-size: 24px; color: #8b5cf6; letter-spacing: 4px;">${otp}</strong><br><br>This code will expire in 15 minutes.`,
      "Reset Password",
      resetUrl
    );

    await sendEmail({
      to: email,
      subject: "Aura Fitness - Password Reset Code",
      html: emailHtml,
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Password reset OTP sent to email", null)
    );
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "email, otp, and newPassword are required"));
    }

    const record = resetOTPStore.get(email);
    if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Invalid or expired OTP"));
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "User not found"));
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    
    // Clear OTP
    resetOTPStore.delete(email);

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Password reset successful", null)
    );
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const cleanUser = req.user.toJSON();
    delete cleanUser.password;
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Profile retrieved", cleanUser)
    );
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      "fullName", "age", "gender", "height", "currentWeight", 
      "goal", "experienceLevel", "equipment", "unitSystem", 
      "avatarUrl", "onboardingComplete"
    ];
    
    allowedUpdates.forEach((update) => {
      if (req.body[update] !== undefined) {
        req.user[update] = req.body[update];
      }
    });

    await req.user.save();
    
    const cleanUser = req.user.toJSON();
    delete cleanUser.password;

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Profile updated successfully", cleanUser)
    );
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "currentPassword and newPassword are required"));
    }

    if (!(await bcrypt.compare(currentPassword, req.user.password))) {
      return next(new apiError(HTTP_STATUS.UNAUTHORIZED, HTTP_CODE.UNAUTHORIZED, "Incorrect current password"));
    }

    req.user.password = await bcrypt.hash(newPassword, 12);
    await req.user.save();

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Password changed successfully", null)
    );
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await req.user.destroy();
    res.clearCookie("refreshToken");
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Account deleted successfully", null)
    );
  } catch (error) {
    next(error);
  }
};
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "ID token is required"));
    }

    // Verify token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "No email found in Google token"));
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (user) {
      // User exists. If they originally signed up via email/password, 
      // linking is implicit (we just let them log in since emails match and Google verified it).
      // If we want to strictly track, we can update googleId if not present:
      if (!user.googleId) {
        user.googleId = uid;
        user.authProvider = "google";
        user.isEmailVerified = true;
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        await user.save();
      }
    } else {
      // Create new user with Google Auth
      user = await User.create({
        fullName: name || "Google User",
        email,
        password: crypto.randomBytes(32).toString("hex"), // Fake random password
        isEmailVerified: true,
        authProvider: "google",
        googleId: uid,
        avatarUrl: picture || null,
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshTokenVal = generateRefreshTokenString();

    await RefreshToken.create({
      userId: user.id,
      token: refreshTokenVal,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshTokenCookie(res, refreshTokenVal);

    const cleanUser = user.toJSON();
    delete cleanUser.password;

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Google Login successful", {
        accessToken,
        refreshToken: refreshTokenVal,
        user: cleanUser,
      })
    );
  } catch (error) {
    console.error("Google Auth Error:", error);
    next(new apiError(HTTP_STATUS.UNAUTHORIZED, HTTP_CODE.UNAUTHORIZED, "Invalid or expired Google token"));
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  verifyEmail,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
};
