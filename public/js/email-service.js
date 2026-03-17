// EmailJS configuration
(function () {
  emailjs.init("lKQMX4p-cSyYhv0-7"); // Using the same EmailJS public key from Astralock
})();

// Function to send verification email
function sendVerificationEmail(email, otp) {
  return emailjs.send("service_h9a8bgc", "template_zuuk2t1", {
    to_email: email,
    verification_code: otp,
    to_name: email.split("@")[0],
  });
}

// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in session storage
function storeOTP(email, otp) {
  sessionStorage.setItem("otpEmail", email);
  sessionStorage.setItem("otpCode", otp);
  sessionStorage.setItem("otpExpiry", Date.now() + 10 * 60 * 1000); // 10 minutes expiry
}

// Verify OTP
function verifyOTP(email, otp) {
  const storedEmail = sessionStorage.getItem("otpEmail");
  const storedOTP = sessionStorage.getItem("otpCode");
  const expiry = parseInt(sessionStorage.getItem("otpExpiry") || "0");

  if (!storedEmail || !storedOTP || !expiry) {
    return { isValid: false, message: "OTP expired or invalid" };
  }

  if (Date.now() > expiry) {
    clearOTP();
    return { isValid: false, message: "OTP has expired" };
  }

  if (email === storedEmail && otp === storedOTP) {
    clearOTP();
    return { isValid: true, message: "OTP verified successfully" };
  }

  return { isValid: false, message: "Invalid OTP" };
}

// Clear OTP from storage
function clearOTP() {
  sessionStorage.removeItem("otpEmail");
  sessionStorage.removeItem("otpCode");
  sessionStorage.removeItem("otpExpiry");
}

// Export functions
window.emailService = {
  sendVerificationEmail,
  generateOTP,
  storeOTP,
  verifyOTP,
  clearOTP,
};
