"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const messageController_1 = require("./../controllers/messageController");
const authentication_1 = require("./../middlewares/authentication");
const express_1 = require("express");
const messageController_2 = require("../controllers/messageController");
const router = (0, express_1.Router)();
router.route("/").post(authentication_1.authenticateUser, messageController_2.sendMessage);
router.route("/:chatId").get(authentication_1.authenticateUser, messageController_1.getMessagesByChatId);
exports.default = router;
