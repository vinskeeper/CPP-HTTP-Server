# 🌐 Simple HTTP Server with C++ & cpp-httplib & pqxx

This project is a **lightweight C++ HTTP server** built with [`cpp-httplib`](https://github.com/yhirose/cpp-httplib) and integrated with **PostgreSQL** via [`libpqxx`](https://github.com/jtv/libpqxx). 

It features a high-end, responsive developer landing page and interactive database testing sandbox (**PgConnect DB-Bench**) to test connection strings, monitor real-time API round-trip latency, and inspect database query outputs.

---

## ✨ Features
- **Interactive Query Sandbox**: Ping the C++ server and retrieve real-time data from PostgreSQL via `/api/db-time`.
- **Latency Benchmark Graph**: Displays the round-trip API latencies of the last 5 queries with a dynamic bar chart.
- **pqxx Connection Builder**: A user-friendly form that dynamically generates C++ connection configurations.
- **System Integration Diagram**: Interactive SVG diagram showing client-server-database communications.
- **Dynamic Port Selection**: Option to supply a custom port through terminal command arguments.
- **Graceful Shutdown**: Intercepts standard terminate signals (`SIGINT` / `SIGTERM`) to release handles cleanly.
- **HTML Memory Caching**: Static landing page assets cached in RAM at startup to reduce file I/O operations.

---

## 📂 Project Structure
```bash
CPP-HTTP-Server/
├── public/
│   └── index.html      # Premium interactive landing page & console
├── lib/
│   └── httplib.h       # cpp-httplib single-header library
└── httpserver.cpp      # Main C++ HTTP server source code
```

---

## ⚙️ Build & Run  

### 🔹 1. Setup PostgreSQL
Run a local database instance or spin up one instantly using Docker:
```bash
docker run --name pg-test -e POSTGRES_PASSWORD=root -p 5432:5432 -d postgres
```

### 🔹 2. Compile Server
Make sure you have `libpq` and `libpqxx` libraries installed.

**Windows (g++ with MSYS2 / MinGW):**
```bash
g++ httpserver.cpp -o httpserver.exe -lws2_32 -lpqxx -lpq
```

**Linux (g++):**
```bash
g++ httpserver.cpp -o httpserver -lpqxx -lpq -pthread
```

### 🔹 3. Run Server
Execute the server (optionally supply a custom port, defaults to **80**):
```bash
# Runs on default port 80
./httpserver.exe

# Or run on port 8080
./httpserver.exe 8080
```
### 🔹 4. Database Credentials Configuration (Optional)
The server dynamically loads database connection configurations from a `.env` file in the project root. If the `.env` file is missing, it will fallback to system environment variables or standard local defaults:
* `DB_NAME` (default: `postgres`)
* `DB_USER` (default: `postgres`)
* `DB_PASSWORD` (default: `root`)
* `DB_HOST` (default: `127.0.0.1`)
* `DB_PORT` (default: `5432`)

**Option A: Using `.env` file (Recommended)**
Create a `.env` file in the project root folder:
```env
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=127.0.0.1
DB_PORT=5432
```

**Option B: Using Environment Variables**
You can also set these directly in your terminal before running:
```bash
# Windows (CMD)
set DB_PASSWORD=yourpassword
.\httpserver.exe

# Windows (PowerShell)
$env:DB_PASSWORD="yourpassword"
.\httpserver.exe

# Linux / macOS
DB_PASSWORD="yourpassword" ./httpserver
```

### 🔹 5. Access Interactive Dashboard
Open your browser and navigate to:
```
http://127.0.0.1:80
```
*(If you supplied a custom port, navigate to `http://127.0.0.1:YOUR_PORT`)*

---

## 🖥️ API Endpoints
- `GET /` - Serves the statically cached interactive PgConnect dashboard.
- `GET /api/db-time` - Connects to PostgreSQL, executes `SELECT current_timestamp;`, and returns JSON:
  ```json
  {
    "status": "success",
    "db_time": "2026-06-29 16:18:16.123456+07"
  }
  ```

---

## 📜 License
MIT License © 2026
