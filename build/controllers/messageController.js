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
exports.getMessagesByChatId = exports.sendMessage = void 0;
const http_status_codes_1 = require("http-status-codes");
const errors_1 = __importDefault(require("../errors/errors"));
const Chat_1 = __importDefault(require("../models/Chat"));
const Message_1 = __importDefault(require("../models/Message"));
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, chat } = req.body;
    if (!content || !chat) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `one or more fields are missing`);
    }
    const isChat = yield Chat_1.default.findById(chat);
    if (!isChat) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `chat not found`);
    }
    //   ? checks if user is part of the chat
    const userAllowed = isChat.users.some((user) => user.toString() === req.user.userId);
    if (!userAllowed) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `message not sent as user not part of the chat`);
    }
    let message = yield Message_1.default.create({
        content,
        chat,
        sender: req.user.userId,
    });
    message = yield message.populate([
        { path: "sender", select: "name email avatar" },
        { path: "chat", populate: { path: "users" } },
    ]);
    yield Chat_1.default.findByIdAndUpdate(chat, { $set: { latestMessage: message._id } });
    res.status(http_status_codes_1.StatusCodes.CREATED).json(message);
});
exports.sendMessage = sendMessage;
// todo: get all messages of a given chat
const getMessagesByChatId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId } = req.params;
    const chat = yield Chat_1.default.findById(chatId);
    if (!chat) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `chat doesn't exist`);
    }
    const messages = yield Message_1.default.find({ chat: chatId })
        .populate({ path: "sender", select: "name email avatar" })
        .populate({
        path: "chat",
        populate: { path: "users", select: "name email avatar" },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json(messages);
});
exports.getMessagesByChatId = getMessagesByChatId;
