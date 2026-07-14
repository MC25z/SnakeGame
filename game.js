const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let socketReady = false;

// Socket
const socket = io();

socket.on("connect", () => {
    socketReady = true;
});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// Game state
let worldSize = 6000;
let myId = null;

let players = {};
let food = [];

// Input state
let mouse = { x: 0, y: 0 };
let angle = 0;
let boosting = false;

// Camera
let camera = {
    x: 0,
    y: 0
};

// Menu elements
const menu = document.getElementById("menu");
const playBtn = document.getElementById("play");
const nameInput = document.getElementById("name");
const colorInput = document.getElementById("color");

// Resize handling
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Mouse tracking
window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Boost key (Shift)
window.addEventListener("keydown", (e) => {
    if (e.key === "Shift") boosting = true;
});

window.addEventListener("keyup", (e) => {
    if (e.key === "Shift") boosting = false;
});

// Play button
playBtn.onclick = () => {

    const name = nameInput.value || "Player";
    const color = colorInput.value;

    menu.style.display = "none";

    socket.emit("join", {
        name,
        color
    });
};

// Init from server
socket.on("init", (data) => {
    myId = data.id;
    worldSize = data.worldSize;
});

// Game state update
socket.on("state", (state) => {
    players = state.players;
    food = state.food;
});

// Send input to server
function sendInput() {

    if (!myId || !players[myId]) return;

    const rect = canvas.getBoundingClientRect();

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const dx = mouse.x - cx;
    const dy = mouse.y - cy;

    angle = Math.atan2(dy, dx);

    socket.emit("input", {
        angle,
        boost: boosting
    });
}

// Camera follow
function updateCamera() {

    const me = players[myId];

    if (!me) return;

    camera.x = me.x - canvas.width / 2;
    camera.y = me.y - canvas.height / 2;
}

// Main loop
function loop() {

    sendInput();
    updateCamera();

    draw();

    requestAnimationFrame(loop);
}

loop();
function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Move camera
    ctx.translate(-camera.x, -camera.y);

    drawGrid();
    drawFood();
    drawSnakes();

    ctx.restore();
}
let boostSpeed = 1;
let targetBoostSpeed = 1;
function updateBoost() {

    // target speed based on input
    targetBoostSpeed = boosting ? 1.8 : 1;

    // smooth transition (important for feel)
    boostSpeed += (targetBoostSpeed - boostSpeed) * 0.1;
}
function loop() {

    sendInput();
    updateCamera();
    updateBoost();

    draw();

    requestAnimationFrame(loop);
}
const leadersList = document.getElementById("leaders");
function updateLeaderboard() {

    const sorted = Object.values(players)
        .sort((a, b) => (b.length || 0) - (a.length || 0))
        .slice(0, 10);

    leadersList.innerHTML = "";

    for (let p of sorted) {

        const li = document.createElement("li");

        li.textContent = `${p.name} - ${Math.floor(p.length || 0)}`;

        li.style.color = p.color;

        leadersList.appendChild(li);
    }
}
updateLeaderboard();
function loop() {

    sendInput();
    updateCamera();
    updateBoost();

    draw();
    updateLeaderboard();

    requestAnimationFrame(loop);
}
function drawHead(p) {

    if (!p.body || p.body.length < 2) return;

    const head = p.body[0];
    const next = p.body[1];

    const dx = head.x - next.x;
    const dy = head.y - next.y;

    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);

    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(5, -4, 2, 0, Math.PI * 2);
    ctx.arc(5, 4, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}











/* -------------------------------------------------
   1️⃣  Helper drawing functions
   ------------------------------------------------- */
function drawGrid() {
  // optional – draw a faint grid (already in CSS background)
  // keep this empty if you don’t need a grid overlay.
}

function drawFood() {
  ctx.fillStyle = "#ffdd00";          // yellow food
  for (const f of food) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSnakes() {
  for (const id in players) {
    const p = players[id];
    // body – draw a circle whose radius grows with length
    const radius = Math.max(p.length / 10, 5);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // eyes – simple white dots
    const eyeOffset = radius * 0.4;
    const eyeSize = radius * 0.2;
    const eyeX = p.x + Math.cos(p.angle) * eyeOffset;
    const eyeY = p.y + Math.sin(p.angle) * eyeOffset;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* -------------------------------------------------
   2️⃣  Main render loop (single definition)
   ------------------------------------------------- */
function loop() {
  sendInput();          // send mouse direction & boost flag
  updateCamera();       // keep camera centered on your snake
  updateBoost();        // smooth boost‑speed transition
  draw();               // clear canvas & draw everything
  requestAnimationFrame(loop);
}

/* -------------------------------------------------
   3️⃣  Draw routine (calls the helpers above)
   ------------------------------------------------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  // translate according to camera position
  ctx.translate(-camera.x, -camera.y);

  drawGrid();
  drawFood();
  drawSnakes();

  ctx.restore();
}

/* -------------------------------------------------
   4️⃣  Start the loop (already at the bottom of the file)
   ------------------------------------------------- */
loop();   // keep this – it kicks off the animation