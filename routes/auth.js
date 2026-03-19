const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const crypto = require("crypto");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const passport = require("passport");
const nodemailer = require("nodemailer");

const EMAIL_USER = "SKN-ACKOMMODATION.response@gmail.com";
const EMAIL_PASS = "bmlz kxsx kpen jsar";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

async function sendMail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: `SKN-ACKOMMODATION <${EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

// Generate a random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Verify OTP
function verifyOTP(email, otp, purpose) {
  console.log("Verifying OTP for email:", email);
  console.log("OTP Store:", JSON.stringify([...otpStore]));

  const otpData = otpStore.get(email);

  if (!otpData) {
    console.log("No OTP found for email:", email);
    return { valid: false, message: "OTP not found or expired" };
  }

  if (otpData.expiresAt < Date.now()) {
    console.log("OTP expired for email:", email);
    otpStore.delete(email);
    return { valid: false, message: "OTP has expired" };
  }

  console.log("Stored OTP:", otpData.otp, "Received OTP:", otp);

  if (otpData.otp.toString() !== otp.toString()) {
    console.log("OTP mismatch");
    return { valid: false, message: "Invalid OTP" };
  }

  if (otpData.purpose !== purpose) {
    console.log("Invalid OTP purpose:", otpData.purpose, "Expected:", purpose);
    return {
      valid: false,
      message: "This OTP is not valid for password reset",
    };
  }

  // OTP is valid, remove it from store
  otpStore.delete(email);
  console.log("OTP verified successfully");
  return { valid: true };
}

// In-memory store for OTPs (in production, use Redis or database)
const otpStore = new Map();

// Store password reset tokens (in production, use database)
const resetTokens = new Map();

// Update sendOTP to use Nodemailer
async function sendOTP(email, res, purpose = "reset") {
  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  otpStore.set(email, { otp, expiresAt: otpExpiry, purpose });
  try {
    const subject =
      purpose === "login"
        ? "Your OTP for Login"
        : "Your OTP for Password Reset";
    const text = `Your verification code is: ${otp}`;
    const html = `<p>Your verification code is: <b>${otp}</b></p>`;
    await sendMail({ to: email, subject, text, html });
    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully", email });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
  }
}

// Forgot Password - Send OTP
router.post(
  "/forgot-password",
  wrapAsync(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "No account found with this email" });
    }

    try {
      // Generate and send OTP using the same function as login
      const otp = generateOTP();
      const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
      otpStore.set(email, { otp, expiresAt: otpExpiry, purpose: "reset" });

      // Send email using the same template as login
      const subject = "Your OTP for Password Reset";
      const text = `Your verification code for password reset is: ${otp}`;
      const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Use the following OTP to proceed:</p>
        <div style="background: #f4f4f4; padding: 10px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
          ${otp}
        </div>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

      await sendMail({ to: email, subject, text, html });

      res.json({
        success: true,
        message: "Password reset OTP sent to your email",
        email: email,
      });
    } catch (error) {
      console.error("Error sending password reset OTP:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to send OTP. Please try again.",
        });
    }
  }),
);

// Verify OTP and generate reset token
router.post(
  "/verify-reset-otp",
  wrapAsync(async (req, res) => {
    try {
      console.log("Received verify-reset-otp request:", req.body);
      const { email, otp } = req.body;

      if (!email || !otp) {
        console.log("Missing email or OTP");
        return res.status(400).json({
          success: false,
          message: "Email and OTP are required",
        });
      }

      // Verify OTP
      console.log("Verifying OTP for email:", email);
      const result = verifyOTP(email.trim(), otp.toString().trim(), "reset");

      if (!result.valid) {
        console.log("OTP verification failed:", result.message);
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 3600000; // 1 hour expiry

      // Store reset token
      resetTokens.set(resetToken, {
        email: email.trim(),
        expiresAt,
      });

      console.log("Reset token generated for email:", email);
      console.log("Current reset tokens:", [...resetTokens.keys()]);

      res.json({
        success: true,
        message: "OTP verified successfully",
        resetToken,
      });
    } catch (error) {
      console.error("Error in verify-reset-otp:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while verifying OTP",
      });
    }
  }),
);

// Reset password with token
router.post(
  "/reset-password",
  wrapAsync(async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    // Verify reset token
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    if (tokenData.expiresAt < Date.now()) {
      resetTokens.delete(token);
      return res
        .status(400)
        .json({ success: false, message: "Reset token has expired" });
    }

    // Find user and update password
    const user = await User.findOne({ email: tokenData.email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // Set new password
    await user.setPassword(newPassword);
    await user.save();

    // Clear the reset token
    resetTokens.delete(token);

    res.json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  }),
);

// Handle OTP login request
router.post(
  "/login-with-otp",
  wrapAsync(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No account found with this email" });
    }

    // Generate and send OTP
    return await sendOTP(email, res, "login");
  }),
);

// Verify OTP for login
router.post(
  "/verify-login-otp",
  wrapAsync(async (req, res) => {
    try {
      console.log("Received OTP verification request:", {
        email: req.body.email,
      });
      const { email, otp } = req.body;

      if (!email || !otp) {
        console.log("Missing email or OTP");
        return res
          .status(400)
          .json({ success: false, message: "Email and OTP are required" });
      }

      // Log OTP store state for debugging
      console.log("Current OTP store state:", otpStore);

      // Verify OTP
      const verification = verifyOTP(email, otp, "login");
      if (!verification.valid) {
        console.log("OTP verification failed:", verification.message);
        return res
          .status(400)
          .json({ success: false, message: verification.message });
      }

      console.log("OTP verified successfully, finding user...");

      // Find user and log them in
      const user = await User.findOne({ email });
      if (!user) {
        console.log("User not found for email:", email);
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      console.log("User found, attempting login...");

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Passport login error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Login failed" });
        }

        console.log("User logged in successfully");

        return res.status(200).json({
          success: true,
          message: "Login successful",
          redirectUrl: req.session.returnTo || "/listings",
        });
      });
    } catch (error) {
      console.error("Error in verify-login-otp:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during OTP verification",
      });
    }
  }),
);

// Send OTP to user's email for password reset
router.post(
  "/send-otp",
  wrapAsync(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Check if user exists (for password reset)
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No account found with this email" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store OTP with expiry
    otpStore.set(email, { otp, expiresAt: otpExpiry });

    try {
      // Send OTP via EmailJS
      const emailResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          verification_code: otp,
          to_name: email.split("@")[0],
          purpose: purpose === "login" ? "login" : "password reset",
        },
        EMAILJS_PUBLIC_KEY,
      );

      res.json({
        success: true,
        message: "Verification code sent successfully",
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send verification code",
      });
    }
  }),
);

// Verify OTP for both login and password reset
router.post(
  "/verify-otp",
  wrapAsync(async (req, res) => {
    try {
      const { email, otp, isPasswordReset } = req.body;

      if (!email || !otp) {
        console.log("Missing email or OTP in request");
        return res.status(400).json({
          success: false,
          message: "Email and OTP are required",
        });
      }

      console.log("Verifying OTP for email:", email);
      console.log("Current OTP store:", JSON.stringify([...otpStore]));

      const storedOtp = otpStore.get(email);

      // Check if OTP exists
      if (!storedOtp) {
        console.log("No OTP found for email:", email);
        return res.status(400).json({
          success: false,
          message: "OTP not found. Please request a new one.",
        });
      }

      // Check if OTP is expired
      if (storedOtp.expiresAt < Date.now()) {
        console.log("OTP expired for email:", email);
        otpStore.delete(email);
        return res.status(400).json({
          success: false,
          message: "OTP has expired. Please request a new one.",
        });
      }

      // Verify OTP
      console.log("Stored OTP:", storedOtp.otp, "Received OTP:", otp);
      if (storedOtp.otp.toString() !== otp.toString()) {
        console.log("OTP mismatch");
        return res.status(400).json({
          success: false,
          message: "Invalid OTP. Please try again.",
        });
      }

      // Check OTP purpose
      const expectedPurpose = isPasswordReset ? "reset" : "login";
      if (storedOtp.purpose !== expectedPurpose) {
        console.log(
          "Invalid OTP purpose:",
          storedOtp.purpose,
          "Expected:",
          expectedPurpose,
        );
        return res.status(400).json({
          success: false,
          message: "This OTP is not valid for this action.",
        });
      }

      // Clear used OTP
      otpStore.delete(email);
      console.log("OTP verified successfully for email:", email);

      if (isPasswordReset) {
        // For password reset, generate a token and return it
        const user = await User.findOne({ email });
        if (!user) {
          console.log("User not found for email:", email);
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        return res.json({
          success: true,
          message: "OTP verified successfully",
          resetToken: resetToken,
        });
      } else {
        // For login, log the user in
        return new Promise((resolve, reject) => {
          req.login({ email }, (err) => {
            if (err) {
              console.error("Login error:", err);
              reject(new Error("Login failed"));
            } else {
              resolve();
            }
          });
        })
          .then(() => {
            return res.json({
              success: true,
              message: "Login successful",
              redirectTo: "/listings",
            });
          })
          .catch((error) => {
            console.error("Error during login:", error);
            return res.status(500).json({
              success: false,
              message: error.message || "An error occurred during login",
            });
          });
      }
    } catch (error) {
      console.error("Error in verify-otp:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while verifying OTP",
      });
    }
  }),
);

// Forgot password - Send OTP
router.post(
  "/forgot-password",
  wrapAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No account found with that email address",
        });
    }
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    // Store OTP with expiry
    otpStore.set(email, { otp, expiresAt: otpExpiry });
    try {
      const subject = "Your OTP for Password Reset";
      const text = `Your verification code is: ${otp}`;
      const html = `<p>Your verification code is: <b>${otp}</b></p>`;
      await sendMail({ to: email, subject, text, html });
      res.json({
        success: true,
        message: "Verification code sent to your email",
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to send verification code" });
    }
  }),
);

// Reset password
router.post(
  "/reset-password",
  wrapAsync(async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      console.log("Reset password request received:", { token, newPassword });

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Reset token is required",
        });
      }

      if (!newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Both password fields are required",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match",
        });
      }

      // Find user by reset token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        console.log("Invalid or expired token:", token);
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired token. Please request a new password reset.",
        });
      }

      console.log("Resetting password for user:", user.email);

      // Set new password
      await user.setPassword(newPassword);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.log("Password reset successful for user:", user.email);

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Error logging in after password reset:", err);
          return res.json({
            success: true,
            message:
              "Password reset successful. You can now log in with your new password.",
            redirectTo: "/login",
          });
        }

        return res.json({
          success: true,
          message: "Password reset successful",
          redirectTo: "/listings",
        });
      });
    } catch (error) {
      console.error("Error in reset-password:", error);
      return res.status(500).json({
        success: false,
        message:
          "An error occurred while resetting your password. Please try again.",
      });
    }
  }),
);

// Resend OTP
router.post(
  "/resend-otp",
  wrapAsync(async (req, res) => {
    const { email, purpose } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    // Check if user exists for login or password reset
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No account found with this email" });
    }
    // Generate and send OTP
    return await sendOTP(email, res, purpose || "login");
  }),
);

module.exports = router;

