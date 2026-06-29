#include "lib/httplib.h"
#include <chrono>
#include <csignal>
#include <ctime>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <pqxx/pqxx>
#include <sstream>
#include <string>

// Compile: g++ httpserver.cpp -o httpserver.exe -lws2_32 -lpqxx -lpq

// Default port, bisa diubah lewat command line
int server_port = 80;

// Pointer global untuk menangani graceful shutdown
httplib::Server *server_ptr = nullptr;

// Handler untuk menangkap sinyal (misalnya Ctrl+C)
void signal_handler(int signal) {
  if (server_ptr) {
    std::cout << "\n[!] Menerima sinyal penutupan (Ctrl+C). Mematikan server "
                 "dengan aman..."
              << std::endl;
    server_ptr->stop();
  }
}

// Fungsi bantuan untuk mendapatkan waktu saat ini (untuk logging)
std::string get_current_time() {
  auto now = std::chrono::system_clock::now();
  std::time_t now_c = std::chrono::system_clock::to_time_t(now);
  std::tm bt{};
#ifdef _WIN32
  localtime_s(&bt, &now_c);
#else
  localtime_r(&now_c, &bt);
#endif
  std::ostringstream oss;
  oss << std::put_time(&bt, "%Y-%m-%d %H:%M:%S");
  return oss.str();
}

// Fungsi pembaca file yang efisien (sekali baca di awal)
std::string read_file_to_string(const std::string &filepath) {
  std::ifstream file(filepath, std::ios::binary | std::ios::ate);
  if (!file)
    return "";

  auto size = file.tellg();
  std::string str(static_cast<size_t>(size), '\0');
  file.seekg(0, std::ios::beg);
  if (file.read(&str[0], size)) {
    return str;
  }
  return "";
}

// Fungsi untuk memuat file .env (jika ada)
void load_env(const std::string &filepath) {
  std::ifstream file(filepath);
  if (!file.is_open()) return;

  std::string line;
  while (std::getline(file, line)) {
    if (line.empty() || line[0] == '#') continue;
    auto delimiter_pos = line.find('=');
    if (delimiter_pos != std::string::npos) {
      std::string key = line.substr(0, delimiter_pos);
      std::string value = line.substr(delimiter_pos + 1);
#ifdef _WIN32
      _putenv_s(key.c_str(), value.c_str());
#else
      setenv(key.c_str(), value.c_str(), 1);
#endif
    }
  }
}

// Fungsi bantuan untuk mengambil env variable dengan default fallback
std::string get_env_or(const std::string &key, const std::string &default_val) {
  const char *val = std::getenv(key.c_str());
  return val ? std::string(val) : default_val;
}

int main(int argc, char *argv[]) {
  // 0. Memuat konfigurasi dari file .env
  load_env(".env");

  // 1. DYNAMIC PORT: Ambil port dari argumen terminal (contoh: ./httpserver
  // 8080)
  if (argc > 1) {
    try {
      server_port = std::stoi(argv[1]);
    } catch (...) {
      std::cerr << "Argumen port tidak valid. Menggunakan port default "
                << server_port << std::endl;
    }
  }

  httplib::Server svr;
  server_ptr =
      &svr; // Simpan pointer ke global agar bisa diakses oleh signal_handler

  // 2. GRACEFUL SHUTDOWN: Tangkap sinyal interrupt (Ctrl+C) dan terminate
  std::signal(SIGINT, signal_handler);
  std::signal(SIGTERM, signal_handler);

  // 3. CUSTOM LOGGING MIDDLEWARE: Catat setiap request yang masuk
  svr.set_logger([](const httplib::Request &req, const httplib::Response &res) {
    std::cout << "[" << get_current_time() << "] " << req.method << " "
              << req.path << " - " << res.status << std::endl;
  });

  // CACHING: Membaca index.html ke memory saat startup.
  std::string index_html = read_file_to_string("public/index.html");

  // Serve index.html di "/"
  svr.Get("/", [&index_html](const httplib::Request &, httplib::Response &res) {
    if (index_html.empty()) {
      res.status = 404;
      res.set_content("index.html not found", "text/plain");
      return;
    }
    res.set_content(index_html, "text/html");
  });

  // Serve semua file statis di folder public
  svr.set_mount_point("/", "./public");

  // 5. POSTGRESQL INTEGRATION: Endpoint untuk tes database
  svr.Get("/api/db-time", [](const httplib::Request &, httplib::Response &res) {
    try {
      // Load dari env variable untuk menghindari hardcoded credential di repository
      std::string db_name = get_env_or("DB_NAME", "postgres");
      std::string db_user = get_env_or("DB_USER", "postgres");
      std::string db_pass = get_env_or("DB_PASSWORD", "root");
      std::string db_host = get_env_or("DB_HOST", "127.0.0.1");
      std::string db_port = get_env_or("DB_PORT", "5432");

      std::string conn_str = "dbname=" + db_name + " user=" + db_user + 
                             " password=" + db_pass + " hostaddr=" + db_host + 
                             " port=" + db_port;

      pqxx::connection c(conn_str);
      if (c.is_open()) {
        pqxx::work w(c);
        pqxx::result r = w.exec("SELECT current_timestamp;");

        std::string db_time = r[0][0].c_str();
        std::string json_res =
            R"({"status": "success", "db_time": ")" + db_time + R"("})";

        res.set_content(json_res, "application/json");
      } else {
        res.status = 500;
        res.set_content(
            R"({"status": "error", "message": "Gagal membuka database"})",
            "application/json");
      }
    } catch (const std::exception &e) {
      // LOG error asli di server (tidak dikirim ke client)
      std::cerr << "[ERROR] Database Exception: " << e.what() << std::endl;
      
      res.status = 500;
      // Kirim pesan error generik ke client untuk alasan keamanan
      res.set_content(
          R"({"status": "error", "message": "Terjadi kesalahan internal server. Gagal terhubung ke database."})",
          "application/json");
    }
  });

  // CLEAR SCREEN
  std::cout << "\033[2J\033[1;1H";

#ifdef _WIN32
  system("title HTTP Server");
#endif

  std::cout << "========================================================\n";
  std::cout << " Server is running on http://127.0.0.1:" << server_port
            << "\033[0m\n";
  std::cout << " Tekan Ctrl+C untuk mematikan server dengan aman.\n";
  std::cout << "========================================================\n\n";
  std::cout << "Menunggu request...\n";

  // Mulai server (blocking)
  svr.listen("127.0.0.1", server_port);

  // Kode di bawah ini akan berjalan setelah svr.stop() dipanggil dari
  // signal_handler
  std::cout << "Server telah berhenti beroperasi. Goodbye!" << std::endl;
  return 0;
}
