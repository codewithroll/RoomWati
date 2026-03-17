// Forgot Password Form Handler
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("email");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  const submitSpinner = document.getElementById("submitSpinner");
  const submitButtonText = document.getElementById("submitButtonText");
  const otpSection = document.getElementById("otpSection");
  const otpInput = document.getElementById("otp");
  const resendOtpBtn = document.getElementById("resendOtp");
  const resetForm = document.getElementById("resetPasswordForm");
  const resetToken = document.getElementById("resetToken");
  const forgotPasswordForm = document.querySelector(".forgot-password-form");
  const verifyOtpForm = document.querySelector(".verify-otp-form");

  let email = "";
  let resetTokenValue = "";
  let isVerificationStep = false;

  // Handle form submission for sending OTP
  form?.addEventListener("submit", async function (e) {
    e.preventDefault();

    email = emailInput.value.trim();

    if (!email) {
      showError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);

      // Send request to send OTP
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      // Show OTP input section and hide email form
      if (forgotPasswordForm && verifyOtpForm) {
        forgotPasswordForm.classList.add("d-none");
        verifyOtpForm.classList.remove("d-none");
      } else {
        // Fallback to old behavior if new elements not found
        otpSection?.classList.remove("d-none");
      }

      successMessage.textContent =
        "We've sent a verification code to your email. Please check your inbox.";
      successMessage.classList.remove("d-none");
      errorMessage.classList.add("d-none");

      // Set flag to indicate we're in verification step
      isVerificationStep = true;
    } catch (error) {
      showError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  // Handle OTP verification
  form?.addEventListener("submit", async function (e) {
    if (isVerificationStep) {
      e.preventDefault();

      const otp = otpInput?.value.trim();

      if (!otp || otp.length !== 6) {
        showError("Please enter a valid 6-digit OTP");
        return;
      }

      try {
        setLoading(true);

        // Verify OTP using the correct endpoint
        const response = await fetch("/auth/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            otp: otp.trim(),
            isPasswordReset: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to verify OTP");
        }

        console.log("OTP verification response:", data);

        // Store the reset token from the response
        resetTokenValue = data.resetToken || data.token;

        if (!resetTokenValue) {
          console.error("No reset token received in the response");
          throw new Error("Failed to get reset token. Please try again.");
        }

        // Update the hidden token input field if it exists
        if (resetToken) {
          resetToken.value = resetTokenValue;
        }

        // Hide OTP form and show reset password form
        const resetPasswordForm = document.querySelector(
          ".reset-password-form",
        );
        if (verifyOtpForm && resetPasswordForm) {
          verifyOtpForm.classList.add("d-none");
          resetPasswordForm.classList.remove("d-none");

          // Set the token in the hidden input
          const tokenInput = document.getElementById("resetToken");
          if (tokenInput) {
            tokenInput.value = resetTokenValue;
            console.log("Reset token set in hidden input:", tokenInput.value);
          }

          // Update success message
          successMessage.textContent =
            "OTP verified! Please set your new password.";
          successMessage.classList.remove("d-none");

          // Log the token for debugging
          console.log("Reset token set:", resetTokenValue);
        } else {
          console.error(
            "Could not find verifyOtpForm or resetPasswordForm elements",
          );
          // Fallback to old behavior if new elements not found
          form.style.display = "none";
          resetForm?.classList.remove("d-none");
        }

        // Reset verification step flag
        isVerificationStep = false;
      } catch (error) {
        showError(error.message || "Failed to verify OTP. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  });

  // Handle password reset form submission
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const password = document.getElementById("password")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;
    const resetTokenInput = document.getElementById("resetToken");
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");

    // Reset messages
    if (errorMessage) errorMessage.classList.add("d-none");
    if (successMessage) successMessage.classList.add("d-none");

    // Validate inputs
    if (!password || !confirmPassword) {
      showError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      showError("Password must be at least 8 characters long");
      return;
    }

    // Get the token from the hidden input
    const tokenToUse = resetTokenInput?.value || resetTokenValue;

    if (!tokenToUse) {
      console.error("No reset token available");
      showError("Invalid reset token. Please request a new password reset.");
      return;
    }

    console.log("Sending reset request with token:", tokenToUse);

    try {
      // Show loading state
      const resetButton = document.querySelector(
        '#resetPasswordForm button[type="submit"]',
      );
      const spinner = document.createElement("span");
      spinner.className = "spinner-border spinner-border-sm me-2";
      spinner.setAttribute("role", "status");
      spinner.setAttribute("aria-hidden", "true");

      if (resetButton) {
        resetButton.disabled = true;
        resetButton.insertBefore(spinner, resetButton.firstChild);
      }

      // Send request to reset password
      const response = await fetch("/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tokenToUse,
          newPassword: password,
          confirmPassword: confirmPassword,
        }),
      });

      const data = await response.json();
      console.log("Reset password response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      // Show success message
      if (successMessage) {
        successMessage.textContent =
          "Password reset successfully! Redirecting to login...";
        successMessage.classList.remove("d-none");
        if (errorMessage) errorMessage.classList.add("d-none");
      }

      // Hide reset form
      const resetPasswordForm = document.querySelector(".reset-password-form");
      if (resetPasswordForm) {
        resetPasswordForm.style.display = "none";
      }

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error) {
      console.error("Error resetting password:", error);
      showError(error.message || "Failed to reset password. Please try again.");
    } finally {
      // Reset loading state
      const resetButton = document.querySelector(
        '#resetPasswordForm button[type="submit"]',
      );
      if (resetButton) {
        resetButton.disabled = false;
        const spinner = resetButton.querySelector(".spinner-border");
        if (spinner) {
          spinner.remove();
        }
      }
    }
  };

  // Add event listener for reset password form
  document
    .getElementById("resetPasswordForm")
    ?.addEventListener("submit", handleResetPassword);

  // Handle resend OTP
  resendOtpBtn?.addEventListener("click", async function () {
    if (!email) {
      showError("Please enter your email address first");
      return;
    }

    try {
      setLoading(true);

      // Send request to resend OTP
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      successMessage.textContent = "New OTP has been sent to your email.";
      successMessage.classList.remove("d-none");
      errorMessage.classList.add("d-none");
    } catch (error) {
      showError(error.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  // Helper functions
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("d-none");
    successMessage.classList.add("d-none");

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      errorMessage.classList.add("d-none");
    }, 5000);
  }

  function setLoading(
    isLoading,
    spinnerId = "submitSpinner",
    buttonText = null,
  ) {
    const spinner = document.getElementById(spinnerId);
    const button = buttonText
      ? document.querySelector(`button[data-text="${buttonText}"]`)
      : null;

    if (isLoading) {
      spinner?.classList.remove("d-none");
      if (button) {
        button.querySelector("span:not(.spinner-border)").textContent =
          "Processing...";
      } else if (submitButtonText) {
        submitButtonText.textContent = "Processing...";
      }
    } else {
      spinner?.classList.add("d-none");
      if (button) {
        button.querySelector("span:not(.spinner-border)").textContent =
          buttonText;
      } else if (submitButtonText) {
        submitButtonText.textContent = isVerificationStep
          ? "Verify OTP"
          : "Send Verification Code";
      }
    }
  }
});
