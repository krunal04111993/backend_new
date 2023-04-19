"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const multer_1 = __importDefault(require("multer"));
const authentication_1 = require("../middlewares/authentication");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./tmp");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Math.round(Math.random() * 1e4);
        cb(null, file.originalname.split(".")[0] + "-" + uniqueSuffix);
    },
});
const upload = (0, multer_1.default)({ storage: storage });
router.route("/register").post(upload.single("avatar"), authController_1.registerUser);
router.route("/login").post(authController_1.login);
router.route("/verify-email").post(authController_1.verifyEmail);
router.route("/logout").delete(authentication_1.authenticateUser, authController_1.logout);
router.route("/showMe").get(authentication_1.authenticateUser, authController_1.showCurrentUser);
router.route("/remove").delete(authController_1.removeUser);
router.route("/forgot-password").post(authController_1.forgotPassword);
router.route("/reset-password").post(authController_1.resetPassword);
exports.default = router;
