let pendingOffer = null;

const socket = io("https://voxera-g4st.onrender.com");

// 🔊 Sounds
const callConnectSound = new Audio("sounds/call-connect.mp3");
const screenShareSound = new Audio("sounds/screen-share.mp3");
const callEndSound = new Audio("sounds/call-end.mp3");

callConnectSound.volume = 0.6;
screenShareSound.volume = 0.6;
callEndSound.volume = 0.6;

// State
let currentUser = "";
let peerConnection = null;
let localStream = null;
let cameraStream = null;
let connectedUser = "";

let inCall = false;
let isMuted = false;
let isScreenSharing = false;

// Timer
let callStartTime = null;
let timerInterval = null;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

/* =====================
   UI HELPERS
===================== */
function showCallUI() {
  document.getElementById("idleState").style.display = "none";
  document.getElementById("remoteVideo").style.display = "block";
  document.getElementById("localVideo").style.display = "block";
  document.getElementById("callControls").style.display = "flex";
}

function showIdleUI() {
  document.getElementById("remoteVideo").style.display = "none";
  document.getElementById("localVideo").style.display = "none";
  document.getElementById("callControls").style.display = "none";
  document.getElementById("idleState").style.display = "flex";
}

function showCallStatus(text) {
  document.getElementById("callStatusText").innerText = text;
  document.getElementById("callStatus").style.display = "flex";
}

function hideCallStatus() {
  document.getElementById("callStatus").style.display = "none";
}

/* =====================
   LOGIN
===================== */
function login() {
  currentUser = document.getElementById("username").value.trim();
  if (!currentUser) return alert("Enter username");

  socket.emit("login", currentUser);

  // 🔔 Ask browser notification permission
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
  showIdleUI();
}


