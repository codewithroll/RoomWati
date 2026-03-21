// Form validation with native browser checks.

(() => {
  "use strict";

  // Apply consistent validation styles on supported forms.
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (form.dataset.submitting === "true") {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
          form.reportValidity();
          form.classList.add("was-validated");
          return;
        }

        form.classList.add("was-validated");

        form.dataset.submitting = "true";
        const submitButtons = form.querySelectorAll(
          'button[type="submit"], input[type="submit"]',
        );
        submitButtons.forEach((button) => {
          button.disabled = true;
          if (button.tagName === "BUTTON") {
            const originalText = button.textContent.trim();
            if (!button.dataset.originalText) {
              button.dataset.originalText = originalText;
            }
            button.textContent = "Submitting...";
          } else if (button.tagName === "INPUT") {
            if (!button.dataset.originalValue) {
              button.dataset.originalValue = button.value;
            }
            button.value = "Submitting...";
          }
        });
      },
      false,
    );
  });
})();

/* show.ejs */
document.addEventListener("DOMContentLoaded", function () {
  // Rating display functionality
  const ratingInput = document.getElementById("rating");
  const ratingValue = document.querySelector(".rating-value");

  if (ratingInput && ratingValue) {
    ratingInput.addEventListener("input", function () {
      ratingValue.innerHTML = this.value + ' <i class="fas fa-star"></i>';
    });
  }

  // Image carousel functionality
  const carousel = document.querySelector(".image-carousel");

  if (carousel) {
    const images = carousel.querySelectorAll(".carousel-img");
    const dots = carousel.querySelectorAll(".dot");
    const prevBtn = carousel.querySelector(".prev");
    const nextBtn = carousel.querySelector(".next");
    let currentIndex = 0;

    // Skip if there's only one image
    if (images.length <= 1) {
      const controls = carousel.querySelector(".carousel-controls");
      const dotsContainer = carousel.querySelector(".carousel-dots");
      if (controls) controls.style.display = "none";
      if (dotsContainer) dotsContainer.style.display = "none";
      return;
    }

    function showImage(index) {
      images.forEach((img) => img.classList.remove("active"));
      dots.forEach((dot) => dot.classList.remove("active"));

      images[index].classList.add("active");
      dots[index].classList.add("active");
      currentIndex = index;
    }

    // Event listeners for prev/next buttons
    if (prevBtn) {
      prevBtn.addEventListener("click", function (e) {
        e.preventDefault();
        let newIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(newIndex);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function (e) {
        e.preventDefault();
        let newIndex = (currentIndex + 1) % images.length;
        showImage(newIndex);
      });
    }

    // Event listeners for dots
    dots.forEach((dot, index) => {
      dot.addEventListener("click", function (e) {
        e.preventDefault();
        showImage(index);
      });
    });
  }
});

/* All listings page*/

// Function to update all favorite count elements on the page
const updateFavoriteCounts = (newCount) => {
  // Ensure the count is never negative
  const count = Math.max(0, parseInt(newCount, 10));
  console.log("Updating favorite counts to:", count);

  // Update all elements with the favorite-count class
  document.querySelectorAll(".favorite-count").forEach((el) => {
    el.textContent = count;
  });

  // Also update any data attributes that might be used for filtering
  document.querySelectorAll("[data-favorite-count]").forEach((el) => {
    el.setAttribute("data-favorite-count", count);
  });
};

document.addEventListener("DOMContentLoaded", function () {
  // Initialize favorite counts from data attributes on page load
  document.querySelectorAll("[data-initial-favorite-count]").forEach((el) => {
    const count = Math.max(
      0,
      parseInt(el.getAttribute("data-initial-favorite-count"), 10),
    );
    if (!isNaN(count)) {
      updateFavoriteCounts(count);
    }
  });

  // Initialize all favorite buttons
  const initializeFavoriteButtons = () => {
    const favoriteButtons = document.querySelectorAll(".favorite-btn");

    favoriteButtons.forEach((btn) => {
      btn.addEventListener("click", async function (e) {
        e.preventDefault();
        e.stopPropagation();

        const listingId = this.dataset.listingId;
        console.log("Clicking favorite button for listing:", listingId);

        if (!listingId) {
          console.error("No listing ID found on the button");
          showToast("Could not process request", "error");
          return;
        }

        try {
          // Add loading state
          this.classList.add("loading");
          const icon = this.querySelector("i");
          icon.classList.add("fa-spinner", "fa-spin");

          console.log("Sending request to:", `/toggle-favorite/${listingId}`);
          const response = await fetch(`/toggle-favorite/${listingId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "same-origin",
          });

          // Remove loading state
          this.classList.remove("loading");
          icon.classList.remove("fa-spinner", "fa-spin");

          console.log("Response status:", response.status);
          const data = await response.json();
          console.log("Response data:", data);

          if (response.ok) {
            // Add animation class
            this.classList.add("animating");
            setTimeout(() => this.classList.remove("animating"), 600);

            if (data.status === "added") {
              // Added to favorites
              icon.classList.remove("far");
              icon.classList.add("fas");
              this.classList.add("active");
              this.closest(".listing-col")?.setAttribute("data-is-favorite", "true");
              showToast("Added to favorites!", "added");

              // Update favorite count from server response if available
              if (data.favoriteCount !== undefined) {
                updateFavoriteCounts(data.favoriteCount);
              }
            } else {
              // Removed from favorites
              icon.classList.remove("fas");
              icon.classList.add("far");
              this.classList.remove("active");
              this.closest(".listing-col")?.setAttribute("data-is-favorite", "false");
              showToast("Removed from favorites", "removed");

              // Update favorite count from server response if available
              if (data.favoriteCount !== undefined) {
                updateFavoriteCounts(data.favoriteCount);
              }

              // Check if we're in the favorites filter view
              const favoritesFilter = document.querySelector(
                ".filter-btn:nth-child(2)",
              );
              if (
                favoritesFilter &&
                favoritesFilter.classList.contains("active")
              ) {
                // Find and remove the listing card with a smooth fade out
                const listingCard = this.closest(".listing-col");
                if (listingCard) {
                  listingCard.style.transition =
                    "opacity 0.3s ease, transform 0.3s ease";
                  listingCard.style.opacity = "0";
                  listingCard.style.transform = "translateX(-100%)";

                  // Remove after animation completes
                  setTimeout(() => {
                    listingCard.remove();

                    // Check if no more favorites are left
                    const remainingFavorites =
                      document.querySelectorAll(".listing-col").length;
                    if (remainingFavorites === 0) {
                      const listingsGrid =
                        document.querySelector(".listings-grid");
                      if (listingsGrid) {
                        listingsGrid.innerHTML = `
                            <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
                              <i class="far fa-heart mb-3 text-3xl text-rose-400"></i>
                              <h4 class="text-base font-semibold text-slate-900">No favorite listings yet</h4>
                              <p class="mt-2 text-sm text-slate-500">Click the heart icon on a listing to add it to your favorites</p>
                              <a href="/listings" class="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Explore Listings</a>
                            </div>
                          `;
                      }
                    }
                  }, 300);
                }
              }

              // Remove from favorites section if we're on the favorites page
              if (
                window.location.pathname.includes("favorites") ||
                window.location.pathname.includes("profile")
              ) {
                const listingCard = this.closest(
                  ".user-listing-card, .listing-card, .card",
                );
                if (listingCard) {
                  // Add fade out animation
                  listingCard.style.transition = "opacity 0.3s ease-out";
                  listingCard.style.opacity = "0";

                  // Remove after animation completes
                  setTimeout(() => {
                    listingCard.remove();

                    // Check if favorites section is now empty
                    const favoritesContainer = document.querySelector(
                      ".favorites-container, #favorites-tab, .user-listings-grid",
                    );
                    if (
                      favoritesContainer &&
                      favoritesContainer.children.length === 0
                    ) {
                      const emptyState = document.createElement("div");
                      emptyState.className = "user-empty-state";
                      emptyState.innerHTML = `
                          <i class="fas fa-heart text-2xl text-rose-500"></i>
                          <h3 class="text-base font-semibold text-slate-900">No Favorites Yet</h3>
                          <p class="text-sm text-slate-500">Start saving your favorite listings!</p>
                          <a href="/listings" class="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Browse Listings</a>
                        `;
                      favoritesContainer.parentNode.insertBefore(
                        emptyState,
                        favoritesContainer.nextSibling,
                      );
                      favoritesContainer.style.display = "none";
                    }
                  }, 300);
                }
              }

              // If on index page with favorites filter active
              if (window.location.pathname === "/") {
                const activeFilterBtn =
                  document.querySelector(".filter-btn.active");
                if (
                  activeFilterBtn &&
                  activeFilterBtn.querySelector(".fa-heart")
                ) {
                  const listingCard = this.closest(
                    ".listing-card, .card, .user-listing-card, .listing-col",
                  );
                  if (listingCard) {
                    // Get the listing ID before we start the animation
                    const listingId =
                      listingCard.getAttribute("data-listing-id");

                    // Add fade out animation
                    listingCard.style.transition = "opacity 0.3s";
                    listingCard.style.opacity = "0";

                    // Remove after animation completes
                    setTimeout(() => {
                      // Update the data-is-favorite attribute
                      listingCard.setAttribute("data-is-favorite", "false");

                      // Remove the card from the DOM
                      listingCard.remove();

                      // Update the global listings array if it exists
                      if (window.listings) {
                        window.listings = window.listings.filter((listing) => {
                          return (
                            listing.getAttribute("data-listing-id") !==
                            listingId
                          );
                        });

                        // Force a re-render of the listings
                        if (typeof updateListingsDisplay === "function") {
                          updateListingsDisplay();
                        }
                      }

                      // Show empty state if no more favorites
                      const favoritesGrid =
                        document.querySelector(".listings-grid");
                      const visibleFavorites = Array.from(
                        document.querySelectorAll(
                          '.listing-col[data-is-favorite="true"]',
                        ),
                      );

                      if (visibleFavorites.length === 0 && favoritesGrid) {
                        const emptyState = document.createElement("div");
                        emptyState.className =
                          "no-favorites-message rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600";
                        emptyState.innerHTML = `
                            <i class="fas fa-heart-broken mb-3 text-3xl text-rose-400"></i>
                            <h4 class="text-base font-semibold text-slate-900">No favorite listings yet</h4>
                            <p class="mt-2 text-sm text-slate-500">Save your favorite rooms to see them here</p>
                          `;

                        // Remove any existing no-results message
                        const existingMessage = document.querySelector(
                          ".no-favorites-message",
                        );
                        if (existingMessage) existingMessage.remove();

                        favoritesGrid.appendChild(emptyState);
                      }
                    }, 300);
                  }
                }
              }
            }
          } else {
            if (response.status === 401) {
              showToast("Please login to add listings to favorites", "error");
            } else {
              showToast(data.error || "Something went wrong", "error");
            }
          }
        } catch (error) {
          console.error("Error details:", error);
          this.classList.remove("loading");
          this.querySelector("i").classList.remove("fa-spinner", "fa-spin");
          showToast("Please login to add listings to favorites", "error");
        }
      });
    });
  };

  // Toast notification function
  function showToast(message, type = "success") {
    // Remove existing toast if any
    const existingToast = document.querySelector(".toast-notification");
    if (existingToast) {
      existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement("div");

    // Set toast class based on type
    let toastType = type;
    if (type === "added") {
      toastType = "error"; // Using error class for red color
    } else if (type === "removed") {
      toastType = "info";
    }

    toast.className = `toast-notification ${toastType}`;

    // Select appropriate icon and message based on type
    let icon, messageText;
    switch (type) {
      case "success":
        icon = "fa-check-circle";
        messageText = message;
        break;
      case "error":
        icon = "fa-exclamation-circle";
        messageText = message;
        break;
      case "added":
        icon = "fa-heart";
        messageText = "Added to favorites";
        break;
      case "removed":
        icon = "fa-heart-broken";
        messageText = "Removed from favorites";
        break;
      default:
        icon = "fa-info-circle";
        messageText = message;
    }

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${messageText}</span>
      `;

    // Add to DOM
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Initialize carousels
  const initializeCarousels = () => {
    const cards = document.querySelectorAll(".listing-card");

    cards.forEach((card) => {
      const images = card.querySelectorAll(".carousel-img");
      const dots = card.querySelectorAll(".dot");
      const prevBtn = card.querySelector(".prev");
      const nextBtn = card.querySelector(".next");
      let currentIndex = 0;

      // Skip if there's only one image
      if (images.length <= 1) {
        const controls = card.querySelector(".carousel-controls");
        const dotsContainer = card.querySelector(".carousel-dots");
        if (controls) controls.style.display = "none";
        if (dotsContainer) dotsContainer.style.display = "none";
        return;
      }

      function showImage(index) {
        images.forEach((img) => img.classList.remove("active"));
        dots.forEach((dot) => dot.classList.remove("active"));

        images[index].classList.add("active");
        dots[index].classList.add("active");
        currentIndex = index;
      }

      // Event listeners for prev/next buttons
      if (prevBtn) {
        prevBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          let newIndex = (currentIndex - 1 + images.length) % images.length;
          showImage(newIndex);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          let newIndex = (currentIndex + 1) % images.length;
          showImage(newIndex);
        });
      }

      // Event listeners for dots
      dots.forEach((dot, index) => {
        dot.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          showImage(index);
        });
      });
    });
  };

  // Initialize everything
  initializeCarousels();
  initializeFavoriteButtons();

  // Prevent link click when interacting with carousel controls
  document.querySelectorAll(".carousel-control, .dot").forEach((control) => {
    control.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
});

/* show password button */
// Password toggle functionality
document.addEventListener("DOMContentLoaded", function () {
  // Get all password toggle buttons
  const passwordToggles = document.querySelectorAll(".password-toggle");

  // Add click event listener to each toggle button
  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      // Find the associated password input (the sibling of the parent container)
      const passwordInput = this.closest(
        ".password-input-container",
      ).querySelector("input");

      // Toggle between password and text type
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        this.innerHTML = '<i class="fa-regular fa-eye-slash"></i>'; // Change to "hide" icon
        this.setAttribute("aria-label", "Hide password");
      } else {
        passwordInput.type = "password";
        this.innerHTML = '<i class="fa-regular fa-eye"></i>'; // Change back to "show" icon
        this.setAttribute("aria-label", "Show password");
      }
    });
  });
});
// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // ====== PASSWORD TOGGLE FUNCTIONALITY ======
  const passwordToggles = document.querySelectorAll(".password-toggle");

  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      // Find the password input within the same container
      const passwordInput = this.parentElement.querySelector(
        'input[type="password"], input[type="text"]',
      );

      if (passwordInput) {
        // Toggle password visibility
        if (passwordInput.type === "password") {
          passwordInput.type = "text";
          this.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
          this.setAttribute("aria-label", "Hide password");
        } else {
          passwordInput.type = "password";
          this.innerHTML = '<i class="fa-regular fa-eye"></i>';
          this.setAttribute("aria-label", "Show password");
        }
      }
    });
  });

  // ====== PASSWORD STRENGTH METER ======
  const passwordInputs = document.querySelectorAll('input[type="password"]');

  passwordInputs.forEach((input) => {
    // Check if this input has a strength meter
    const strengthMeterContainer = input
      .closest(".form-group")
      ?.querySelector(".password-strength");
    if (!strengthMeterContainer) return; // Skip if no strength meter found

    const strengthSegments =
      strengthMeterContainer.querySelectorAll(".strength-segment");
    const strengthText = strengthMeterContainer.querySelector(".strength-text");

    input.addEventListener("input", function () {
      const password = this.value;
      const strength = calculatePasswordStrength(password);

      // Update strength meter visually
      updateStrengthMeter(strength, strengthSegments, strengthText);
    });
  });

  // Function to calculate password strength score (0-4)
  function calculatePasswordStrength(password) {
    if (!password) return 0;

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1; // Has uppercase
    if (/[0-9]/.test(password)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special char

    // Normalize score to 0-4 range
    return Math.min(4, Math.floor((score * 4) / 5));
  }

  // Function to update the strength meter UI
  function updateStrengthMeter(strengthScore, segments, textElement) {
    // Define strength levels and colors
    const strengthLevels = [
      { text: "Very weak", color: "#FF385C" },
      { text: "Weak", color: "#FF8670" },
      { text: "Medium", color: "#FFBD59" },
      { text: "Strong", color: "#8CE28C" },
      { text: "Very strong", color: "#4CAF50" },
    ];

    // Update text description
    if (textElement) {
      textElement.textContent = `Password strength: ${strengthLevels[strengthScore].text}`;
    }

    // Update segments
    if (segments && segments.length) {
      segments.forEach((segment, index) => {
        if (index < strengthScore + 1) {
          segment.style.backgroundColor = strengthLevels[strengthScore].color;
        } else {
          segment.style.backgroundColor = "#DDDDDD";
        }
      });
    }
  }
});

