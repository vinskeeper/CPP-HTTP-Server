#include <iostream>
#include <fstream>
#include <sstream>
#include "httplib.h"

using namespace std;

int serverPort = 80; // 80 (default HTTP port) butuh root/admin di Linux

int main() {
    httplib::Server svr;

    // Serve index.html di "/"
    svr.Get("/", [](const httplib::Request&, httplib::Response& res) {
        ifstream f("public/index.html");
        if (!f) {
            res.status = 404;
            res.set_content("index.html not found", "text/plain");
            return;
        }
        stringstream buf;
        buf << f.rdbuf();
        res.set_content(buf.str(), "text/html");
        });

    // Serve semua file di folder public
    svr.set_mount_point("/", "./public");

    // Deteksi OS
#ifdef _WIN32
    system("title HTTP Server"); // ganti title console (Windows Only)
    system("cls");               // clear screen
#elif __linux__
    system("clear");             // clear screen Linux
#elif __APPLE__
    system("clear");             // MacOS (sama kayak Linux)
#endif

    cout << "Server is running on http://127.0.0.1:" << serverPort << endl;

    svr.listen("127.0.0.1", serverPort);

}
