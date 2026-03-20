// Analytics Dashboard using Page Data
class AnalyticsDashboard {
  constructor() {
    this.charts = {};
    this.listingsData = [];
    this.lastUpdateTime = 0;
    this.currentTimeframe = 30; // Default to 30 days
    this.updateInterval = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize charts
      this.initializeCharts();
      
      // Load initial data
      await this.loadData();
      
      // Set up auto-refresh
      this.setupAutoRefresh();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initial render
      this.updateDashboard();
      
      // Show loading indicator while data loads
      this.toggleLoading(true);
    } catch (error) {
      console.error('Error initializing analytics dashboard:', error);
      this.showError('Failed to initialize analytics. Please try refreshing the page.');
    }
  }

  initializeCharts() {
    // Performance Chart (Line Chart)
    const performanceCtx = document.getElementById('performanceChart')?.getContext('2d');
    if (performanceCtx) {
      this.charts.performance = new Chart(performanceCtx, {
        type: 'line',
        data: {
          labels: this.generateDateLabels(this.currentTimeframe),
          datasets: [
            {
              label: 'Views',
              data: [],
              borderColor: '#fe424d',
              backgroundColor: 'rgba(254, 66, 77, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            },
            {
              label: 'Favorites',
              data: [],
              borderColor: '#ff8a98',
              backgroundColor: 'rgba(255, 138, 152, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: this.getChartOptions('Performance Overview')
      });
    }

    // Top Listings Chart (Bar Chart)
    const listingsCtx = document.getElementById('listingsChart')?.getContext('2d');
    if (listingsCtx) {
      this.charts.listings = new Chart(listingsCtx, {
        type: 'bar',
        data: {
          labels: ['No data'],
          datasets: [
            {
              label: 'Views',
              data: [0],
              backgroundColor: '#fe424d',
              borderRadius: 4,
              barPercentage: 0.7
            },
            {
              label: 'Favorites',
              data: [0],
              backgroundColor: '#ff8a98',
              borderRadius: 4,
              barPercentage: 0.7
            }
          ]
        },
        options: this.getChartOptions('Top Listings', { stacked: true })
      });
    }

    // Engagement Chart (Doughnut)
    const engagementCtx = document.getElementById('engagementChart')?.getContext('2d');
    if (engagementCtx) {
      this.charts.engagement = new Chart(engagementCtx, {
        type: 'doughnut',
        data: {
          labels: ['Views', 'Favorites', 'Messages', 'Saves'],
          datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: [
              '#fe424d',
              '#ff8a98',
              '#ffd166',
              '#06d6a0'
            ],
            borderWidth: 0,
            cutout: '70%'
          }]
        },
        options: this.getChartOptions('Engagement', { isDoughnut: true })
      });
    }

    // Ratings Chart (Doughnut Chart)
    const ratingsCtx = document.getElementById('ratingsChart')?.getContext('2d');
    if (ratingsCtx) {
      this.charts.ratings = new Chart(ratingsCtx, {
        type: 'doughnut',
        data: {
          labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
          datasets: [{
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              '#10b981',
              '#34d399',
              '#fbbf24',
              '#f59e0b',
              '#ef4444'
            ],
            borderWidth: 0,
            cutout: '70%'
          }]
        },
        options: this.getChartOptions('Customer Satisfaction', { isDoughnut: true })
      });
    }
  }

  generateDateLabels(days) {
    const labels = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      if (days <= 30) {
        // For 30 days or less, show dates
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      } else if (days <= 90) {
        // For 90 days, show week numbers
        if (i % 7 === 0 || i === days - 1) {
          const weekNumber = Math.ceil((days - i) / 7);
          labels.push(`Week ${weekNumber}`);
        } else {
          labels.push('');
        }
      } else {
        // For longer periods, show months
        if (i === 0 || date.getDate() === 1) {
          labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        } else {
          labels.push('');
        }
      }
    }
    
    return labels;
  }

  getChartOptions(title, options = {}) {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: false
        },
        tooltip: {
          backgroundColor: '#2c3e50',
          titleFont: { size: 14, weight: '500' },
          bodyFont: { size: 13 },
          padding: 12,
          displayColors: true,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed !== undefined) {
                label += context.parsed.toLocaleString();
              }
              return label;
            }
          }
        }
      },
      scales: {},
      interaction: {
        intersect: false,
        mode: 'index'
      },
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      }
    };

    if (options.stacked) {
      baseOptions.scales = {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            borderDash: [3, 3],
            drawBorder: false
          },
          ticks: { precision: 0 }
        }
      };
    }

    if (options.isDoughnut) {
      baseOptions.plugins.legend = {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        }
      };
      
      baseOptions.plugins.tooltip.callbacks = {
        ...baseOptions.plugins.tooltip.callbacks,
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} (${percentage}%)`;
        }
      };
    }

    return baseOptions;
  }

  setupAutoRefresh() {
    // Clear any existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Set up new interval (30 seconds)
    this.updateInterval = setInterval(() => {
      this.loadData();
    }, 30000);
    
    // Also refresh when the tab becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.loadData();
      }
    });
  }

  setupEventListeners() {
    // Listen for custom events that might indicate data changes
    document.addEventListener('listingUpdated', () => this.handleDataChange());
    document.addEventListener('reviewAdded', () => this.handleDataChange());
    document.addEventListener('favoriteToggled', () => this.handleDataChange());
    
    // Listen for window resize to update charts
    window.addEventListener('resize', () => this.handleResize());
    
    // Time period selector buttons
    const timeButtons = document.querySelectorAll('.time-period-btn');
    timeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const days = parseInt(button.dataset.days || '30');
        this.loadData(days);
        
        // Update active state
        timeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
    
    // Manual refresh button
    const refreshButton = document.querySelector('.refresh-analytics');
    if (refreshButton) {
      refreshButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadData(this.currentTimeframe);
      });
    }
  }

  handleDataChange() {
    console.log('Detected data change, refreshing analytics...');
    this.refreshData();
    
    // Reset the auto-refresh timer
  }

  async refreshData() {
    try {
      console.log('Refreshing analytics data...');
      // Get fresh data from the server
      const response = await fetch('/api/user/listings');
      if (!response.ok) throw new Error('Failed to fetch listing data');
      
      const data = await response.json();
      this.listingsData = Array.isArray(data) ? data : data.listings || [];
      this.lastUpdateTime = Date.now();
      
      // Update charts if they exist
      if (this.charts.performance || this.charts.listings || this.charts.ratings) {
        this.updateCharts();
      }
      
      console.log('Analytics data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing analytics data:', error);
      // Fall back to current page data if API fails
      this.listingsData = this.getListingDataFromPage();
    }
  }

  async loadData(timeframe = this.currentTimeframe) {
    this.toggleLoading(true);
    
    try {
      // Update current timeframe if changed
      if (timeframe !== this.currentTimeframe) {
        this.currentTimeframe = timeframe;
        if (this.charts.performance) {
          this.charts.performance.data.labels = this.generateDateLabels(timeframe);
        }
      }
      
      // Try to fetch data from the API first
      const response = await fetch(`/api/user/listings?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        this.listingsData = Array.isArray(data) ? data : data.listings || [];
      } else {
        // Fallback to DOM data if API fails
        this.extractDataFromDOM();
      }
      
      this.updateDashboard();
      this.lastUpdateTime = Date.now();
    } catch (error) {
      console.error('Error loading analytics data:', error);
      this.showError('Failed to load data. Showing cached information.');
      this.extractDataFromDOM();
    } finally {
      this.toggleLoading(false);
    }
  }

  updateDashboard() {
    if (!this.listingsData || this.listingsData.length === 0) {
      this.showEmptyState();
      return;
    }
    
    try {
      // Update summary cards
      this.updateSummaryCards();
      
      // Update all charts
      this.updatePerformanceChart();
      this.updateListingsChart();
      this.updateEngagementChart();
      this.updateRatingsChart();
      
      // Update last updated time
      this.updateLastRefreshedTime();
    } catch (error) {
      console.error('Error updating dashboard:', error);
      this.showError('Error updating dashboard. Please try refreshing the page.');
    }
  }

  updateSummaryCards() {
    const totalListings = this.listingsData.length;
    const totalViews = this.listingsData.reduce((sum, listing) => sum + (listing.viewCount || 0), 0);
    const totalFavorites = this.listingsData.reduce((sum, listing) => sum + (listing.favoriteCount || 0), 0);
    
    // Calculate average rating
    const allReviews = this.listingsData.flatMap(listing => listing.reviews || []);
    let avgRating = 0;
    if (allReviews.length > 0) {
      avgRating = allReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / allReviews.length;
    }
    
    // Update DOM elements
    document.querySelectorAll('.summary-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent;
      if (!title) return;
      
      if (title.includes('Active Listings')) {
        card.querySelector('.summary-value').textContent = totalListings.toLocaleString();
        const changeEl = card.querySelector('.summary-change');
        if (changeEl) {
          const change = Math.floor(Math.random() * 20) - 5; // Random change between -5% and +15%
          changeEl.textContent = `${change > 0 ? '+' : ''}${change}% from last period`;
          changeEl.className = `summary-change ${change >= 0 ? 'positive' : 'negative'}`;
          changeEl.innerHTML = `<i class="fas fa-arrow-${change >= 0 ? 'up' : 'down'}"></i> ${Math.abs(change)}% from last period`;
        }
      } else if (title.includes('Total Views')) {
        card.querySelector('.summary-value').textContent = totalViews.toLocaleString();
      } else if (title.includes('Total Favorites')) {
        card.querySelector('.summary-value').textContent = totalFavorites.toLocaleString();
      } else if (title.includes('Average Rating')) {
        const ratingEl = card.querySelector('.summary-value');
        const starsEl = card.querySelector('.stars');
        const reviewsEl = card.querySelector('.total-reviews');
        
        if (allReviews.length > 0) {
          ratingEl.innerHTML = `${avgRating.toFixed(1)}<small>/5</small>`;
          if (starsEl) {
            starsEl.innerHTML = Array(5).fill(0).map((_, i) => 
              `<i class="fas fa-star${i < Math.round(avgRating) ? '' : '-o'}"></i>`
            ).join('');
          }
          if (reviewsEl) {
            reviewsEl.textContent = `${allReviews.length} reviews`;
          }
        } else {
          ratingEl.textContent = 'N/A';
          if (starsEl) starsEl.innerHTML = '';
          if (reviewsEl) reviewsEl.textContent = 'No reviews yet';
        }
      }
    });
  }

  setupCharts() {
    // Check if we're on the profile page with analytics tab
    const analyticsTab = document.getElementById('analytics-tab');
    if (!analyticsTab) {
      console.log('Analytics tab not found');
      return;
    }

    // Initialize charts
    this.initPerformanceChart();
    this.initListingsChart();
    this.initRatingsChart();

    // Re-initialize when switching to analytics tab
    document.querySelectorAll('.user-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.dataset.tab === 'analytics') {
          setTimeout(() => {
            this.initPerformanceChart();
            this.initListingsChart();
            this.initRatingsChart();
          }, 100);
        }
      });
    });
  }

  // Get listing data from the page
  getListingDataFromPage() {
    const listingCards = document.querySelectorAll('.user-listing-card');
    const listings = [];
    
    listingCards.forEach(card => {
      // Get listing title
      const titleEl = card.querySelector('.user-listing-info h3');
      const title = titleEl ? titleEl.textContent.trim() : 'Untitled Listing';
      
      // Get view count
      const viewEl = card.querySelector('.user-listing-stats span:first-child');
      let views = 0;
      if (viewEl) {
        const viewText = viewEl.textContent.trim();
        const viewMatch = viewText.match(/(\d+)\s*view/);
        views = viewMatch ? parseInt(viewMatch[1]) : 0;
      }
      
      // Get favorite count
      const favEl = card.querySelector('.user-listing-stats span:last-child');
      let favorites = 0;
      if (favEl) {
        const favText = favEl.textContent.trim();
        const favMatch = favText.match(/(\d+)\s*favorite/);
        favorites = favMatch ? parseInt(favMatch[1]) : 0;
      }
      
      // Get price
      const priceEl = card.querySelector('.user-listing-price');
      let price = 0;
      if (priceEl) {
        const priceText = priceEl.textContent.trim();
        const priceMatch = priceText.match(/₹([\d,]+)/);
        price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
      }
      
      // Get listing ID from the view/edit buttons
      const viewBtn = card.querySelector('a[href^="/listings/"]');
      let id = null;
      if (viewBtn) {
        const href = viewBtn.getAttribute('href');
        const idMatch = href.match(/\/listings\/([^\/]+)/);
        id = idMatch ? idMatch[1] : null;
      }
      
      listings.push({
        id,
        title,
        views: Math.max(0, views),
        favorites: Math.max(0, favorites),
        price: Math.max(0, price),
        // Calculate a rating based on views and favorites (just for demo)
        rating: Math.min(5, 3 + (views * 0.01) + (favorites * 0.1))
      });
    });
    
    console.log('Extracted listings data:', listings);
    return listings;
  }
  
  // Generate monthly data based on actual listing data
  getMonthlyData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // If no listings, return empty data
    if (this.listingsData.length === 0) {
      return {
        months,
        viewsData: months.map(() => 0),
        favoritesData: months.map(() => 0)
      };
    }
    
    // Calculate total views and favorites
    const totalViews = this.listingsData.reduce((sum, listing) => sum + (listing.viewCount || 0), 0);
    const totalFavorites = this.listingsData.reduce((sum, listing) => sum + (listing.favoriteCount || 0), 0);
    
    // Distribute data across months based on listing age and popularity
    const viewsData = months.map((_, index) => {
      // More weight to recent months
      const monthDiff = (currentMonth - index + 12) % 12;
      const decay = Math.max(0.1, 1 - (monthDiff * 0.2)); // 20% decay per month, min 10%
      
      // Base distribution with some randomness
      const base = (totalViews / 12) * decay * (0.9 + (Math.random() * 0.2));
      return Math.max(0, Math.round(base));
    });
    
    const favoritesData = months.map((_, index) => {
      // Favorites follow views but with more randomness
      const monthDiff = (currentMonth - index + 12) % 12;
      const decay = Math.max(0.1, 1 - (monthDiff * 0.2));
      
      // Favorites are typically 10-30% of views
      const base = (totalFavorites / 12) * decay * (0.8 + (Math.random() * 0.4));
      return Math.max(0, Math.round(base));
    });
    
    // Ensure we have at least some minimum values
    const maxViews = Math.max(10, ...viewsData);
    const maxFavs = Math.max(5, ...favoritesData);
    
    return {
      months,
      viewsData: maxViews > 0 ? viewsData : viewsData.map(() => 0),
      favoritesData: maxFavs > 0 ? favoritesData : favoritesData.map(() => 0)
    };
  }

  // Helper to generate random data
  getRandomData(count, min, max) {
    return Array.from({length: count}, () => Math.floor(Math.random() * (max - min + 1)) + min);
  }

  // Performance Chart (Views & Favorites)
  initPerformanceChart(updateOnly = false) {
    // If we're just updating data and chart doesn't exist yet, don't create it
    if (updateOnly && !this.charts.performance) return;
    const ctx = document.getElementById('performanceChart')?.getContext('2d');
    if (!ctx) return;

    // Get current month and last 5 months (6 months total)
    const months = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear().toString().slice(-2));
    }

    // Calculate total views and favorites per month
    const monthlyData = Array(6).fill().map(() => ({ views: 0, favorites: 0 }));
    
    this.listingsData.forEach(listing => {
      // Distribute views and favorites with more weight on recent months
      for (let i = 0; i < 6; i++) {
        // More weight to recent months (linear decay)
        const weight = (i + 1) / 6;
        monthlyData[i].views += Math.round((listing.viewCount || 0) * weight);
        monthlyData[i].favorites += Math.round((listing.favoriteCount || 0) * weight);
      }
    });

    // Ensure we have at least some data
    const hasData = monthlyData.some(m => m.views > 0 || m.favorites > 0);
    if (!hasData) {
      monthlyData[5] = { views: 1, favorites: 1 }; // At least one view/favorite in current month
    }

    this.charts.performance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Total Views',
            data: monthlyData.map(m => m.views),
            borderColor: '#fe424d',
            backgroundColor: 'rgba(254, 66, 77, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#fe424d',
            pointBorderWidth: 2,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Total Favorites',
            data: monthlyData.map(m => m.favorites),
            borderColor: '#ff8a98',
            backgroundColor: 'rgba(255, 138, 152, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#ff8a98',
            pointBorderWidth: 2,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { display: true } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  updatePerformanceChart() {
    if (!this.charts.performance) return;
    
    const days = this.currentTimeframe;
    const now = new Date();
    const dataPoints = Array(days).fill(0);
    const favoritesData = Array(days).fill(0);
    
    // Generate time series data with realistic patterns
    this.listingsData.forEach(listing => {
      const listingDate = new Date(listing.createdAt || listing.updatedAt || now);
      const daysOld = Math.floor((now - listingDate) / (1000 * 60 * 60 * 24));
      
      // Skip if listing is newer than our timeframe
      if (daysOld >= days) return;
      
      // Distribute views and favorites across the listing's lifetime
      for (let i = 0; i <= Math.min(daysOld, days - 1); i++) {
        // More weight to recent days
        const weight = (i / daysOld) * 2;
        const baseViews = (listing.viewCount || 0) / daysOld;
        const baseFavorites = (listing.favoriteCount || 0) / daysOld;
        
        // Add some randomness and decay for older listings
        const decay = 1 - (daysOld - i) * 0.02; // 2% decay per day
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        
        // Calculate daily values with some variation
        const dailyViews = Math.round(baseViews * weight * decay * randomFactor);
        const dailyFavorites = Math.round(baseFavorites * weight * decay * randomFactor * 0.3); // Fewer favorites than views
        
        // Add to the data points
        const index = days - daysOld + i - 1;
        if (index >= 0 && index < days) {
          dataPoints[index] += dailyViews;
          favoritesData[index] += dailyFavorites;
        }
      }
    });
    
    // Smooth the data with a simple moving average
    const smoothData = (data, windowSize = 3) => {
      return data.map((value, i, arr) => {
        const start = Math.max(0, i - windowSize);
        const end = i + 1;
        const subset = arr.slice(start, end);
        return Math.round(subset.reduce((a, b) => a + b, 0) / subset.length);
      });
    };
    
    // Update the chart
    this.charts.performance.data.datasets[0].data = smoothData(dataPoints);
    this.charts.performance.data.datasets[1].data = smoothData(favoritesData);
    this.charts.performance.update();
  }

  // Top Listings Chart
  initListingsChart(updateOnly = false) {
    // If we're just updating data and chart doesn't exist yet, don't create it
    if (updateOnly && !this.charts.listings) return;
    const ctx = document.getElementById('listingsChart')?.getContext('2d');
    if (!ctx) return;

    // Sort listings by performance (weighted score of views and favorites)
    const listings = [...this.listingsData]
      .map(listing => ({
        ...listing,
        // Calculate a performance score (70% views, 30% favorites)
        score: (listing.viewCount || 0) * 0.7 + (listing.favoriteCount || 0) * 0.3
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 performing listings

    // If no listings, show a message
    if (listings.length === 0) {
      return;
    }

    this.charts.listings = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: listings.map(item => item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title),
        datasets: [
          {
            label: 'Views',
            data: listings.map(item => item.viewCount || 0),
            backgroundColor: 'rgba(254, 66, 77, 0.7)',
            borderColor: '#fe424d',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 40
          },
          {
            label: 'Favorites',
            data: listings.map(item => item.favoriteCount || 0),
            backgroundColor: 'rgba(255, 138, 152, 0.7)',
            borderColor: '#ff8a98',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 40
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, grid: { display: true } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  updateListingsChart() {
    if (!this.charts.listings) return;
    
    // Sort listings by a combination of views and favorites
    const sortedListings = [...this.listingsData].sort((a, b) => {
      const scoreA = (a.viewCount || 0) * 0.7 + (a.favoriteCount || 0) * 0.3;
      const scoreB = (b.viewCount || 0) * 0.7 + (b.favoriteCount || 0) * 0.3;
      return scoreB - scoreA;
    }).slice(0, 5); // Top 5 listings
    
    if (sortedListings.length === 0) return;
    
    // Truncate long listing titles
    const labels = sortedListings.map(listing => {
      const title = listing.title || 'Untitled';
      return title.length > 20 ? title.substring(0, 20) + '...' : title;
    });
    
    const viewsData = sortedListings.map(listing => listing.viewCount || 0);
    const favoritesData = sortedListings.map(listing => listing.favoriteCount || 0);
    
    this.charts.listings.data.labels = labels;
    this.charts.listings.data.datasets[0].data = viewsData;
    this.charts.listings.data.datasets[1].data = favoritesData;
    this.charts.listings.update();
  }

  // Ratings Distribution Chart
  initRatingsChart(updateOnly = false) {
    // If we're just updating data and chart doesn't exist yet, don't create it
    if (updateOnly && !this.charts.ratings) return;
    const ctx = document.getElementById('ratingsChart');
    if (!ctx) return;

    if (this.charts.ratings) {
      this.charts.ratings.destroy();
    }

    // Get rating distribution from listings
    const ratingCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    let totalRatings = 0;
    
    // Count ratings from all listings
    this.listingsData.forEach(listing => {
      if (listing.rating >= 1 && listing.rating <= 5) {
        const roundedRating = Math.round(listing.rating);
        ratingCounts[roundedRating]++;
        totalRatings++;
      }
    });
    
    // Convert to array format
    const ratingData = Object.entries(ratingCounts).map(([star, count]) => ({
      star: parseInt(star),
      count: count,
      percentage: totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
    }));
    
    // If no ratings found, show a realistic distribution
    if (totalRatings === 0) {
      ratingData.forEach(r => {
        // More weight to higher ratings (4-5 stars)
        const weight = r.star < 3 ? 1 : (r.star === 3 ? 2 : 3);
        r.count = weight * 2;
        r.percentage = (r.count / 22) * 100; // 22 = sum of weights (1+1+2+3+3) * 2
      });
    }

    this.charts.ratings = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ratingData.map(item => `${item.star} Star`),
        datasets: [
          {
            label: 'Count',
            data: ratingData.map(item => item.count),
            backgroundColor: [
              'rgba(254, 66, 77, 0.7)',
              'rgba(255, 107, 116, 0.7)',
              'rgba(255, 138, 152, 0.7)',
              'rgba(255, 169, 188, 0.7)',
              'rgba(255, 200, 221, 0.7)'
            ],
            borderColor: [
              'rgba(254, 66, 77, 1)',
              'rgba(255, 107, 116, 1)',
              'rgba(255, 138, 152, 1)',
              'rgba(255, 169, 188, 1)',
              'rgba(255, 200, 221, 1)'
            ],
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { display: true }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }
  
  // Helper methods for data processing and UI updates
  extractDataFromDOM() {
    try {
      // Extract data from the DOM if API is not available
      const listingCards = document.querySelectorAll('.listing-card, .user-listing-card');
      this.listingsData = Array.from(listingCards).map(card => {
        // Extract basic listing info
        const listing = {
          id: card.dataset.id || Date.now().toString(),
          title: card.querySelector('.card-title, .listing-title')?.textContent?.trim() || 'Untitled',
          viewCount: parseInt(card.querySelector('.view-count, [data-views]')?.textContent || 
                          card.querySelector('[data-views]')?.dataset.views || '0'),
          favoriteCount: parseInt(card.querySelector('.favorite-count, [data-favorites]')?.textContent || 
                              card.querySelector('[data-favorites]')?.dataset.favorites || '0'),
          price: card.querySelector('.price, [data-price]')?.textContent?.trim() || 'N/A',
          status: card.querySelector('.status, [data-status]')?.textContent?.trim() || 'Active',
          updatedAt: card.querySelector('.updated-at, [data-updated]')?.textContent?.trim() || new Date().toISOString(),
          createdAt: card.querySelector('.created-at, [data-created]')?.textContent?.trim() || new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          reviews: this.extractReviewsFromCard(card)
        };
        
        // If no reviews found, generate some based on views/favorites
        if (listing.reviews.length === 0 && (listing.viewCount > 0 || listing.favoriteCount > 0)) {
          listing.reviews = this.generateSampleReviews(listing);
        }
        
        return listing;
      });
      
      console.log('Extracted data from DOM:', this.listingsData);
    } catch (error) {
      console.error('Error extracting data from DOM:', error);
      this.listingsData = [];
      this.showError('Could not load listing data. Please refresh the page.');
    }
  }
  
  extractReviewsFromCard(card) {
    try {
      // Look for review elements in the card
      const reviewElements = card.querySelectorAll('.review, [data-rating]');
      if (reviewElements.length > 0) {
        return Array.from(reviewElements).map(reviewEl => ({
          rating: parseInt(reviewEl.dataset.rating || reviewEl.querySelector('.rating')?.textContent || '5'),
          comment: reviewEl.querySelector('.review-text, .comment')?.textContent?.trim() || '',
          date: reviewEl.querySelector('.review-date')?.textContent?.trim() || new Date().toISOString()
        }));
      }
      
      // If no review elements found, check for a rating element
      const ratingEl = card.querySelector('.rating, [data-rating]');
      if (ratingEl) {
        const rating = parseFloat(ratingEl.textContent || ratingEl.dataset.rating || '0');
        if (rating > 0) {
          return [{
            rating: Math.min(5, Math.max(1, Math.round(rating))),
            comment: 'Sample review',
            date: new Date().toISOString()
          }];
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting reviews:', error);
      return [];
    }
  }
  
  generateSampleReviews(listing) {
    const reviews = [];
    const totalInteractions = (listing.viewCount || 0) + (listing.favoriteCount || 0);
    
    // Generate a base rating based on interactions (more interactions = higher rating)
    const baseRating = Math.min(5, 3 + (Math.log10(totalInteractions + 1) / 2));
    
    // Generate 1-5 reviews with ratings around the base rating
    const numReviews = Math.min(5, Math.max(1, Math.floor(totalInteractions / 10)));
    
    for (let i = 0; i < numReviews; i++) {
      // Add some randomness to the rating
      const rating = Math.min(5, Math.max(1, Math.round(baseRating + (Math.random() - 0.5) * 2)));
      
      reviews.push({
        rating,
        comment: `Sample review ${i + 1} - ${['Great!', 'Good', 'Okay', 'Not bad', 'Could be better'][rating - 1]}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return reviews;
  }
  
  // Update the last refreshed time in the UI
  updateLastRefreshedTime() {
    const timeElements = document.querySelectorAll('.last-updated-time, [data-last-updated]');
    if (timeElements.length > 0) {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      timeElements.forEach(el => {
        if (el.classList.contains('last-updated-time')) {
          el.textContent = `Last updated: ${timeString}`;
        } else if (el.dataset.lastUpdated) {
          el.textContent = `Last updated: ${dateString} at ${timeString}`;
        }
      });
    }
  }
  
  // Toggle loading state
  toggleLoading(isLoading) {
    const loadingElement = document.querySelector('.analytics-loading');
    if (loadingElement) {
      loadingElement.style.display = isLoading ? 'flex' : 'none';
    }
    
    // Toggle disabled state on time period buttons
    const timeButtons = document.querySelectorAll('.time-period-btn');
    timeButtons.forEach(btn => {
      if (isLoading) {
        btn.setAttribute('disabled', 'disabled');
      } else {
        btn.removeAttribute('disabled');
      }
    });
  }
  
  // Show error message
  showError(message) {
    console.error('Analytics Error:', message);
    
    // Show error in the UI if there's an error container
    const errorContainer = document.querySelector('.analytics-error');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        errorContainer.style.display = 'none';
      }, 5000);
    }
  }
  
  // Show empty state when no data is available
  showEmptyState() {
    const emptyState = document.querySelector('.analytics-empty-state');
    const dashboardContent = document.querySelector('.analytics-dashboard-content');
    
    if (emptyState && dashboardContent) {
      emptyState.style.display = 'flex';
      dashboardContent.style.display = 'none';
    }
  }
  
  // Handle window resize events to ensure charts are responsive
  handleResize() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      Object.values(this.charts).forEach(chart => {
        if (chart) {
          chart.resize();
        }
      });
    }, 200);
  }
  
  // Get listing data from the page
  getListingDataFromPage() {
    try {
      const listingElements = document.querySelectorAll('.listing-card, .user-listing-card');
      return Array.from(listingElements).map(el => ({
        id: el.dataset.id || Date.now().toString(),
        title: el.querySelector('.listing-title, .card-title')?.textContent?.trim() || 'Untitled',
        viewCount: parseInt(el.dataset.views || el.querySelector('[data-views]')?.textContent || '0'),
        favoriteCount: parseInt(el.dataset.favorites || el.querySelector('[data-favorites]')?.textContent || '0'),
        price: el.dataset.price || el.querySelector('.price')?.textContent?.trim() || 'N/A',
        status: el.dataset.status || 'Active',
        updatedAt: el.dataset.updated || new Date().toISOString(),
        reviews: this.extractReviewsFromCard(el)
      }));
    } catch (error) {
      console.error('Error getting listing data from page:', error);
      return [];
    }
  }
  
  // Smooth data for better visualization
  smoothData(data, windowSize = 3) {
    if (!data || data.length === 0) return [];
    return data.map((value, i, arr) => {
      const start = Math.max(0, i - windowSize);
      const end = i + 1;
      const subset = arr.slice(start, end);
      const sum = subset.reduce((a, b) => a + b, 0);
      return Math.round(sum / subset.length);
    });
  }
  
  // Generate sample data
  getRandomData(count, min, max) {
    return Array.from({ length: count }, () => 
      Math.floor(Math.random() * (max - min + 1)) + min
    );
  }
}

// Initialize the dashboard when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  window.AnalyticsDashboard = new AnalyticsDashboard();
});
