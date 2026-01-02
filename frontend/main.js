const socket = io("http://localhost:3000");

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
let caller = "";

let inCall = false;
let isMuted = false;
let isScreenSharing = false;

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
   MEDIA (CAMERA + MIC)
===================== */
async function getMedia() {
  if (!localStream) {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    localStream = cameraStream;
    const localVideo = document.getElementById("localVideo");
    localVideo.srcObject = localStream;
    localVideo.muted = true;
  }
}

/* =====================
   PEER CONNECTION
===================== */
function createPeerConnection(targetUser) {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track =>
    peerConnection.addTrack(track, localStream)
  );

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("webrtc-ice-candidate", {
        to: targetUser,
        candidate: e.candidate
      });
    }
  };

  peerConnection.ontrack = (e) => {
    const remoteVideo = document.getElementById("remoteVideo");
    remoteVideo.srcObject = e.streams[0];

    if (!peerConnection._connectedSoundPlayed) {
      callConnectSound.play().catch(() => {});
      peerConnection._connectedSoundPlayed = true;
      hideCallStatus(); // ✅ hide "Calling…" when connected
    }
  };
}

/* =====================
   START CALL (CALLER)
===================== */
async function startCall(user) {
  if (inCall) return alert("Already in a call");

  showCallStatus("Calling…");

  socket.emit("call-user", {
    from: currentUser,
    to: user
  });

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
  caller = from;
  showCallStatus("Incoming call…");

  const accept = confirm(`Incoming call from ${from}`);
  if (!accept) {
    hideCallStatus();
    return;
  }

  await getMedia();
  createPeerConnection(from);

  showCallUI();
  inCall = true;
});

/* =====================
   OFFER / ANSWER
===================== */
socket.on("webrtc-offer", async (offer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("webrtc-answer", { to: caller, answer });
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
   MUTE / UNMUTE
===================== */
function toggleMute() {
  if (!localStream) return;

  const track = localStream.getAudioTracks()[0];
  isMuted = !isMuted;
  track.enabled = !isMuted;

  document.getElementById("muteBtn").innerText =
    isMuted ? "🎤 Unmute" : "🔇 Mute";
}

/* =====================
   SCREEN SHARE
===================== */
async function toggleScreen() {
  if (!peerConnection) return;

  if (!isScreenSharing) {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    const videoSender = peerConnection.getSenders()
      .find(s => s.track && s.track.kind === "video");
    const audioSender = peerConnection.getSenders()
      .find(s => s.track && s.track.kind === "audio");

    videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
    if (screenStream.getAudioTracks()[0]) {
      audioSender.replaceTrack(screenStream.getAudioTracks()[0]);
    }

    document.getElementById("localVideo").srcObject = screenStream;

    isScreenSharing = true;
    screenShareSound.play().catch(() => {});

    screenStream.getVideoTracks()[0].onended = stopScreenShare;
  } else {
    stopScreenShare();
  }
}

function stopScreenShare() {
  if (!cameraStream || !peerConnection) return;

  const videoSender = peerConnection.getSenders()
    .find(s => s.track && s.track.kind === "video");
  const audioSender = peerConnection.getSenders()
    .find(s => s.track && s.track.kind === "audio");

  videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
  audioSender.replaceTrack(cameraStream.getAudioTracks()[0]);

  document.getElementById("localVideo").srcObject = cameraStream;
  isScreenSharing = false;
}

/* =====================
   END CALL
===================== */
function endCall() {
  callEndSound.play().catch(() => {});

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  document.getElementById("remoteVideo").srcObject = null;
  document.getElementById("localVideo").srcObject = null;

  hideCallStatus();
  showIdleUI();

  isMuted = false;
  isScreenSharing = false;
  inCall = false;
}