/* home.ejs */
document.addEventListener("DOMContentLoaded", function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = "running";
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    },
  );

  document.querySelectorAll(".animate-fade-in-up").forEach((element) => {
    element.style.animationPlayState = "paused";
    observer.observe(element);
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Tax toggle functionality
  const taxToggle = document.getElementById("tax-toggle");
  const listingCards = document.querySelectorAll(".listing-card");
  const originalPrices = [];
  const TAX_RATE = 0.18; // 18% GST

  // Only initialize tax toggle if it exists (listings page)
  if (taxToggle && listingCards.length > 0) {
    // Store original prices
    listingCards.forEach((card, index) => {
      const priceText = card.querySelector(".listing-price strong").textContent;
      const numericValue = parseFloat(priceText.replace(/[^\d]/g, ""));
      originalPrices[index] = numericValue;
    });

    // Function to update prices based on toggle state
    function updatePrices(includeTax) {
      listingCards.forEach((card, index) => {
        const priceElement = card.querySelector(".listing-price strong");
        const priceContainer = card.querySelector(".listing-price");

        if (priceElement && originalPrices[index]) {
          const originalPrice = originalPrices[index];

          if (includeTax) {
            const priceWithTax = Math.round(originalPrice * (1 + TAX_RATE));
            priceElement.textContent =
              "₹" + priceWithTax.toLocaleString("en-IN");

            if (!priceContainer.querySelector(".gst-indicator")) {
              const gstIndicator = document.createElement("span");
              gstIndicator.className = "gst-indicator";
              gstIndicator.textContent = " + 18% GST included";
              gstIndicator.style.fontSize = "12px";
              gstIndicator.style.color = "#666";
              gstIndicator.style.fontWeight = "normal";
              priceContainer.appendChild(gstIndicator);
            }
          } else {
            priceElement.textContent =
              "₹" + originalPrice.toLocaleString("en-IN");

            const gstIndicator = priceContainer.querySelector(".gst-indicator");
            if (gstIndicator) {
              priceContainer.removeChild(gstIndicator);
            }
          }
        }
      });
    }

    // Add event listener to the tax toggle
    taxToggle.addEventListener("change", function () {
      updatePrices(this.checked);
    });

    // Initialize with tax toggle off
    updatePrices(false);
  }

  // Map functionality
  const showMapBtn = document.querySelector(".show-map-btn");
  const mapModal = document.getElementById("map-modal");
  const closeMapBtn = document.querySelector(".close-map-btn");
  const listingsMap = document.getElementById("listings-map");
  const mapListingsContainer = document.querySelector(
    ".map-listings-container",
  );
  const DEFAULT_COORDINATES = [20.5937, 78.9629]; // Default to center of India

  let map = null;
  let markers = [];
  let markerLayer = null;
  let sampleListings = [];

  // First try to load the data
  function loadListingsData() {
    // Check if data is already available in window object
    if (window.sampleListings && window.sampleListings.length > 0) {
      sampleListings = window.sampleListings;
      return Promise.resolve(sampleListings);
    }

    // If not, try to load it from the script
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/init/data.js";
      script.onload = function () {
        if (window.sampleListings && window.sampleListings.length > 0) {
          sampleListings = window.sampleListings;
          resolve(sampleListings);
        } else {
          console.error("Listings data not found in data.js");
          reject("Listings data not found");
        }
      };
      script.onerror = function () {
        console.error("Failed to load data.js");
        reject("Failed to load data");
      };
      document.head.appendChild(script);
    });
  }

  // Only initialize map functionality if elements exist
  if (showMapBtn && mapModal && closeMapBtn) {
    showMapBtn.addEventListener("click", function () {
      mapModal.style.display = "block";
      loadListingsData()
        .then(() => {
          initializeMap();
        })
        .catch((error) => {
          console.error("Error loading data:", error);
          const mapListingsContainer = document.querySelector(
            ".map-listings-container",
          );
          if (mapListingsContainer) {
            mapListingsContainer.innerHTML =
              "<p>Failed to load listings data. Please try again later.</p>";
          }
        });
    });

    closeMapBtn.addEventListener("click", function () {
      mapModal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
      if (event.target === mapModal) {
        mapModal.style.display = "none";
      }
    });
  }

  // Function to get coordinates based on location name using a simple mapping
  function getCoordinates(location, country) {
    // This is a simplified approach. In a real application, you'd use geocoding.
    const locationMap = {
      Malibu: [34.0259, -118.7798],
      "New York City": [40.7128, -74.006],
      Aspen: [39.1911, -106.8175],
      Florence: [43.7696, 11.2558],
      Portland: [45.5152, -122.6784],
      Cancun: [21.1619, -86.8515],
      "Lake Tahoe": [39.0968, -120.0324],
      "Los Angeles": [34.0522, -118.2437],
      Verbier: [46.0969, 7.228],
      "Serengeti National Park": [-2.3333, 34.8333],
      Amsterdam: [52.3676, 4.9041],
      Fiji: [-17.7134, 178.065],
      Cotswolds: [51.93, -1.8],
      Boston: [42.3601, -71.0589],
      Bali: [-8.3405, 115.092],
      Banff: [51.1784, -115.5708],
      Miami: [25.7617, -80.1918],
      Phuket: [7.9519, 98.3381],
      "Scottish Highlands": [57.36, -4.4],
      Dubai: [25.2048, 55.2708],
      Montana: [46.8797, -110.3626],
      Mykonos: [37.4415, 25.3667],
      "Costa Rica": [9.7489, -83.7534],
      Charleston: [32.7765, -79.9311],
      Tokyo: [35.6762, 139.6503],
      "New Hampshire": [43.1939, -71.5724],
      Maldives: [3.2028, 73.2207],
      Mumbai: [19.076, 72.8777],
      Delhi: [28.6139, 77.209],
      Bangalore: [12.9716, 77.5946],
      Chennai: [13.0827, 80.2707],
      Kolkata: [22.5726, 88.3639],
      Hyderabad: [17.385, 78.4867],
      Pune: [18.5204, 73.8567],
      Jaipur: [26.9124, 75.7873],
      Ahmedabad: [23.0225, 72.5714],
      Goa: [15.2993, 74.124],
    };

    // Try to get coordinates for the specific location
    if (locationMap[location]) {
      return locationMap[location];
    }

    // If location not found, try to use country coordinates as fallback
    const countryMap = {
      "United States": [37.0902, -95.7129],
      Italy: [41.8719, 12.5674],
      Mexico: [23.6345, -102.5528],
      Switzerland: [46.8182, 8.2275],
      Tanzania: [-6.369, 34.8888],
      Netherlands: [52.1326, 5.2913],
      Fiji: [-17.7134, 178.065],
      "United Kingdom": [55.3781, -3.436],
      Indonesia: [-0.7893, 113.9213],
      Canada: [56.1304, -106.3468],
      Thailand: [15.87, 100.9925],
      "United Arab Emirates": [23.4241, 53.8478],
      Greece: [39.0742, 21.8243],
      "Costa Rica": [9.7489, -83.7534],
      Japan: [36.2048, 138.2529],
      Maldives: [3.2028, 73.2207],
      India: [20.5937, 78.9629],
    };

    if (countryMap[country]) {
      return countryMap[country];
    }

    // Default coordinates if nothing is found
    return DEFAULT_COORDINATES;
  }

  function formatPrice(price) {
    // Check if we should use rupee symbol
    const currencySymbol = "₹";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("₹", currencySymbol);
  }

  function createCustomMarker(price) {
    // Create a custom marker with price
    const markerIcon = L.divIcon({
      className: "custom-marker",
      html: `<div class="price-marker">₹${Math.round(price / 1000)}K</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    return markerIcon;
  }

  function initializeMap() {
    if (map) {
      updateMapMarkers();
      return;
    }

    map = L.map("listings-map").setView(DEFAULT_COORDINATES, 5); // Zoom level 5 for India
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Add a control to toggle sidebar on mobile
    const sidebarToggle = L.control({ position: "topright" });
    sidebarToggle.onAdd = function (map) {
      const div = L.DomUtil.create("div", "toggle-sidebar-btn");
      div.innerHTML = "Show Listings";
      div.onclick = function () {
        const sidebar = document.querySelector(".map-listings-sidebar");
        if (sidebar.style.display === "none" || !sidebar.style.display) {
          sidebar.style.display = "block";
          div.innerHTML = "Hide Listings";
        } else {
          sidebar.style.display = "none";
          div.innerHTML = "Show Listings";
        }
      };
      return div;
    };
    sidebarToggle.addTo(map);

    updateMapMarkers();
  }

  function updateMapMarkers() {
    if (markerLayer) {
      markerLayer.clearLayers();
    } else {
      markerLayer = L.layerGroup().addTo(map);
    }

    mapListingsContainer.innerHTML = "";

    if (!sampleListings || sampleListings.length === 0) {
      mapListingsContainer.innerHTML =
        "<p>No listings found. Please check your data.</p>";
      return;
    }

    // Debug info
    console.log(`Found ${sampleListings.length} listings to display on map`);

    // Use the bounds to fit the map to all markers later
    let bounds = L.latLngBounds();
    let validMarkers = 0;

    sampleListings.forEach((listing, index) => {
      // Make sure listing has required properties
      if (!listing.title || !listing.location) {
        console.warn(
          `Listing #${index} is missing required properties:`,
          listing,
        );
        return;
      }

      const coords = getCoordinates(
        listing.location,
        listing.country || "India",
      );

      if (!coords || coords.length !== 2) {
        console.warn(
          `Invalid coordinates for listing ${listing.title}:`,
          coords,
        );
        return;
      }

      // Add to bounds
      bounds.extend(coords);
      validMarkers++;

      // Create a custom marker with price
      const markerIcon = createCustomMarker(listing.price);

      const marker = L.marker(coords, { icon: markerIcon }).addTo(markerLayer);

      // Create the popup content
      const popupContent = document.createElement("div");
      popupContent.className = "map-popup";

      // Image element with fallback
      const imageUrl = listing.image?.url || "/images/placeholder.jpg";

      popupContent.innerHTML = `
        <img src="${imageUrl}" class="map-popup-image" alt="${listing.title}" onerror="this.src='/images/placeholder.jpg'">
        <div class="map-popup-content">
          <div class="map-popup-title">${listing.title}</div>
          <div class="map-popup-price">${formatPrice(listing.price)}</div>
          <div class="map-popup-details">
            <span class="map-popup-detail">${listing.location}${listing.country ? ", " + listing.country : ""}</span>
          </div>
          <a href="/listings/${listing.id || index}" class="view-listing-btn">View Listing</a>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Highlight marker when mouseover
      marker.on("mouseover", function () {
        this._icon.classList.add("highlight");
      });

      marker.on("mouseout", function () {
        this._icon.classList.remove("highlight");
      });

      // Add listing to sidebar
      const listingItem = document.createElement("div");
      listingItem.className = "map-listing-item";
      listingItem.innerHTML = `
        <img src="${imageUrl}" class="map-listing-image" alt="${listing.title}" onerror="this.src='/images/placeholder.jpg'">
        <div class="map-listing-details">
          <div class="map-listing-title">${listing.title}</div>
          <div class="map-listing-price">${formatPrice(listing.price)}</div>
          <div class="map-listing-location">${listing.location}${listing.country ? ", " + listing.country : ""}</div>
        </div>
      `;

      listingItem.addEventListener("click", () => {
        map.setView(coords, 15); // Zoom in when clicking on a listing
        marker.openPopup();

        // Highlight this listing item
        const allListings = document.querySelectorAll(".map-listing-item");
        allListings.forEach((item) => item.classList.remove("active"));
        listingItem.classList.add("active");
      });

      mapListingsContainer.appendChild(listingItem);
    });

    // Fit the map to show all markers, with some padding
    if (bounds.isValid() && validMarkers > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
      console.log(`Map fitted to ${validMarkers} valid markers`);
    } else {
      console.warn("No valid markers to display on map");
      mapListingsContainer.innerHTML =
        "<p>No valid locations found in your listings data.</p>";
    }
  }

  // Check if we should initialize the map on page load
  // (in case the map is visible by default)
  if (mapModal && mapModal.style.display === "block") {
    loadListingsData().then(() => {
      initializeMap();
    });
  }

  // Update ratings if elements exist
  const ratingElements = document.querySelectorAll(".listing-rating span");
  if (ratingElements.length > 0) {
    ratingElements.forEach((element) => {
      const ratingValue = parseFloat(element.textContent);
      const listingCard = element.closest(".listing-card");

      if (ratingValue === 4.5) {
        element.textContent = "3.0";

        if (listingCard) {
          const parentListing = listingCard.closest(".listing-col");
          if (parentListing && parentListing.hasAttribute("data-rating")) {
            parentListing.setAttribute("data-rating", "3.0");
          }
        }
      }
    });
  }
});

// Function to update navbar profile image
function updateNavbarProfileImage(newImageUrl) {
  const navbarImage = document.getElementById("navbar-profile-image");
  if (navbarImage && newImageUrl) {
    navbarImage.src = newImageUrl;
  }
}

// Listen for profile update success
document.addEventListener("DOMContentLoaded", function () {
  const successMessage = document.querySelector(".alert-success");
  if (
    successMessage &&
    successMessage.textContent.includes("Profile updated")
  ) {
    // Get the current profile image URL from the profile preview
    const profilePreview = document.getElementById("profilePreview");
    if (profilePreview) {
      updateNavbarProfileImage(profilePreview.src);
    }
  }
});
