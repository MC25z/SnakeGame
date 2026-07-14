const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = 3000;

const WORLD_SIZE = 6000;
const FOOD_COUNT = 800;

const players = {};
const food = [];

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function spawnFood() {
    while (food.length < FOOD_COUNT) {
        food.push({
            x: random(0, WORLD_SIZE),
            y: random(0, WORLD_SIZE),
            size: random(3, 8)
        });
    }
}

spawnFood();

io.on("connection", (socket) => {

    console.log(`${socket.id} connected`);

    socket.on("join", (data) => {

        players[socket.id] = {
            id: socket.id,

            name: data.name || "Player",

            color: data.color || "#00ff00",

            x: random(200, WORLD_SIZE - 200),
            y: random(200, WORLD_SIZE - 200),

            angle: 0,

            speed: 3,

            boosting: false,

            length: 30,

            body: []
        };

        for (let i = 0; i < players[socket.id].length; i++) {
            players[socket.id].body.push({
                x: players[socket.id].x,
                y: players[socket.id].y
            });
        }

        socket.emit("init", {
            id: socket.id,
            worldSize: WORLD_SIZE
        });

    });

    socket.on("input", input => {

        const player = players[socket.id];

        if (!player) return;

        player.angle = input.angle;
        player.boosting = input.boost;

    });

    socket.on("disconnect", () => {

        console.log(`${socket.id} disconnected`);

        delete players[socket.id];

    });

});

setInterval(() => {

    for (const id in players) {

        const p = players[id];

        p.speed = p.boosting ? 6 : 3;

        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        p.x = Math.max(0, Math.min(WORLD_SIZE, p.x));
        p.y = Math.max(0, Math.min(WORLD_SIZE, p.y));

        p.body.unshift({
            x: p.x,
            y: p.y
        });

        while (p.body.length > p.length) {
            p.body.pop();
        }

        if (p.boosting && p.length > 25) {
            p.length -= 0.05;
        }

        for (let i = food.length - 1; i >= 0; i--) {

            const f = food[i];

            const dx = p.x - f.x;
            const dy = p.y - f.y;

            if (dx * dx + dy * dy < 225) {

                food.splice(i, 1);

                p.length += 8;

            }

        }

    }

    spawnFood();

    io.emit("state", {
        players,
        food
    });

}, 1000 / 60);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});