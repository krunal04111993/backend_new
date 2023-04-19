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
exports.deleteGroupChat = exports.removeUserFromGroup = exports.addUserToGroup = exports.renameGroupChat = exports.createGroupChat = exports.fetchChatsByUserId = exports.getOrCreateChat = exports.getSingleChat = exports.getAllChats = void 0;
const http_status_codes_1 = require("http-status-codes");
const errors_1 = __importDefault(require("../errors/errors"));
const Chat_1 = __importDefault(require("../models/Chat"));
const User_1 = __importDefault(require("../models/User"));
// todo: all chats
const getAllChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chats = yield Chat_1.default.find({}).populate("users");
    res.status(http_status_codes_1.StatusCodes.OK).json(chats);
});
exports.getAllChats = getAllChats;
// todo: single chat by id
const getSingleChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId } = req.params;
    const chat = yield Chat_1.default.findById(chatId).populate({
        path: "users",
        select: " name email avatar",
    });
    if (!chat)
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `chat with id: ${chatId} doesn't exist`);
    res.status(http_status_codes_1.StatusCodes.OK).json(chat);
});
exports.getSingleChat = getSingleChat;
// todo: get chat or create chat
const getOrCreateChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body.userId)
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `userId missing`);
    const user = yield User_1.default.findById(req.body.userId);
    if (!user)
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `no user found with id: ${req.body.userId}`);
    const existingChat = yield Chat_1.default.findOne({
        chatType: "single",
        $and: [
            { users: { $elemMatch: { $eq: req.body.userId } } },
            { users: { $elemMatch: { $eq: req.user.userId } } },
        ],
    })
        .populate({ path: "users", select: "name email avatar" })
        .populate("latestMessage");
    if (existingChat) {
        return res.status(http_status_codes_1.StatusCodes.OK).json(existingChat);
    }
    const chat = yield Chat_1.default.create({
        users: [req.user.userId, req.body.userId],
    });
    const newChat = yield Chat_1.default.find({ _id: chat._id })
        .populate({ path: "users", select: "name email avatar" })
        .populate("latestMessage");
    res.status(http_status_codes_1.StatusCodes.OK).json(newChat);
});
exports.getOrCreateChat = getOrCreateChat;
// todo: fetch all chat of the logged in user
const fetchChatsByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chats = yield Chat_1.default.find({
        users: { $elemMatch: { $eq: req.user.userId } },
    })
        .populate({ path: "users", select: "name email avatar" })
        .populate("latestMessage")
        .populate({ path: "groupAdmin", select: "name email avatar" })
        .sort({ updatedAt: -1 });
    res.status(http_status_codes_1.StatusCodes.OK).json(chats);
});
exports.fetchChatsByUserId = fetchChatsByUserId;
// todo: create group chat
const createGroupChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body.users || req.body.users.length < 1)
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `group chat must include two or more participants... users are missing`);
    if (!req.body.chatName)
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `group name not provided`);
    let users = req.body.users;
    users.push(req.user.userId);
    const newChat = yield Chat_1.default.create({
        chatType: "group",
        users,
        groupAdmin: req.user.userId,
        chatName: req.body.chatName,
    });
    const groupChat = yield Chat_1.default.findById(newChat._id)
        .populate({ path: "users", select: "name email avatar" })
        .populate("latestMessage")
        .populate({ path: "groupAdmin", select: "name email avatar" });
    res.status(http_status_codes_1.StatusCodes.CREATED).json(groupChat);
});
exports.createGroupChat = createGroupChat;
// todo: rename group chat
const renameGroupChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatName, groupId } = req.body;
    if (!chatName)
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `new name for group is missing`);
    const groupChat = yield Chat_1.default.findOneAndUpdate({ _id: groupId }, { chatName }, { new: true });
    res.status(http_status_codes_1.StatusCodes.OK).json(groupChat);
});
exports.renameGroupChat = renameGroupChat;
// todo: add user to group
const addUserToGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { groupId, userId } = req.body;
    // ? validate user
    const user = yield User_1.default.findById(userId);
    if (!user) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `user with id: ${userId} doesn't exist`);
    }
    // ? validate group
    const groupChat = yield Chat_1.default.findOne({ _id: groupId, chatType: "group" });
    if (!groupChat) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `group with id: ${groupId} doesn't exist`);
    }
    if (groupChat.users.includes(userId)) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `user already in group`);
    }
    const chat = yield Chat_1.default.findOneAndUpdate({ _id: groupId }, { $push: { users: userId } }, { new: true })
        .populate({ path: "users", select: "name email avatar" })
        .populate({ path: "groupAdmin", select: "name email avatar" });
    res.status(http_status_codes_1.StatusCodes.OK).json(chat);
});
exports.addUserToGroup = addUserToGroup;
// todo: remove user from group
const removeUserFromGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { groupId, userId } = req.body;
    // ? validate user
    const user = yield User_1.default.findById(userId);
    if (!user) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `user with id: ${userId} doesn't exist`);
    }
    // ? validate group
    const groupChat = yield Chat_1.default.findOne({ _id: groupId, chatType: "group" });
    if (!groupChat) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `group with id: ${groupId} doesn't exist`);
    }
    if (groupChat.groupAdmin &&
        groupChat.groupAdmin.toString() === userId &&
        groupChat.users.length <= 1) {
        yield groupChat.remove();
        return res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ message: "chat was deleted as all users left" });
    }
    if (groupChat.groupAdmin &&
        groupChat.groupAdmin.toString() === userId &&
        groupChat.users.length > 1) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `admin cannot be removed from group when other users are present`);
    }
    if (userId !== req.user.userId &&
        req.user.userId !== ((_a = groupChat.groupAdmin) === null || _a === void 0 ? void 0 : _a.toString())) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, `not authrozed to remove user from group`);
    }
    if (!groupChat.users.includes(userId)) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `user not in group`);
    }
    const chat = yield Chat_1.default.findOneAndUpdate({ _id: groupId }, { $pull: { users: userId } }, { new: true })
        .populate({ path: "users", select: "name email avatar" })
        .populate({ path: "groupAdmin", select: "name email avatar" });
    return res.status(http_status_codes_1.StatusCodes.OK).json(chat);
});
exports.removeUserFromGroup = removeUserFromGroup;
const deleteGroupChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId } = req.body;
    const groupChat = yield Chat_1.default.findById(chatId);
    if (!groupChat || !groupChat.groupAdmin) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `no group with the given id was found`);
    }
    if (groupChat.groupAdmin.toString() !== req.user.userId) {
        throw new errors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, `not authorized to delete group`);
    }
    yield groupChat.remove();
    res.status(http_status_codes_1.StatusCodes.OK).json(groupChat);
});
exports.deleteGroupChat = deleteGroupChat;
