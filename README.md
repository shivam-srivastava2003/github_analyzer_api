# 🚀 GitHub Profile Analyzer API

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/framework-Express.js-blue.svg?style=flat-square)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/database-MySQL-orange.svg?style=flat-square)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Deployment: Render](https://img.shields.io/badge/Deployment-Render-violet.svg?style=flat-square)](https://render.com/)
[![Database: Railway](https://img.shields.io/badge/Database-Railway-purple.svg?style=flat-square)](https://railway.app/)

A high-performance, production-ready backend service that fetches public GitHub profile and repository data, computes custom developer metrics, caches findings in a MySQL database, and exposes structured RESTful APIs for retrieval and management.

---

## 📌 Overview
The **GitHub Profile Analyzer API** is designed to provide recruiters and developers with deep insights into GitHub profiles. By calling the public GitHub REST API, the service computes analytical metrics such as total stars, total forks, account age, a custom engagement score, and developer levels. To avoid rate-limiting and minimize network latency, results are cached in a MySQL database and automatically served on subsequent requests.

---

## ⚡ Features
- **GitHub Profile Analysis**: Extracts profile metadata, counts, and account age.
- **Repository Analysis**: Aggregates total stars, total forks, and identifies top repositories.
- **Language Breakdown**: Generates a JSON map counting repository distributions by primary programming language.
- **Engagement Score Calculation**: Computes scores using the formula: `(followers * 0.4) + (public_repos * 0.3) + (total_stars * 0.3)`.
- **Profile Classification**: Classifies profiles into tiers: `Beginner` (0-30), `Intermediate` (31-60), `Advanced` (61-80), or `Expert` (81+).
- **MySQL Data Storage**: Uses optimized indexing for high-frequency queries.
- **RESTful APIs**: Provides a complete set of CRUD operations.
- **Pagination & Filtering**: Supports paginated queries, sorting, and full-text searching on profiles.
- **Robust Error Handling**: Implements request validation, schema verification, and global error routing.
- **Railway MySQL Integration**: Designed to integrate with Railway's single-database provisioning model.
- **Render Deployment**: Production-ready setup featuring environment variable bindings and dynamic port resolution.

---

## 🛠️ Tech Stack
- **Runtime Environment**: Node.js (v18+)
- **Backend Framework**: Express.js
- **Database Engine**: MySQL (v5.7+ / v8.0+)
- **HTTP Client**: Axios (GitHub API communications)
- **API Documentation**: Swagger UI Express, Swagger JSDoc (OpenAPI 3.0)
- **Deployment Platform**: Render (Web Service), Railway (MySQL Database)

---

## 📂 Project Structure
```text
project/
│
├── src/
│   ├── config/
│   │   └── db.js              # Self-healing database connection & table auto-creation
│   │
│   ├── controllers/
│   │   └── githubController.js # Route controller logic & caching checks
│   │
│   ├── services/
│   │   └── githubService.js   # GitHub API integration & MySQL CRUD queries
│   │
│   ├── routes/
│   │   └── githubRoutes.js     # API route routes and Swagger OpenAPI JSDoc
│   │
│   ├── middleware/
│   │   ├── errorHandler.js    # Global error catcher & async handlers
│   │   ├── requestLogger.js   # Morgan logging middleware configuration
│   │   └── validate.js        # Parameter & body validation schema checks
│   │
│   ├── utils/
│   │   └── analyzer.js        # Custom analytics calculations (scores, languages, levels)
│   │
│   └── app.js                 # App configuration & startup hook
│
├── .env.example               # Template file for environment properties
├── .gitignore                 # Specifies intentionally untracked files
├── database.sql               # Clean SQL table schemas
├── package.json               # Node dependencies & running scripts
├── README.md                  # Professional documentation
└── postman_collection.json    # Ready-to-import HTTP request collection
```

---

## ⚙️ Environment Variables
Create a `.env` file in the root directory and define the following environment variables:

| Variable | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | `3000` | The port the application will bind to. |
| `DB_HOST` | Yes | `127.0.0.1` | MySQL server hostname. |
| `DB_PORT` | Yes | `3306` | MySQL connection port. |
| `DB_USER` | Yes | `root` | Database username. |
| `DB_PASSWORD` | No | *None* | Database password. |
| `DB_NAME` | Yes | `railway` | Target database name. |
| `NODE_ENV` | Yes | `production` | Environment mode (`development` or `production`). |
| `GITHUB_TOKEN` | No | *None* | GitHub Personal Access Token (PAT) for higher limits (5,000 req/hr). |
| `RATE_LIMIT_WINDOW_MS`| Yes | `900000` | Rate limiting timeframe (15 minutes in milliseconds). |
| `RATE_LIMIT_MAX` | Yes | `100` | Maximum requests permitted per IP per window. |

---

## 💾 Database Setup
The application features a **self-healing database module** that checks and automatically builds the required table structure on boot. However, to manually load the schema:

1. Connect to your database using the CLI or a GUI tool (DBeaver, TablePlus, etc.).
2. Execute the queries inside the `database.sql` file:
   ```bash
   mysql -h <DB_HOST> -u <DB_USER> -p <DB_NAME> < database.sql
   ```

---

## 🏃 Running Locally

1. **Clone the repository & install dependencies**:
   ```bash
   npm install
   ```
2. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and specify your database and optional GITHUB_TOKEN configurations.*

3. **Start the server in Development mode**:
   ```bash
   npm run dev
   ```
   *The server will start up under `http://localhost:5000` and automatically reload on file saves via Nodemon.*

4. **Start the server in Production mode**:
   ```bash
   npm start
   ```

---

## 📌 API Endpoints

### 1. Analyze GitHub Profile
- **Endpoint**: `POST /api/profiles/analyze`
- **Request Body**:
  ```json
  {
    "username": "torvalds"
  }
  ```
- **Response (201 Created - Fresh / 200 OK - Cached)**:
  ```json
  {
    "success": true,
    "message": "Profile analyzed successfully",
    "data": {
      "id": 1,
      "username": "torvalds",
      "name": "Linus Torvalds",
      "bio": "The Creator of Linux & Git",
      "avatar_url": "https://avatars.githubusercontent.com/u/1024025?v=4",
      "github_url": "https://github.com/torvalds",
      "followers": 207572,
      "following": 0,
      "public_repos": 7,
      "public_gists": 0,
      "account_created_at": "2011-09-03T15:26:40.000Z",
      "top_language": "C",
      "total_stars": 221087,
      "total_forks": 54020,
      "engagement_score": 149354.9,
      "profile_level": "Expert",
      "languages_breakdown": {
        "C": 5,
        "Assembly": 1,
        "Shell": 1
      },
      "top_repos": [
        {
          "name": "linux",
          "description": "Linux kernel source tree",
          "stars": 176210,
          "forks": 51759,
          "url": "https://github.com/torvalds/linux"
        }
      ],
      "analysis_date": "2026-06-07T10:35:44.000Z"
    }
  }
  ```

### 2. Get All Profiles
- **Endpoint**: `GET /api/profiles`
- **Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Records per page (default: `10`)
  - `sort`: Column name to sort by (default: `analysis_date`)
  - `order`: Sort order (`ASC` or `DESC`, default: `DESC`)
  - `search`: Matches characters in `username` or `name`
- **Request Example**: `GET /api/profiles?page=1&limit=2&sort=engagement_score&order=DESC&search=linus`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "metadata": {
      "totalItems": 1,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 2,
      "sortColumn": "engagement_score",
      "sortOrder": "DESC"
    },
    "data": [
      {
        "id": 1,
        "username": "torvalds",
        "name": "Linus Torvalds",
        "bio": "The Creator of Linux & Git",
        "avatar_url": "https://avatars.githubusercontent.com/u/1024025?v=4",
        "github_url": "https://github.com/torvalds",
        "followers": 207572,
        "following": 0,
        "public_repos": 7,
        "public_gists": 0,
        "account_created_at": "2011-09-03T15:26:40.000Z",
        "top_language": "C",
        "total_stars": 221087,
        "total_forks": 54020,
        "engagement_score": 149354.9,
        "profile_level": "Expert",
        "languages_breakdown": {
          "C": 5,
          "Assembly": 1,
          "Shell": 1
        },
        "top_repos": [
          {
            "name": "linux",
            "stars": 176210,
            "forks": 51759,
            "url": "https://github.com/torvalds/linux"
          }
        ],
        "analysis_date": "2026-06-07T10:35:44.000Z"
      }
    ]
  }
  ```

### 3. Get Profile By Username
- **Endpoint**: `GET /api/profiles/:username`
- **Request Example**: `GET /api/profiles/torvalds`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "username": "torvalds",
      "name": "Linus Torvalds",
      "followers": 207572,
      "engagement_score": 149354.9,
      "profile_level": "Expert"
    }
  }
  ```


  

### 4. Delete Profile
- **Endpoint**: `DELETE /api/profiles/:username`
- **Request Example**: `DELETE /api/profiles/torvalds`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile for user 'torvalds' deleted successfully"
  }
  ```

---

## ⚠️ Error Responses
All endpoints use structured, predictable JSON error responses:

### 400 Bad Request
Occurs due to missing parameters or invalid formatting.
```json
{
  "success": false,
  "message": "Invalid GitHub username format"
}
```

### 404 Not Found
Occurs when requesting a profile that does not exist in the database or when querying a non-existent GitHub user.
```json
{
  "success": false,
  "message": "GitHub user 'thisuserdefinitelydoesnotexist12345' not found"
}
```

### 429 Rate Limit
Occurs when an IP exceeds request limits within the rate limit window.
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again after 15 minutes."
}
```

### 500 Internal Server Error
Returned when unexpected database errors or system failures occur.
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## 🌐 Deployment

### 1. Railway MySQL Setup
1. Log in to [Railway](https://railway.app/) and click **New Project** -> **Provision MySQL**.
2. Go to **Variables** inside the MySQL service and copy the database credentials (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`).
3. Note: No database creation query is required; the application will automatically create the tables on the provisioned `railway` database.

### 2. Render Deployment
1. Log in to [Render](https://render.com/) and click **New** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the build parameters:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Set the environment variables copied from Railway:
   - `NODE_ENV`: `production`
   - `DB_HOST`: *(Railway MYSQLHOST)*
   - `DB_PORT`: *(Railway MYSQLPORT)*
   - `DB_USER`: *(Railway MYSQLUSER)*
   - `DB_PASSWORD`: *(Railway MYSQLPASSWORD)*
   - `DB_NAME`: `railway`
   - `GITHUB_TOKEN`: *(your GitHub Personal Access Token)*

---

## 🔗 Live Demo
- **Live API**: [https://your-render-url.onrender.com](https://your-render-url.onrender.com)
- **GitHub Repository**: [https://github.com/your-username/github-analyzer-api](https://github.com/your-username/github-analyzer-api)

---

## 🧪 Testing
A complete Postman collection is included in the project root to enable rapid testing.
1. Import **[postman_collection.json](file:///d:/Project/Github_Api/postman_collection.json)** into Postman.
2. In the collection variables, verify that `baseUrl` matches the target host (e.g. `http://localhost:5000` or your Render live link).
3. Execute requests sequentially to test validation, CRUD actions, and caching metrics.

---

## 🔒 Security Considerations
- **Environment Variables**: Sensitive connection strings and GitHub keys are loaded via `.env` and excluded from git tracking.
- **Rate Limiting**: Integrated `express-rate-limit` prevents brute force and DDoS requests.
- **GitHub Token Usage**: Attaches authentication headers safely to increase API limit from 60 to 5000 requests/hr.
- **Input Validation**: Restricts input fields using strict regex to prevent code injection and invalid calls.

---

## 🔮 Future Improvements
- **Authentication**: JWT-based security middleware for admin-only endpoints (e.g., delete).
- **Redis Caching**: Separate key-value memory store for lightning-fast cache resolutions.
- **Docker Support**: Containerizing server and database for uniform local and cloud runtimes.
- **CI/CD Pipeline**: GitHub Actions automation for linting, testing, and auto-deployments.
- **Analytics Dashboard**: Dynamic frontend dashboard displaying graphs and top languages.

---

## ✍️ Author
**Shivam Kumar**
- GitHub: [@shivam-srivastava2003](https://github.com/shivam-srivastava2003)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) page for details.