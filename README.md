# GitHub Profile Analyzer API

## 📋 Project Overview
The GitHub Profile Analyzer API is a production-ready REST service that retrieves, analyzes, and caches public statistics for GitHub user profiles and repositories. Built on Node.js, Express, and MySQL, the application computes user engagement metrics and identifies top languages and repositories, caching data locally for fast retrieval on subsequent requests.

---

## ✨ Features
- **Automated Analytics Engine**: 
  - Computes an **Engagement Score**: `(followers * 0.4) + (public_repos * 0.3) + (total_stars * 0.3)`.
  - Determines a **Profile Level**: `Beginner` (0-30), `Intermediate` (31-60), `Advanced` (61-80), or `Expert` (81+).
- **Repository Language Breakdown**: Counts how many repositories are written in each language.
- **Top 5 Starred Repositories**: Lists the top 5 starred repositories with descriptions, counts, and URLs.
- **Self-Healing Database Setup**: Automatically checks for, creates, and verifies the required database schemas and tables on server startup.
- **Production Security**: Includes Helmet headers, CORS policies, and Express Rate Limiting.
- **OpenAPI / Swagger**: Interactive API documentation served under `/api-docs`.
- **System Health Diagnostics**: Connective check `/health` monitoring the database pool.

---

## 🏗️ Architecture
The project is built on **Clean Architecture** patterns, separating concerns cleanly:
```text
project/
├── src/
│   ├── config/          # Database pool initialization (db.js)
│   ├── controllers/     # Request/response validation & handlers (githubController.js)
│   ├── services/        # Business logic & Database CRUD operations (githubService.js)
│   ├── routes/          # Express route bindings (githubRoutes.js)
│   ├── middleware/      # Error handler, Logger, & Request Validator
│   ├── utils/           # Computations and custom formulas (analyzer.js)
│   └── app.js           # Server bootstrapper & middleware configuration
├── database.sql         # Clean SQL table schemas
├── .env.example         # Template file for environment config
├── package.json         # Scripts and dependencies
└── README.md            # Detailed documentation
```

---

## ⚙️ Environment Variables
Create a `.env` file in the root directory and copy details from `.env.example`:

| Key | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Local host port | `5000` |
| `DB_HOST` | MySQL hostname | `127.0.0.1` |
| `DB_PORT` | MySQL connection port | `3306` |
| `DB_USER` | MySQL database user | `root` |
| `DB_PASSWORD` | MySQL user password | *None* |
| `DB_NAME` | Database name | `railway` |
| `NODE_ENV` | Environment state | `production` |
| `GITHUB_TOKEN` | (Optional) GitHub Token to increase rate limits | *None* |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting timeframe (in ms) | `900000` (15m) |
| `RATE_LIMIT_MAX` | Max allowed requests per IP per window | `100` |

---

## 🚀 Installation Steps

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and configure credentials:
   ```bash
   cp .env.example .env
   ```

3. **Start the Application**:
   - **Development (With Nodemon)**:
     ```bash
     npm run dev
     ```
   - **Production**:
     ```bash
     npm start
     ```

---

## 🗄️ Railway Database Setup
1. Sign up/Log in to [Railway](https://railway.app/).
2. Click **New Project** and select **Provision MySQL**.
3. Once initialized, select the MySQL service, navigate to **Variables**, and copy the credentials:
   - `MYSQLHOST` (Host)
   - `MYSQLPORT` (Port)
   - `MYSQLUSER` (User)
   - `MYSQLPASSWORD` (Password)
   - `MYSQLDATABASE` (Name, defaults to `railway`)
4. To initialize tables manually, run the queries inside `database.sql` using a database GUI client (like DBeaver or TablePlus) or the command line:
   ```bash
   mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> railway < database.sql
   ```
   *Note: Our application's `src/config/db.js` will automatically check for and create the table on boot if it does not exist.*

---

## 🌐 Render Deployment Steps
1. Sign up/Log in to [Render](https://render.com/).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository containing the project.
4. Set the build parameters:
   - **Name**: `github-profile-analyzer-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Go to the **Environment** tab of your Render service and add your variables copied from Railway:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (Render overrides this automatically, but setting it maintains consistency)
   - `DB_HOST`: *(Railway MYSQLHOST)*
   - `DB_PORT`: *(Railway MYSQLPORT)*
   - `DB_USER`: *(Railway MYSQLUSER)*
   - `DB_PASSWORD`: *(Railway MYSQLPASSWORD)*
   - `DB_NAME`: `railway`
   - `GITHUB_TOKEN`: *(your github PAT)*
6. Click **Deploy Web Service**. Render will build and expose the web service under a public HTTPS URL.

---

## 📌 API Endpoints & Examples

### 1. Health Status
- **Endpoint**: `GET /health`
- **Description**: Verifies API running status and DB connection.
- **Example Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": "UP",
    "timestamp": "2026-06-07T12:00:00.000Z",
    "database": "Connected"
  }
  ```

### 2. Analyze Profile
- **Endpoint**: `POST /api/profiles/analyze`
- **Example Request Body**:
  ```json
  {
    "username": "torvalds"
  }
  ```
- **Example Response (201 Created)**:
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
      "engagement_score": 149354.90,
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

### 3. Get All Profiles
- **Endpoint**: `GET /api/profiles`
- **Supported Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Records per page (default: `10`)
  - `sort`: Column name to sort by (default: `analysis_date`)
  - `order`: Sort order: `ASC` or `DESC` (default: `DESC`)
  - `search`: Matching filter for `username` or `name`
- **Example Request**: `/api/profiles?page=1&limit=5&sort=engagement_score&order=DESC&search=linus`

### 4. Get Single Profile
- **Endpoint**: `GET /api/profiles/:username`
- **Example Request**: `GET /api/profiles/torvalds`

### 5. Refresh Profile
- **Endpoint**: `POST /api/profiles/:username/refresh`
- **Example Request**: `POST /api/profiles/torvalds/refresh`

### 6. Delete Profile
- **Endpoint**: `DELETE /api/profiles/:username`
- **Example Request**: `DELETE /api/profiles/torvalds`

---

## 🗂️ Postman Collection Usage
1. Open Postman, click **Import** and select the `postman_collection.json` file in the project root.
2. In the collection variables, confirm that `baseUrl` is set to the correct active host (e.g. `http://localhost:5000` or your Render service link).
3. Run the requests sequentially to verify full CRUD lifecycle operations.

---

## ✍️ Author
Shivam Kumar