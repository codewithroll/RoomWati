document.addEventListener("DOMContentLoaded", function () {
  // Advanced filters modal functionality
  const advancedFiltersBtn = document.getElementById("advanced-filters-btn");
  const advancedFiltersModal = document.getElementById(
    "advanced-filters-modal",
  );
  const closeModalBtn = document.querySelector(".close-modal-btn");
  const filterForm = document.getElementById("advanced-filter-form");
  const resetBtn = document.querySelector(".reset-btn");
  const availabilityRadios = document.querySelectorAll(
    'input[name="availability"]',
  );
  const specificDateContainer = document.getElementById(
    "specific-date-container",
  );

  // Price range slider functionality
  const minPriceSlider = document.getElementById("min-price");
  const maxPriceSlider = document.getElementById("max-price");
  const minPriceInput = document.getElementById("min-price-input");
  const maxPriceInput = document.getElementById("max-price-input");

  // Category filter buttons
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Open modal
  advancedFiltersBtn.addEventListener("click", function () {
    advancedFiltersModal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  });

  // Close modal
  closeModalBtn.addEventListener("click", function () {
    advancedFiltersModal.style.display = "none";
    document.body.style.overflow = "auto";
  });

  // Close modal when clicking outside the content
  advancedFiltersModal.addEventListener("click", function (e) {
    if (e.target === advancedFiltersModal) {
      advancedFiltersModal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });

  // Toggle specific date input based on availability selection
  availabilityRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "specific") {
        specificDateContainer.style.display = "block";
      } else {
        specificDateContainer.style.display = "none";
      }
    });
  });

  // Sync price range sliders with input fields
  minPriceSlider.addEventListener("input", function () {
    minPriceInput.value = this.value;
    // Ensure min price doesn't exceed max price
    if (parseInt(this.value) > parseInt(maxPriceSlider.value)) {
      maxPriceSlider.value = this.value;
      maxPriceInput.value = this.value;
    }
  });

  maxPriceSlider.addEventListener("input", function () {
    maxPriceInput.value = this.value;
    // Ensure max price doesn't go below min price
    if (parseInt(this.value) < parseInt(minPriceSlider.value)) {
      minPriceSlider.value = this.value;
      minPriceInput.value = this.value;
    }
  });

  minPriceInput.addEventListener("change", function () {
    minPriceSlider.value = this.value;
    // Validate against max price
    if (parseInt(this.value) > parseInt(maxPriceInput.value)) {
      maxPriceSlider.value = this.value;
      maxPriceInput.value = this.value;
    }
  });

  maxPriceInput.addEventListener("change", function () {
    maxPriceSlider.value = this.value;
    // Validate against min price
    if (parseInt(this.value) < parseInt(minPriceInput.value)) {
      minPriceSlider.value = this.value;
      minPriceInput.value = this.value;
    }
  });

  // Reset filter form
  resetBtn.addEventListener("click", function () {
    filterForm.reset();
    minPriceSlider.value = minPriceSlider.min;
    maxPriceSlider.value = maxPriceSlider.max;
    minPriceInput.value = minPriceSlider.min;
    maxPriceInput.value = maxPriceSlider.max;
    specificDateContainer.style.display = "none";
  });

  // Apply filters
  filterForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Collect filter values
    const filters = {
      roomTypes: Array.from(
        document.querySelectorAll('input[name="roomType"]:checked'),
      ).map((cb) => cb.value),
      furnished: Array.from(
        document.querySelectorAll('input[name="furnished"]:checked'),
      ).map((cb) => cb.value),
      gender: Array.from(
        document.querySelectorAll('input[name="gender"]:checked'),
      ).map((cb) => cb.value),
      tenants: Array.from(
        document.querySelectorAll('input[name="tenants"]:checked'),
      ).map((cb) => cb.value),
      minPrice: parseInt(minPriceInput.value),
      maxPrice: parseInt(maxPriceInput.value),
      location: document.querySelector('select[name="location"]').value,
      availability: document.querySelector('input[name="availability"]:checked')
        .value,
      availableFrom: document.getElementById("available-from").value,
      amenities: Array.from(
        document.querySelectorAll('input[name="amenities"]:checked'),
      ).map((cb) => cb.value),
    };

    // Filter listings
    filterListings(filters);

    // Close modal
    advancedFiltersModal.style.display = "none";
    document.body.style.overflow = "auto";
  });

  // Quick filter buttons functionality
  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      this.classList.add("active");

      // Apply quick filter
      applyQuickFilter(this.querySelector("span").textContent.trim());
    });
  });

  // Quick filter function
  function applyQuickFilter(filterName) {
    let filterCriteria = {};

    switch (filterName) {
      case "All Rooms":
        // Show all rooms
        document.querySelectorAll(".listing-col").forEach((listing) => {
          listing.style.display = "block";
        });
        return;
      case "My Favorites":
        // Show only favorites
        document.querySelectorAll(".listing-col").forEach((listing) => {
          const isFavorite =
            listing.getAttribute("data-is-favorite") === "true";
          listing.style.display = isFavorite ? "block" : "none";
        });
        checkNoResults();
        return;
      case "Single":
        filterCriteria = { roomType: "single" };
        break;
      case "Shared":
        filterCriteria = { roomType: "shared" };
        break;
      case "Furnished":
        filterCriteria = { furnished: "furnished" };
        break;
      case "For Students":
        filterCriteria = { tenants: "students" };
        break;
      case "For Professionals":
        filterCriteria = { tenants: "professionals" };
        break;
      case "Any Gender":
        filterCriteria = { gender: "any" };
        break;
      case "Immediate":
        filterCriteria = { availability: "immediate" };
        break;
      default:
        // No matching filter, show all
        document.querySelectorAll(".listing-col").forEach((listing) => {
          listing.style.display = "block";
        });
        return;
    }

    // Apply simple filter
    document.querySelectorAll(".listing-col").forEach((listing) => {
      let matches = true;

      // Check if listing matches the filter criteria
      Object.keys(filterCriteria).forEach((key) => {
        const listingValue = listing.dataset[key];
        if (listingValue !== filterCriteria[key]) {
          matches = false;
        }
      });

      listing.style.display = matches ? "block" : "none";
    });

    // Show "no results" message if needed
    checkNoResults();
  }

  // Advanced filter function
  function filterListings(filters) {
    const listings = document.querySelectorAll(".listing-col");
    let hasResults = false;

    listings.forEach((listing) => {
      // Get listing attributes from data attributes
      const roomType = listing.dataset.roomType;
      const furnished = listing.dataset.furnished;
      const gender = listing.dataset.gender;
      const tenants = listing.dataset.tenants;
      const price = parseInt(listing.dataset.price);
      const location = listing.dataset.location;
      const availability = listing.dataset.availability;
      const availableFrom = listing.dataset.availableFrom;

      // Check if listing matches all filter criteria
      let matches = true;

      // Room type filter
      if (
        filters.roomTypes.length > 0 &&
        !filters.roomTypes.includes(roomType)
      ) {
        matches = false;
      }

      // Furnished status filter
      if (
        filters.furnished.length > 0 &&
        !filters.furnished.includes(furnished)
      ) {
        matches = false;
      }

      // Gender preference filter
      if (
        filters.gender.length > 0 &&
        !filters.gender.includes(gender) &&
        gender !== "any"
      ) {
        matches = false;
      }

      // Tenant preference filter
      if (
        filters.tenants.length > 0 &&
        !filters.tenants.includes(tenants) &&
        tenants !== "any"
      ) {
        matches = false;
      }

      // Price range filter
      if (price < filters.minPrice || price > filters.maxPrice) {
        matches = false;
      }

      // Location filter
      if (
        filters.location &&
        filters.location !== "" &&
        location !== filters.location
      ) {
        matches = false;
      }

      // Availability filter
      if (
        filters.availability === "immediate" &&
        availability !== "immediate"
      ) {
        matches = false;
      } else if (filters.availability === "specific" && filters.availableFrom) {
        // Compare dates only if both exist
        if (
          availableFrom &&
          new Date(availableFrom) > new Date(filters.availableFrom)
        ) {
          matches = false;
        }
      }

      // Update listing visibility
      listing.style.display = matches ? "block" : "none";

      if (matches) {
        hasResults = true;
      }
    });

    // Show "no results" message if needed
    checkNoResults();
  }

  // Check if there are no visible results and show a message
  function checkNoResults() {
    const listings = document.querySelectorAll(".listing-col");
    const listingsGrid = document.querySelector(".listings-grid");
    let noResultsElement = document.getElementById("no-results-message");

    // Count how many listings are visible
    const visibleListings = Array.from(listings).filter((listing) => {
      return listing.style.display !== "none";
    });

    if (visibleListings.length === 0) {
      if (!noResultsElement) {
        noResultsElement = document.createElement("div");
        noResultsElement.id = "no-results-message";
        noResultsElement.className = "no-results";
        noResultsElement.innerHTML = `
        <div class="no-results-content">
          <i class="fas fa-search"></i>
          <h3>No rooms match your criteria</h3>
          <p>Try adjusting your filters for more results</p>
          <button id="reset-all-filters" class="reset-filters-btn">Reset All Filters</button>
        </div>
      `;
        listingsGrid.appendChild(noResultsElement);

        document
          .getElementById("reset-all-filters")
          .addEventListener("click", function () {
            filterForm.reset();
            minPriceSlider.value = minPriceSlider.min;
            maxPriceSlider.value = maxPriceSlider.max;
            minPriceInput.value = minPriceSlider.min;
            maxPriceInput.value = maxPriceSlider.max;

            document.querySelectorAll(".listing-col").forEach((listing) => {
              listing.style.display = "block";
            });

            filterButtons.forEach((btn) => btn.classList.remove("active"));
            filterButtons[0].classList.add("active");

            noResultsElement.remove();
          });
      }
    } else {
      if (noResultsElement) {
        noResultsElement.remove();
      }
    }
  }
});
