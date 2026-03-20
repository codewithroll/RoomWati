const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");

const router = express.Router();

const otpStore = new Map();
const resetTokens = new Map();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const MAIL_FROM = process.env.MAIL_FROM || EMAIL_USER;

const transporter =
  EMAIL_USER && EMAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      })
    : null;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function verifyOTP(email, otp, purpose) {
  const normalizedEmail = normalizeEmail(email);
  const otpData = otpStore.get(normalizedEmail);

  if (!otpData) {
    return { valid: false, message: "OTP not found or expired" };
  }

  if (otpData.expiresAt < Date.now()) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: "OTP has expired" };
  }

  if (otpData.otp !== String(otp).trim()) {
    return { valid: false, message: "Invalid OTP" };
  }

  if (otpData.purpose !== purpose) {
    return { valid: false, message: "This OTP is not valid for this action" };
  }

  otpStore.delete(normalizedEmail);
  return { valid: true };
}

async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    throw new Error(
      "Email service is not configured. Set EMAIL_USER and EMAIL_PASS.",
    );
  }

  return transporter.sendMail({
    from: MAIL_FROM ? `SKN-ACKOMMODATION <${MAIL_FROM}>` : to,
    to,
    subject,
    text,
    html,
  });
}

async function sendOTP(email, res, purpose = "login") {
  const normalizedEmail = normalizeEmail(email);
  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000;

  otpStore.set(normalizedEmail, { otp, expiresAt: otpExpiry, purpose });

  const subject =
    purpose === "login" ? "Your OTP for Login" : "Your OTP for Password Reset";
  const text = `Your verification code is: ${otp}`;
  const html = `<p>Your verification code is: <b>${otp}</b></p><p>This code expires in 10 minutes.</p>`;

  await sendMail({ to: normalizedEmail, subject, text, html });

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    email: normalizedEmail,
  });
}

router.post(
  "/forgot-password",
  wrapAsync(async (req, res) => {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No account found with this email" });
    }

    try {
      return await sendOTP(email, res, "reset");
    } catch (error) {
      console.error("Error sending forgot-password OTP:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to send OTP. Please try again.",
      });
    }
  }),
);

router.post(
  "/login-with-otp",
  wrapAsync(async (req, res) => {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No account found with this email" });
    }

    try {
      return await sendOTP(email, res, "login");
    } catch (error) {
      console.error("Error sending login OTP:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to send OTP. Please try again.",
      });
    }
  }),
);

router.post(
  "/verify-login-otp",
  wrapAsync(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const verification = verifyOTP(email, otp, "login");
    if (!verification.valid) {
      return res
        .status(400)
        .json({ success: false, message: verification.message });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    req.login(user, (err) => {
      if (err) {
        console.error("Passport login error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Login failed" });
      }

      const redirectUrl = req.session.returnTo || "/listings";
      delete req.session.returnTo;

      return res.status(200).json({
        success: true,
        message: "Login successful",
        redirectUrl,
      });
    });
  }),
);

router.post(
  "/verify-otp",
  wrapAsync(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    const isPasswordReset =
      req.body.isPasswordReset === true || req.body.isPasswordReset === "true";

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const verification = verifyOTP(email, otp, isPasswordReset ? "reset" : "login");
    if (!verification.valid) {
      return res
        .status(400)
        .json({ success: false, message: verification.message });
    }

    if (isPasswordReset) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      resetTokens.set(resetToken, {
        email,
        expiresAt: Date.now() + 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: "OTP verified successfully",
        resetToken,
        token: resetToken,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    req.login(user, (err) => {
      if (err) {
        console.error("Error during OTP login:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred during login",
        });
      }

      const redirectTo = req.session.returnTo || "/listings";
      delete req.session.returnTo;

      return res.json({
        success: true,
        message: "Login successful",
        redirectTo,
      });
    });
  }),
);

router.post(
  "/verify-reset-otp",
  wrapAsync(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const result = verifyOTP(email, otp, "reset");
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    resetTokens.set(resetToken, {
      email,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  }),
);

router.post(
  "/reset-password",
  wrapAsync(async (req, res) => {
    const token = String(req.body.token || "").trim();
    const newPassword = req.body.newPassword || req.body.password;
    const confirmPassword =
      req.body.confirmPassword || req.body.confirmNewPassword || newPassword;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const tokenData = resetTokens.get(token);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const user = await User.findOne({ email: tokenData.email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.setPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    resetTokens.delete(token);

    return res.json({
      success: true,
      message: "Password reset successful",
      redirectTo: "/login",
    });
  }),
);

router.post(
  "/resend-otp",
  wrapAsync(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const purpose = req.body.purpose === "reset" ? "reset" : "login";

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No account found with this email" });
    }

    try {
      return await sendOTP(email, res, purpose);
    } catch (error) {
      console.error("Error resending OTP:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to resend OTP. Please try again.",
      });
    }
  }),
);

module.exports = router;
