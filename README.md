# GitHub Profile Analyzer API

A production-ready REST API built using **Node.js, Express, and MySQL** that fetches public GitHub profile data, analyzes user activity, calculates engagement metrics, and stores the results locally for high-performance cached access.

---

## 🚀 Features

- **Automated Profile Analysis**: Calculates total stars, total forks, account age, and tracks repositories.
- **Custom Analytics Engine**:
  - Calculates an **Engagement Score**: `followers * 0.4 + repos * 0.3 + stars * 0.3`
  - Assigns a **Profile Level**: `Beginner` (0-30), `Intermediate` (31-60), `Advanced` (61-80), `Expert` (81+)
- **Repository Insights**:
  - Complete language breakdown (counts repositories by main language).
  - Identifies top 5 most starred repositories.
- **High-Performance Caching**: Automatically saves processed profiles to a MySQL database and retrieves from cache on subsequent calls.
- **Robust Endpoints**: Complete CRUD for profiles with support for sorting, pagination, and full-text searches.
- **Production Security**: Configured with `helmet` for HTTP headers, standard `cors` configuration, and request `rate-limiting` (prevents DDoS and abuse).
- **Interactive Swagger Docs**: Served directly at `/api-docs` using OpenAPI 3.0 specs.
- **System Diagnostics**: Built-in `/health` health-check for DB connection and server state.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+ recommended)
- **Framework**: Express.js
- **Database**: MySQL (v5.7+ / v8.0+)
- **HTTP Client**: Axios (for communicating with GitHub REST API v3)
- **Security**: Helmet, CORS, Express Rate Limit
- **Documentation**: Swagger UI Express, Swagger JSDoc
- **Configuration & Logging**: Dotenv, Morgan (Request Logger)

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Define the configuration variables inside `.env`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the application will run on | `3000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `DB_HOST` | MySQL host address | `127.0.0.1` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_USER` | MySQL database user | `root` |
| `DB_PASSWORD`| MySQL database password | `""` |
| `DB_NAME` | MySQL database name | `github_analyzer_db` |
| `GITHUB_TOKEN`| **(Highly Recommended)** GitHub Personal Access Token (PAT) to increase API rate limit from 60 to 5000 requests/hr. | *None* |
| `RATE_LIMIT_WINDOW_MS`| Rate limit time window in milliseconds | `900000` (15 mins) |
| `RATE_LIMIT_MAX` | Max allowed requests per IP within the window | `100` |

---

## 🗄️ Database Setup

Create the database and table using the provided `database.sql` script:

```bash
# Log into MySQL CLI
mysql -u root -p

# Run the SQL schema script
mysql -u root -p < database.sql
```

### Table Structure (`github_profiles`)

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INT` | Primary Key, Auto-increment |
| `username` | `VARCHAR(100)` | GitHub username (Unique, Indexed) |
| `name` | `VARCHAR(255)` | Public display name |
| `bio` | `TEXT` | GitHub bio statement |
| `avatar_url` | `VARCHAR(500)` | Public avatar URL |
| `github_url` | `VARCHAR(500)` | Link to GitHub profile |
| `followers` | `INT` | Total followers count |
| `following` | `INT` | Total following count |
| `public_repos` | `INT` | Public repositories count |
| `public_gists` | `INT` | Public gists count |
| `account_created_at`| `TIMESTAMP` | GitHub account creation date |
| `top_language` | `VARCHAR(100)` | Main language used across repositories |
| `total_stars` | `INT` | Sum of stars across all repositories |
| `total_forks` | `INT` | Sum of forks across all repositories |
| `engagement_score` | `DECIMAL(6,2)` | Computed metric: `followers * 0.4 + repos * 0.3 + stars * 0.3` |
| `profile_level` | `VARCHAR(50)` | Score tier: `Beginner`, `Intermediate`, `Advanced`, `Expert` |
| `languages_breakdown` | `JSON` | Counts of repositories by language |
| `top_repos` | `JSON` | List of top 5 starred repositories |
| `analysis_date` | `TIMESTAMP` | Time stamp of the last analysis/refresh |

---

## 🚀 Installation & Local Run

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Run database scripts** and configure `.env` (refer to the **Database Setup** section).

3. **Start the application**:

   **Development mode** (runs using native Node --watch reload):
   ```bash
   npm run dev
   ```

   **Production mode**:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
5. Access Swagger documentation at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

---

## 📌 API Endpoints

### 1. Health Check
- **Endpoint**: `GET /health`
- **Description**: Returns server status and MySQL database connectivity.

### 2. Analyze Profile
- **Endpoint**: `POST /api/profiles/analyze`
- **Request Body**:
  ```json
  {
    "username": "torvalds"
  }
  ```
- **Response (201 Created / 200 OK if cached)**:
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
      "followers": 204900,
      "following": 0,
      "public_repos": 7,
      "public_gists": 0,
      "account_created_at": "2011-09-03T15:26:40.000Z",
      "top_language": "C",
      "total_stars": 194120,
      "total_forks": 38100,
      "engagement_score": 140198.10,
      "profile_level": "Expert",
      "languages_breakdown": {
        "C": 5,
        "Shell": 1,
        "Assembly": 1
      },
      "top_repos": [
        {
          "name": "linux",
          "description": "Linux kernel source tree",
          "stars": 169000,
          "forks": 49000,
          "url": "https://github.com/torvalds/linux"
        }
      ],
      "analysis_date": "2026-06-07T14:50:00.000Z"
    }
  }
  ```

### 3. Get All Profiles
- **Endpoint**: `GET /api/profiles`
- **Supported Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Records per page (default: `10`, max: `100`)
  - `sort`: Column name to sort by (default: `analysis_date`)
  - `order`: Sort order: `ASC` or `DESC` (default: `DESC`)
  - `search`: Matches characters in `username` or `name`
- **Example**: `GET /api/profiles?page=1&limit=2&sort=engagement_score&order=DESC&search=linus`

### 4. Get Single Profile
- **Endpoint**: `GET /api/profiles/:username`
- **Description**: Returns local DB analysis for `username`. Returns `404` if not found in database cache.

### 5. Refresh Analysis
- **Endpoint**: `POST /api/profiles/:username/refresh`
- **Description**: Bypasses local database cache, pulls the latest data directly from the GitHub API, computes metrics, and updates the local record.

### 6. Delete Profile
- **Endpoint**: `DELETE /api/profiles/:username`
- **Description**: Deletes the analyzed profile records for the given username.

---

## 🗂️ Postman Collection Usage

1. Open Postman.
2. Click **Import** in the top left.
3. Select the `postman_collection.json` file from the project root.
4. The collection defines a collection variable `baseUrl` (default: `http://localhost:3000`). If your local server is on a different port, update the variable in the collection settings.
5. All requests have pre-configured JSON bodies and queries for instant execution.

---

## 🌐 Deployment Guide

This application is ready to deploy to PaaS platforms like **Render**.

### Render Deployment

1. Set up a **Web Service** on Render connected to your Git repository.
2. Select **Node** environment.
3. Build command: `npm install`
4. Start command: `npm start`
5. Provision a **Render MySQL Database** (or use an external database service like Aiven/PlanetScale).
6. Under the Web Service **Environment** tab, enter the database connection credentials in the corresponding keys (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
7. Execute the `database.sql` script to create tables in the remote database.
