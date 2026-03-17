// Function to initialize all charts
function initializeCharts() {
  console.log("Initializing charts...");

  // Check if Chart.js is available
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded!");
    return;
  }

  console.log("Chart.js version:", Chart.version);

  // Check if chart containers exist
  const performanceCtx = document.getElementById("performanceChart");
  const listingsCtx = document.getElementById("listingsChart");
  const ratingsCtx = document.getElementById("ratingsChart");

  console.log("Chart containers found:", {
    performanceChart: !!performanceCtx,
    listingsChart: !!listingsCtx,
    ratingsChart: !!ratingsCtx,
  });

  // If no chart containers found, show error message
  if (!performanceCtx && !listingsCtx && !ratingsCtx) {
    console.error("No chart containers found!");
    return;
  }
  // Sample data for charts
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentMonth = new Date().getMonth();

  // Generate sample monthly data
  const monthlyData = Array(12)
    .fill(0)
    .map((_, i) => {
      const monthIndex = (currentMonth - i + 12) % 12;
      return {
        month: months[monthIndex],
        views: Math.floor(Math.random() * 100) + 20,
        favorites: Math.floor(Math.random() * 50) + 5,
      };
    })
    .reverse();

  // Check if analytics tab is visible
  const analyticsTab = document.getElementById("analytics-tab");
  if (!analyticsTab) {
    console.error("Analytics tab not found!");
    return;
  }

  // Ensure the tab is visible
  const tabIsVisible = window.getComputedStyle(analyticsTab).display !== "none";
  console.log("Analytics tab visible:", tabIsVisible);

  // If tab is not visible, wait a bit and try again
  if (!tabIsVisible) {
    console.log("Analytics tab not visible, retrying in 500ms...");
    setTimeout(initializeCharts, 500);
    return;
  }

  // Destroy existing charts if they exist
  if (window.performanceChart) window.performanceChart.destroy();
  if (window.listingsChart) window.listingsChart.destroy();
  if (window.ratingsChart) window.ratingsChart.destroy();

  // Monthly Performance Chart
  const performanceCtx = document.getElementById("performanceChart");
  if (performanceCtx) {
    window.performanceChart = new Chart(performanceCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Views",
            data: monthlyData.map((d) => d.views),
            borderColor: "#4e73df",
            backgroundColor: "rgba(78, 115, 223, 0.05)",
            tension: 0.3,
            fill: true,
          },
          {
            label: "Favorites",
            data: monthlyData.map((d) => d.favorites),
            borderColor: "#e74a3b",
            backgroundColor: "rgba(231, 74, 59, 0.05)",
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              drawBorder: false,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  // Get top listings data from the page
  const listingsData = [];
  document.querySelectorAll(".listing-card").forEach((card, index) => {
    if (index < 5) {
      // Limit to top 5
      const title =
        card.querySelector(".listing-title")?.textContent ||
        `Listing ${index + 1}`;
      const views = parseInt(
        card.querySelector(".view-count")?.textContent || "0",
      );
      const favorites = parseInt(
        card.querySelector(".favorite-count")?.textContent || "0",
      );
      listingsData.push({ title, views, favorites });
    }
  });

  // Top Performing Listings Chart
  const listingsCtx = document.getElementById("listingsChart");
  if (listingsCtx && listingsData.length > 0) {
    window.listingsChart = new Chart(listingsCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: listingsData.map((l) =>
          l.title.length > 15 ? l.title.substring(0, 15) + "..." : l.title,
        ),
        datasets: [
          {
            label: "Views",
            data: listingsData.map((l) => l.views),
            backgroundColor: [
              "rgba(78, 115, 223, 0.8)",
              "rgba(54, 185, 204, 0.8)",
              "rgba(28, 200, 138, 0.8)",
              "rgba(246, 194, 62, 0.8)",
              "rgba(231, 74, 59, 0.8)",
            ],
            borderColor: [
              "rgba(78, 115, 223, 1)",
              "rgba(54, 185, 204, 1)",
              "rgba(28, 200, 138, 1)",
              "rgba(246, 194, 62, 1)",
              "rgba(231, 74, 59, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function (context) {
                const index = context.dataIndex;
                return listingsData[index].title;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { display: true, drawBorder: false },
          },
          y: { grid: { display: false } },
        },
      },
    });
  }

  // Rating Distribution Chart
  const ratingsCtx = document.getElementById("ratingsChart");
  if (ratingsCtx) {
    // Generate some sample rating data
    const ratingCounts = [0, 0, 0, 0, 0];
    for (let i = 0; i < 20; i++) {
      const rating = Math.floor(Math.random() * 5) + 1;
      ratingCounts[rating - 1]++;
    }

    window.ratingsChart = new Chart(ratingsCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
        datasets: [
          {
            label: "Number of Ratings",
            data: ratingCounts,
            backgroundColor: [
              "rgba(231, 74, 59, 0.8)",
              "rgba(246, 194, 62, 0.8)",
              "rgba(54, 185, 204, 0.8)",
              "rgba(78, 115, 223, 0.8)",
              "rgba(28, 200, 138, 0.8)",
            ],
            borderColor: [
              "rgba(231, 74, 59, 1)",
              "rgba(246, 194, 62, 1)",
              "rgba(54, 185, 204, 1)",
              "rgba(78, 115, 223, 1)",
              "rgba(28, 200, 138, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { display: true, drawBorder: false },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }
}

// Initialize charts when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize charts immediately
  initializeCharts();

  // Re-initialize charts when switching to the analytics tab
  document.querySelectorAll(".user-nav-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      if (this.dataset.tab === "analytics") {
        // Small delay to ensure the tab is visible before initializing charts
        setTimeout(initializeCharts, 100);
      }
    });
  });
});
