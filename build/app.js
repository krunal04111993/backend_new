"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("express-async-errors");
// import morgan from "morgan";
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cloudinary_1 = require("cloudinary");
// ...................................
const config_1 = require("./config/config");
const notFound_1 = require("./middlewares/notFound");
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const connect_1 = require("./db/connect");
// ..................routes...............
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const app = (0, express_1.default)();
// ............cloudinary.................
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
app.set("trust proxy", 1);
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        process.env.ORIGIN,
        "http://localhost:3000",
    ],
    credentials: true,
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)(process.env.JWT_SECRET));
// app.use(morgan("tiny"));
// .....................routes...................
app.use("/api/v1/chat", chatRoutes_1.default);
app.use("/api/v1/auth", authRoutes_1.default);
app.use("/api/v1/message", messageRoutes_1.default);
app.use("/api/v1/user", userRoutes_1.default);
app.use(errorHandler_1.default);
app.use(notFound_1.notFound);
const server = http_1.default.createServer(app);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, connect_1.connectDB)();
    server.listen(config_1.config.server.port, () => console.log(`server running on port ${config_1.config.server.port}`));
});
startServer();
console.log(process.env.ORIGIN);
const socket_io_1 = require("socket.io");
const chalk_1 = __importDefault(require("chalk"));
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.ORIGIN,
    },
});
let onlineUsers = [];
const addUser = (userData) => {
    const isExisting = onlineUsers.some((user) => user.userId === userData.userId);
    if (isExisting)
        return;
    onlineUsers.push(userData);
};
const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
    return;
};
io.on("connection", (socket) => {
    socket.on("connected", (user) => {
        console.log(`${socket.id} connected`);
        addUser({ socketId: socket.id, userId: user.userId });
        io.emit("userOnline", onlineUsers);
    });
    socket.on("create-room", (chat) => {
        socket.join(chat);
    });
    socket.on("leave-room", (chat) => {
        socket.leave(chat);
        console.log(`left ${chat}`);
    });
    socket.on("new-message", (newMessage) => {
        socket.broadcast
            .to(newMessage.chat._id)
            .emit("receive-message", newMessage);
        const users = newMessage.chat.users;
        users.forEach((user) => {
            const isOnline = onlineUsers.find((u) => u.userId === user._id);
            if (isOnline && isOnline.socketId !== socket.id) {
                io.to(isOnline.socketId).emit("refetch chats");
            }
        });
    });
    // the notification
    socket.on("notify", (message) => {
        socket.broadcast.emit("notification", message);
    });
    //  group activity
    socket.on("removed from group", ({ userId, chat }) => {
        const user = onlineUsers.find((u) => u.userId === userId);
        if (!user)
            return;
        io.to(user.socketId).emit("removed", { chat });
    });
    socket.on("added to group", ({ users, chat }) => {
        console.log(chalk_1.default.yellow("group was createds"));
        users.forEach((user) => {
            const online = onlineUsers.find((u) => u.userId === user);
            if (online) {
                io.to(online.socketId).emit("added", { chat });
            }
        });
    });
    socket.on("chat deleted", (chat) => {
        const receipients = chat.users.filter((user) => user._id !== chat.groupAdmin);
        receipients.forEach((person) => {
            let online = onlineUsers.find((user) => user.userId === person._id);
            if (online) {
                io.to(online.socketId).emit("chat deleted", chat);
            }
        });
    });
    socket.on("updated chat name", (users) => {
        console.log(chalk_1.default.yellow("name updated"));
        users.forEach((person) => {
            let online = onlineUsers.find((user) => user.userId === person._id);
            if (online) {
                io.to(online.socketId).emit("updated chat name");
            }
        });
    });
    // the tping indicator
    socket.on("typing", ({ chat, avatar }) => {
        socket.broadcast.to(chat).emit("typing", avatar);
    });
    socket.on("idle", (chat) => {
        socket.broadcast.to(chat).emit("idle");
    });
    socket.on("logout", () => {
        socket.disconnect();
    });
    socket.on("disconnect", () => {
        console.log(`${socket.id} disconnected`);
        removeUser(socket.id);
        io.emit("userOnline", onlineUsers);
    });
});
