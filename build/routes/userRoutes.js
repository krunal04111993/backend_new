"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authentication_1 = require("../middlewares/authentication");
const router = express_1.default.Router();
router.route("/").get(authentication_1.authenticateUser, userController_1.getAllUsers);
router.route("/:userId").get(authentication_1.authenticateUser, userController_1.getProfile);
exports.default = router;
