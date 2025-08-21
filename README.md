# 🌐 Simple HTTP Server with C++ & cpp-httplib  

This project is a **lightweight HTTP server** built with **C++** using the [`cpp-httplib`](https://github.com/yhirose/cpp-httplib) single-header library.  
It serves static files (like `index.html`) and also provides simple API endpoints.  

## ✨ Features
- Runs an HTTP server on default port **80** or a custom port.  
- `/` endpoint serves an interactive `index.html`.  
- `/hi` endpoint returns a simple **Hello World!** message.  
- Interactive `index.html` with a **Check Server** button that shows a notification including server status and response time (ping in ms).  
- Cross-platform support: Windows & Linux (OS detection included).  

## 📂 Project Structure
CPP-HTTP-Server/
├── public/
│ └── index.html # main web page
├── httplib.h # cpp-httplib header
└── server.cpp # main server code

## ⚙️ Build & Run  

### 🔹 Windows (MSVC / MinGW)
```bash
g++ server.cpp -o server.exe
server.exe
```
🔹 Linux (g++)
```bash
g++ server.cpp -o server
./server
```

🔹 Access Server

Open your browser and navigate to:

http://127.0.0.1:80

🖥️ Demo

/ → Displays the interactive homepage (index.html).

/hi → Returns a plain text Hello World!.

Homepage button Check Server triggers a notification with server status + latency (ms).

📜 License

MIT License © 2025
