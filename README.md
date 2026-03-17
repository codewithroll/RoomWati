# 🏠 RoomWati — The Ultimate Room Rental Platform

[![Node.js](https://img.shields.io/badge/Node.js-22.7.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-blue?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-success?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-lightgrey?style=flat-square)](https://opensource.org/licenses/ISC)
[![Live Demo](https://img.shields.io/badge/Live-Demo-orange?style=flat-square&logo=render)](https://roomwati.onrender.com)

> **RoomWati** is a full-featured room rental and property listing platform designed to connect landlords with tenants in a seamless and secure environment. From OTP-based signup to smart filtering, RoomWati empowers users with tools to list, manage, and rent properties — all from one responsive dashboard.

---

## 🌟 Key Features

### 👤 User Authentication
- Secure registration & login via **Passport.js**
- **Session-based login** with `express-session`
- Passwords are hashed and salted via `passport-local-mongoose`

### 📋 Property Listings
- Users can **create**, **view**, **edit**, and **delete** property listings
- Listings support:
  - ✅ Title, description, location
  - 📷 Multiple images via **Multer + Cloudinary**
  - 💲 Price, availability, category tags
- Listings appear on homepage & filtered search pages

### 🗂️ Smart Filtering & Search
- Search by **location**, **price range**, and **category**
- Live filter using custom JavaScript in `room-filters.js`

### 📈 Analytics Dashboard
- Users can track **views, performance, and interactions** of their listings
- Built using custom logic in `analytics.js`
- Shows:
  - 👁️ Total Views
  - 💬 Review Count
  - 🧾 Listed Properties
  - 📊 Engagement trends (future scope: charts)
- **Objective:** Help users optimize their listings and boost visibility

### 📝 Reviews & Ratings
- Logged-in users can leave **reviews** on any listing
- Reviews stored in MongoDB, tied to both **user** and **listing**
- Listings show average rating and total reviews count

### 📧 OTP Verification
- Signup flow includes **OTP-based email verification**
- Powered by **EmailJS** (frontend) + server-side logic
- One-time codes generated and validated securely

### 🗃️ Admin Tools (Built-in)
- Admins can:
  - ❌ Remove listings or reviews
  - 🔐 Ban/flag users (future feature)
  - 📤 Manage content uploads

### 📍 Geolocation
- Addresses are converted to coordinates via **Node-Geocoder**
- Future scope: Integrate with Google Maps / Mapbox for visual location

### 🖼️ Image Uploads
- Upload multiple images to **Cloudinary** using Multer middleware
- Optimize quality, store links in MongoDB
- Public-facing gallery in each listing

### 🔔 Flash Messaging
- Custom alerts on:
  - Login success/failure
  - Errors & validation messages
  - OTP sent/verified

### 📱 Responsive UI
- Built using **Bootstrap 5**
- Fully mobile-friendly
- Custom EJS layouts with partials (`EJS-Mate`) for DRY structure

---


## 🧰 Tech Stack

### 🖥️ Frontend
- **EJS + EJS-Mate** — Templating engine
- **Bootstrap 5** — UI framework
- **Font Awesome** — Icons
- **Custom JS** — OTP, filters, analytics

### 🧪 Backend
- **Node.js + Express.js**
- **MongoDB Atlas** + **Mongoose**
- **Passport.js** — Auth (local strategy)
- **Multer** + **Cloudinary** — File handling
- **Joi** — Schema validation
- **Connect-Flash**, **Method-Override**, **Cookie-Parser**

### ☁️ Integrations
- **EmailJS** — Email-based OTP system
- **Nodemailer** — Optional fallback email sender
- **Cloudinary** — Image & file management
- **Dotenv** — Environment variable loader

---

## 🔒 Security Measures

> RoomWati is built with a strong focus on backend security and data integrity.

- 🔐 **Hashed Passwords:** Securely stored with `passport-local-mongoose`
- 🛡️ **Session Management:** Via `express-session` with secret keys
- 🧾 **Input Validation:** Using `Joi` for user data, reviews, listings
- 📦 **File Upload Security:** Multer config accepts only images
- ☁️ **Environment Protection:** Secrets managed via `.env`
- ⚠️ **Error Handling:** Custom middleware and async wrappers
- 🚫 **CSRF (Planned):** CSRF token protection coming soon

---

## 🗂️ Project Structure

```bash
RoomWati/
├── controllers/       # Route handlers
│   ├── listings.js
│   ├── reviews.js
│   └── users.js
├── models/            # Mongoose models
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── routes/            # Express routes
│   ├── auth.js
│   ├── listings.js
│   ├── review.js
│   └── user.js
├── views/             # EJS templates
│   ├── includes/     
│   ├── layouts/       
│   ├── listings/
│   └── users/
├── public/            # Static files
│   ├── images/
│   └── js/
│       ├── analytics.js
│       ├── email-service.js
│       ├── forgot-password.js
│       ├── room-filters.js
│       └── script.js
├── middleware.js      # Custom auth/middleware
├── schema.js          # Joi schemas
├── cloudConfig.js     # Cloudinary setup
├── utils/             # Helpers
│   ├── ExpressError.js
│   └── wrapAsync.js
├── .env
├── app.js
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- Cloudinary account
- EmailJS account (for OTP)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shourya9058/RoomWati.git
   cd RoomWati
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add:
   ```
   ATLASDB_URL=your_mongodb_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_KEY=your_cloudinary_api_key
   CLOUDINARY_SECRET=your_cloudinary_api_secret
   SESSION_SECRET=your_session_secret
   EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   EMAILJS_SERVICE_ID=your_emailjs_service_id
   EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and go to `http://localhost:3000`

## 📸 App Screenshots

> A glimpse into RoomWati's user interface and key workflows.

<p align="center">
  <img src="public/screenshots/homepage.png" alt="🏠 Homepage" width="700"/>
  <br><strong>🏠 Homepage</strong>
</p>

<p align="center">
  <img src="public/screenshots/index-page.png" alt="📋 Listings Index Page" width="700"/>
  <br><strong>📋 Listings Index Page</strong>
</p>

<p align="center">
  <img src="public/screenshots/user-dashboard.png" alt="📊 User Dashboard" width="700"/>
  <br><strong>📊 User Dashboard</strong>
</p>

<p align="center">
  <img src="public/screenshots/show-page.png" alt="🏘️ Property Detail Page" width="700"/>
  <br><strong>🏘️ Property Detail Page</strong>
</p>

<p align="center">
  <img src="public/screenshots/signup-otp.png" alt="🔐 Signup / OTP Verification" width="700"/>
  <br><strong>🔐 Signup Form</strong>
</p>


## 🔒 Security Features

- Password hashing with passport-local-mongoose
- Session management with express-session
- CSRF protection
- Input validation with Joi
- Secure file upload handling
- Environment variable protection

## 📝 Notes

- The application follows MVC architecture
- Error handling with custom error classes
- Client-side validation with server-side verification
- Responsive design for mobile and desktop

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by Shourya Singh
</div>
