const socket = io("http://localhost:3000");

let currentUser = "";
let peerConnection = null;
let localStream = null;
let caller = "";

let inCall = false;
let isMuted = false;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

/* LOGIN */
function login() {
  currentUser = document.getElementById("username").value.trim();
  if (!currentUser) return alert("Enter username");

  socket.emit("login", currentUser);

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
}

/* ONLINE USERS */
socket.on("online-users", (users) => {
  const ul = document.getElementById("users");
  ul.innerHTML = "";

  users.forEach(user => {
    if (user !== currentUser) {
      const li = document.createElement("li");
      li.innerText = "📞 " + user;
      li.onclick = () => startCall(user);
      ul.appendChild(li);
    }
  });
});

/* MEDIA */
async function getMedia() {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

/* PEER CONNECTION */
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
    const audio = document.getElementById("remoteAudio");
    audio.srcObject = e.streams[0];
    audio.play().catch(() => {});
  };
}

/* START CALL */
async function startCall(user) {
  if (inCall) return alert("Already in a call");

  socket.emit("call-user", {
    from: currentUser,
    to: user
  });

  await getMedia();
  createPeerConnection(user);

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("webrtc-offer", { to: user, offer });

  document.getElementById("callControls").style.display = "block";
  inCall = true;
}

/* INCOMING CALL */
socket.on("incoming-call", async ({ from }) => {
  caller = from;
  const accept = confirm(`Incoming call from ${from}`);
  if (!accept) return;

  await getMedia();
  createPeerConnection(from);

  document.getElementById("callControls").style.display = "block";
  inCall = true;
});

/* OFFER */
socket.on("webrtc-offer", async (offer) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(offer)
  );

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("webrtc-answer", { to: caller, answer });
});

/* ANSWER */
socket.on("webrtc-answer", async (answer) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(answer)
  );
});

/* ICE */
socket.on("webrtc-ice-candidate", async (candidate) => {
  await peerConnection.addIceCandidate(
    new RTCIceCandidate(candidate)
  );
});

/* MUTE / UNMUTE */
function toggleMute() {
  if (!localStream) return;

  const track = localStream.getAudioTracks()[0];
  isMuted = !isMuted;
  track.enabled = !isMuted;

  document.getElementById("muteBtn").innerText =
    isMuted ? "🎤 Unmute" : "🔇 Mute";
}

/* END CALL */
function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  document.getElementById("remoteAudio").srcObject = null;
  document.getElementById("callControls").style.display = "none";

  isMuted = false;
  document.getElementById("muteBtn").innerText = "🔇 Mute";
  inCall = false;
}
