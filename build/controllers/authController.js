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
exports.resetPassword = exports.forgotPassword = exports.showCurrentUser = exports.removeUser = exports.logout = exports.login = exports.verifyEmail = exports.registerUser = void 0;
const errors_1 = __importDefault(require("../errors/errors"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const cloudinary_1 = require("cloudinary");
const User_1 = __importDefault(require("../models/User"));
const Token_1 = __importDefault(require("../models/Token"));
const sendVerificationMail_1 = __importDefault(require("../utils/sendVerificationMail"));
const jwt_1 = require("../utils/jwt");
const createTokenUser_1 = __importDefault(require("../utils/createTokenUser"));
const sendResetPasswordMail_1 = __importDefault(require("../utils/sendResetPasswordMail"));
const createHash_1 = __importDefault(require("../utils/createHash"));
// todo: register a user
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    // ? checks if all required input are there
    if (!name || !email || !password)
        throw new errors_1.default(400, `one or more inputs are missing`);
    if (!req.file) {
        throw new errors_1.default(400, `avatar is missing`);
    }
    // ? user alredy exists ?
    const isExistingEmail = yield User_1.default.findOne({ email });
    if (isExistingEmail)
        throw new errors_1.default(400, `Email already registered`);
    // ? admin or user?
    const isFirstUser = (yield User_1.default.countDocuments({})) === 0;
    const role = isFirstUser ? "admin" : "user";
    // ? generate verification token
    const verificationToken = crypto_1.default.randomBytes(40).toString("hex");
    // ? upload image
    const uploadFile = yield cloudinary_1.v2.uploader.upload(req.file.path, {
        folder: "chatty-avatars",
        resource_type: "image",
    });
    fs_1.default.unlinkSync(req.file.path);
    // ? send mail here
    yield (0, sendVerificationMail_1.default)({
        name,
        email,
        verificationToken,
    });
    // ? create the User in db
    const user = new User_1.default({
        name,
        email,
        password,
        role,
        verificationToken,
        avatar: uploadFile.secure_url,
        cloudinaryId: uploadFile.public_id,
    });
    yield user.save();
    res.status(201).json({
        status: "success",
        message: "Please check your inbox to verify your email",
    });
});
exports.registerUser = registerUser;
// todo: verify email after registering
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, email } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user)
        throw new errors_1.default(403, `Email couldn't be verified`);
    if (user.verificationToken !== token)
        throw new errors_1.default(403, `Email couldn't be verified as token doesnt match`);
    user.isVerified = true;
    user.verificationToken = "";
    user.verified = new Date(Date.now());
    user.save();
    res
        .status(200)
        .json({ status: "success", message: "account verification successful" });
});
exports.verifyEmail = verifyEmail;
// todo: login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //? both email and password provided?
    const { email, password } = req.body;
    if (!email || !password)
        throw new errors_1.default(400, `One or more fields are missing`);
    //? if user exists
    const user = yield User_1.default.findOne({ email: email });
    if (!user)
        throw new errors_1.default(401, `Invalid credentials`);
    //? is pssword correct?
    const isMatch = yield user.matchPassword(password);
    if (!isMatch)
        throw new errors_1.default(401, `Invalid credentials`);
    //? is user verified
    if (!user.isVerified)
        throw new errors_1.default(401, `Couldn't authenticate user`);
    // ? create token user
    const tokenUser = (0, createTokenUser_1.default)(user);
    //? if token exists and is valid attach same token to cookies
    let refreshToken = "";
    const existingToken = yield Token_1.default.findOne({ user: user._id });
    if (existingToken) {
        const { isValid } = existingToken;
        if (!isValid)
            throw new errors_1.default(401, `Authentication failed`);
        refreshToken = existingToken.refreshToken;
        (0, jwt_1.attachCookiesToResponse)({ res, user: tokenUser, refreshToken });
        res.status(200).json(tokenUser);
        return;
    }
    //? if no existing token, create new token and attach cookies to res
    refreshToken = crypto_1.default.randomBytes(10).toString("hex");
    const ip = req.ip;
    const userAgent = req.headers["user-agent"];
    const tokenToCreate = { ip, userAgent, refreshToken };
    yield Token_1.default.create(tokenToCreate);
    (0, jwt_1.attachCookiesToResponse)({ res, user: tokenUser, refreshToken });
    res.status(200).json(tokenUser);
});
exports.login = login;
// todo: logout
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Token_1.default.findOneAndDelete({ user: req.user.userId });
    res.cookie("accessToken", "logout", {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.cookie("refreshToken", "logout", {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res
        .status(200)
        .json({ status: "success", message: "logged out successfully" });
});
exports.logout = logout;
// todo: remove user (if need be)
const removeUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findById(req.body.id);
    if (!user)
        throw new errors_1.default(400, `couldn't find user`);
    yield user.remove();
    res.status(200).json({ status: "success" });
});
exports.removeUser = removeUser;
// todo: current user
const showCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const user = yield User_1.default.findOne({ _id: userId }).select("-password");
    if (!user)
        throw new errors_1.default(400, "user not found");
    const details = {
        name: user.name,
        role: user.role,
        userId: user._id,
    };
    return res.status(200).json({ user: details });
});
exports.showCurrentUser = showCurrentUser;
// todo: forgot password
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //? email provided?
    const { email } = req.body;
    if (!email)
        throw new errors_1.default(401, `Please provide your email id`);
    //? if user exists, create password hashed token
    const user = yield User_1.default.findOne({ email });
    if (user) {
        const passwordResetToken = crypto_1.default.randomBytes(40).toString("hex");
        //? send reset mail with password token
        yield (0, sendResetPasswordMail_1.default)({
            email,
            passwordResetToken,
            name: user.name,
        });
        //? update user with an password expiration date
        const tenMinutes = 1000 * 60 * 1000;
        user.passwordResetToken = (0, createHash_1.default)(passwordResetToken);
        user.passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);
        yield user.save();
    }
    //? send response
    res.status(200).json({
        status: "success",
        message: "Please check your email inbox ",
    });
});
exports.forgotPassword = forgotPassword;
// todo: reset Password
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, token, password } = req.body;
    if (!email || !token || !password)
        throw new errors_1.default(401, `password couldn't be reset`);
    const user = yield User_1.default.findOne({ email });
    if (user) {
        const currentDate = new Date();
        if (user.passwordResetToken === (0, createHash_1.default)(token) &&
            user.passwordTokenExpirationDate &&
            user.passwordTokenExpirationDate > currentDate) {
            user.password = password;
            user.passwordResetToken = null;
            user.passwordTokenExpirationDate = null;
            yield user.save();
        }
    }
    res.status(201).json({
        status: "success",
        message: "password has been reset successfully",
    });
});
exports.resetPassword = resetPassword;