/* =====================
   ONLINE USERS
===================== */
socket.on("online-users", (users) => {
  const ul = document.getElementById("users");
  ul.innerHTML = "";

  users.forEach(user => {
    if (user !== currentUser) {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="user-item">
          <div class="avatar">${user[0].toUpperCase()}</div>
          <span>${user}</span>
        </div>
      `;
      li.onclick = () => startCall(user);
      ul.appendChild(li);
    }
  });
});

/* =====================
   MEDIA
===================== */
async function getMedia() {
  if (!localStream) {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    localStream = cameraStream;
    document.getElementById("localVideo").srcObject = localStream;
    document.getElementById("localVideo").muted = true;
  }
}

/* =====================
   PEER CONNECTION
===================== */
function createPeerConnection(targetUser) {
  peerConnection = new RTCPeerConnection(config);
  connectedUser = targetUser;

  localStream.getTracks().forEach(track =>
    peerConnection.addTrack(track, localStream)
  );

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("webrtc-ice-candidate", {
        to: connectedUser,
        candidate: e.candidate
      });
    }
  };

  peerConnection.ontrack = (e) => {
    const stream = e.streams[0];
    document.getElementById("remoteVideo").srcObject = stream;

    callConnectSound.play().catch(() => {});
    hideCallStatus();
    startCallTimer();
    monitorActiveSpeaker(stream);
  };
}

/* =====================
   ACTIVE SPEAKER
===================== */
function monitorActiveSpeaker(stream) {
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  const source = audioCtx.createMediaStreamSource(stream);

  source.connect(analyser);
  analyser.fftSize = 512;

  const data = new Uint8Array(analyser.frequencyBinCount);

  setInterval(() => {
    analyser.getByteFrequencyData(data);
    const volume = data.reduce((a, b) => a + b, 0) / data.length;

    const remoteVideo = document.getElementById("remoteVideo");
    volume > 25
      ? remoteVideo.classList.add("active-speaker")
      : remoteVideo.classList.remove("active-speaker");
  }, 250);
}

/* =====================
   START CALL
===================== */
async function startCall(user) {
  if (inCall) return alert("Already in a call");

  connectedUser = user;
  showCallStatus("Calling…");

  socket.emit("call-user", { from: currentUser, to: user });

  await getMedia();
  createPeerConnection(user);

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("webrtc-offer", { to: user, offer });

  showCallUI();
  inCall = true;
}

/* =====================
   INCOMING CALL
===================== */
socket.on("incoming-call", async ({ from }) => {
  connectedUser = from;
  showCallStatus("Incoming call…");

  // 📢 Browser notification (NO SOUND)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("📞 Incoming Call", {
      body: `${from} is calling you on Voxera`,
      icon: "favicon_io/favicon-32x32.png"
    });
  }

  const accept = confirm(`Incoming call from ${from}`);

  if (!accept) {
    hideCallStatus();
    return;
  }

  await getMedia();
  createPeerConnection(from);

  showCallUI();
  inCall = true;

  if (pendingOffer) {
    await handleOffer(pendingOffer);
    pendingOffer = null;
  }
});


/* =====================
   OFFER / ANSWER
===================== */
socket.on("webrtc-offer", async (offer) => {
  if (!peerConnection) {
    pendingOffer = offer;
    return;
  }
  await handleOffer(offer);

  if (!connectedUser) {
  console.warn("Offer received but connectedUser not set yet");
}

});

socket.on("webrtc-answer", async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

/* =====================
   ICE
===================== */
socket.on("webrtc-ice-candidate", async (candidate) => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

/* =====================
   MUTE
===================== */
function toggleMute() {
  if (!localStream) return;

  const track = localStream.getAudioTracks()[0];
  isMuted = !isMuted;
  track.enabled = !isMuted;

  document.getElementById("muteBtn").innerText = isMuted ? "🔇" : "🎤";
  document.getElementById("muteBtn").classList.toggle("active", isMuted);
}

/* =====================
   SCREEN SHARE
===================== */
async function toggleScreen() {
  if (!peerConnection) return;

  if (!isScreenSharing) {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];

    const sender = peerConnection.getSenders().find(s => s.track.kind === "video");
    sender.replaceTrack(screenTrack);

    document.getElementById("localVideo").srcObject = screenStream;
    screenShareSound.play().catch(() => {});

    isScreenSharing = true;
    document.getElementById("screenBtn").classList.add("active");

    screenTrack.onended = stopScreenShare;
  } else {
    stopScreenShare();
  }
}

function stopScreenShare() {
  const sender = peerConnection.getSenders().find(s => s.track.kind === "video");
  sender.replaceTrack(cameraStream.getVideoTracks()[0]);

  document.getElementById("localVideo").srcObject = cameraStream;
  isScreenSharing = false;
  document.getElementById("screenBtn").classList.remove("active");
}

/* =====================
   CALL TIMER
===================== */
function startCallTimer() {
  callStartTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const min = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const sec = String(elapsed % 60).padStart(2, "0");
    document.getElementById("callTimer").innerText = `${min}:${sec}`;
  }, 1000);
}

function stopCallTimer() {
  clearInterval(timerInterval);
  document.getElementById("callTimer").innerText = "00:00";
}

/* =====================
   END CALL
===================== */
function endCall() {
  callEndSound.play().catch(() => {});
  socket.emit("end-call", { to: connectedUser });
  cleanupCall();
}

socket.on("call-ended", () => cleanupCall());

function cleanupCall() {
  if (peerConnection) peerConnection.close();
  peerConnection = null;

  if (localStream) localStream.getTracks().forEach(t => t.stop());
  localStream = null;

  stopCallTimer();

  document.getElementById("remoteVideo").srcObject = null;
  document.getElementById("localVideo").srcObject = null;

  connectedUser = "";
  inCall = false;
  isMuted = false;
  isScreenSharing = false;

  document.getElementById("muteBtn").classList.remove("active");
  document.getElementById("screenBtn").classList.remove("active");

  hideCallStatus();
  showIdleUI();
}

/* =====================
   HANDLE OFFER
===================== */
async function handleOffer(offer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("webrtc-answer", {
    to: connectedUser,
    answer
  });
}
