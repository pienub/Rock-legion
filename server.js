const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// 📷 IMAGE UPLOAD
const storage = multer.diskStorage({
    destination: "public/uploads",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// 👥 USERS
let users = {};

io.on("connection", (socket) => {

    // SET NAME
    socket.on("setName", (name, cb) => {
        const clean = (name || "").trim();

        if (!clean) return cb({ ok: false });

        socket.username = clean;
        users[socket.id] = clean;

        cb({ ok: true });

        io.emit("system", `${clean} joined Rock Legion`);
    });

    // MESSAGE
    socket.on("message", (data) => {
        if (!socket.username) return;

        io.emit("message", {
            name: socket.username,
            text: data.text,
            replyTo: data.replyTo || null
        });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
        if (socket.username) {
            io.emit("system", `${socket.username} left`);
        }

        delete users[socket.id];
    });
});

// 📷 IMAGE ROUTE
app.post("/upload", upload.single("image"), (req, res) => {
    const url = "/uploads/" + req.file.filename;

    io.emit("image", {
        name: "Image",
        url
    });

    res.json({ ok: true });
});

// 🚀 IMPORTANT: PERMA HOST FIX (RENDER)
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("Rock Legion running on port " + PORT);
});
