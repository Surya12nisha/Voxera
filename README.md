<!-- ===================== VOXERA NEURAL BOOT ===================== -->

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?size=36&duration=3000&color=38BDF8&center=true&vCenter=true&width=900&lines=Voxera;Real-Time+Voice+Video+%26+Screen+Sharing;Powered+by+WebRTC+%7C+Socket.IO;Built+for+Seamless+Communication" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/WebRTC-Real--Time-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/Socket.IO-WebSockets-black?style=for-the-badge">
  <img src="https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge">
  <img src="https://img.shields.io/badge/Status-Live-success?style=for-the-badge">
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:38bdf8,100:1e3a8a&height=90&section=header" />
</p>

---

# 🎧 Voxera — Real-Time Communication Platform

> **Talk. See. Share. Instantly.**

**Voxera** is a browser-based **real-time communication platform** enabling  
📞 **voice calls**, 🎥 **video calls**, and 🖥️ **screen sharing**  
using **ultra-low latency peer-to-peer streaming**.

Inspired by **Google Meet**, **Zoom**, and **Discord Voice**, Voxera is built to explore the **core engineering behind real-time systems**, without relying on third-party media SDKs.

---

## 🌐 Live Demo

🔗 **Frontend:**  
👉 https://voxera-rtc.netlify.app  

🔗 **Backend (Signaling Server):**  
👉 https://voxera-g4st.onrender.com  

> ⚠️ Note: On free hosting, the first request may take ~30 seconds due to cold starts.

---

## ⚡ Why Voxera?

✔ No media server relay  
✔ True peer-to-peer streaming  
✔ Real-time WebSocket signaling  
✔ Clean call lifecycle management  
✔ Production-style UI & UX logic  

> Voxera is built to **understand how real-time systems actually work**, not just how to use APIs.

---

## 🖼️ Live Demo Preview

```text
Login → Online Users → Call → Video → Screen Share → End Call
````

<p align="center">
  <img src="screenshots/image-1.png" width="32%" />
  <img src="screenshots/image.png" width="32%" />
  <img src="screenshots/ss.png" width="32%" />
</p>

---

## 🚀 Features

### 🔗 Real-Time Communication Core

* 📞 One-to-one **voice & video calls**
* 🖥️ **Screen sharing** with system audio
* ⚡ **Ultra-low latency** peer-to-peer streaming
* 🔊 Call connect / share / end sounds
* ❌ **Synchronized call termination**

### 🎛️ Call Controls

* 🎤 Mute / Unmute microphone
* 🖥️ Start / Stop screen sharing
* 📞 End call
* 🪟 Floating camera (**Picture-in-Picture**)

### 🎨 UI & UX Experience

* ✨ Google Meet–inspired interface
* 🌌 Glassmorphism + gradient backgrounds
* 🎥 Smart layout (screen-first, camera PiP)
* 🔔 Call state overlays (Calling / Incoming)
* 🎧 Idle onboarding screen

---

## 🛠️ Tech Stack

### 🖥️ Frontend

* HTML5
* CSS3 (Glassmorphism, animations)
* JavaScript (ES6+)
* WebRTC (Audio, Video, Screen Capture)
* Socket.IO (Client)

### ⚙️ Backend

* Node.js
* Express.js
* Socket.IO (WebSockets)
* Google STUN Server

---

## 🧠 Architecture Overview

```text
User A  ── WebRTC (Audio / Video / Screen) ──▶  User B
   │                                             ▲
   └──── Socket.IO (Signaling & Presence) ───────┘
```

### 🔄 WebSockets Handle

* User presence & login
* Online user list
* Call requests
* SDP & ICE signaling
* Call end synchronization

### 🎥 WebRTC Handles

* Peer-to-peer media streaming
* Camera & microphone capture
* Screen sharing with system audio
* NAT traversal via ICE

> ⚠️ **Media streams never pass through the server** — they flow directly between peers.

---

## 📁 Project Structure

```
Voxera/
│
├── backend/
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── index.html
    ├── style.css
    ├── main.js
    └── sounds/
        ├── call-connect.mp3
        ├── screen-share.mp3
        └── call-end.mp3
```

---

## ▶️ Run Locally

### 1️⃣ Clone Repository

```bash
git clone https://github.com/vansh070605/Voxera.git
cd Voxera
```

### 2️⃣ Start Backend

```bash
cd backend
npm install
node server.js
```

```text
✅ Voxera signaling server running on port 3000
```

### 3️⃣ Run Frontend

* Open `frontend/index.html` in **two browsers/devices**
* Login with different usernames
* Start calling 🚀

> Recommended browser: **Google Chrome**

---

## 🎯 Call Lifecycle

```text
Login → Select User → Call → Connect → Share Screen → End Call
```

✔ Ending a call on one side disconnects both peers
✔ UI resets cleanly on both ends

---

## 🧪 What This Project Demonstrates

* WebRTC peer connection setup
* ICE candidate exchange & NAT traversal
* Media track replacement (screen sharing)
* Real-time state synchronization
* Socket-based signaling architecture
* Production-grade call lifecycle handling

---

## 🔒 Current Limitations

* One-to-one calls only
* No TURN server (may fail on strict NATs)
* No authentication
* No call recording
* No group calls (yet)

---

## 🚀 Future Enhancements

* 👥 Group calls / voice rooms
* 🎥 Camera on/off toggle
* ⏱️ Call duration analytics
* 🔐 Authentication & user profiles
* 🌍 TURN server integration
* 📊 Network quality indicators
* 📱 Improved mobile UX

---

## 📄 Resume-Ready Project Statement

> **Voxera** is a real-time communication web application built using **WebRTC and WebSockets**, enabling peer-to-peer voice calls, video calls, and screen sharing with synchronized call lifecycle management and a modern, production-grade UI.

---

## 👨‍💻 Author

**Vansh Agrawal**
Engineering Student | Full-Stack & Real-Time Systems Enthusiast

---

## ⭐ Final Note

Voxera focuses on **real-world real-time communication engineering**, not just UI demos.
It demonstrates the same foundational concepts used in **Google Meet, Zoom, and Discord** —
**built completely from scratch.**

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:1e3a8a,100:38bdf8&height=90&section=footer" />
</p>
