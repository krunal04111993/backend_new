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
exports.authorizePermissions = exports.authenticateUser = void 0;
const errors_1 = __importDefault(require("../errors/errors"));
const Token_1 = __importDefault(require("../models/Token"));
const jwt_1 = require("../utils/jwt");
const jwt_2 = require("../utils/jwt");
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { accessToken, refreshToken } = req.signedCookies;
    try {
        //? access token?
        if (accessToken) {
            const payload = (0, jwt_1.isTokenValid)(accessToken);
            req.user = payload.user;
            return next();
        }
        //? only refreshToken?
        const payload = (0, jwt_1.isTokenValid)(refreshToken);
        const existingToken = yield Token_1.default.findOne({
            user: payload.user.userId,
            refreshToken,
        });
        //? no token or !isValid?
        if (!existingToken || !existingToken.isValid)
            throw new errors_1.default(401, `authentication failed`);
        //? attach cookies to response and set req.user...next middleware
        (0, jwt_2.attachCookiesToResponse)({ res, user: payload.user, refreshToken });
        req.user = payload.user;
        next();
    }
    catch (error) {
        throw new errors_1.default(401, `authentication failed... try logging in`);
    }
});
exports.authenticateUser = authenticateUser;
const authorizePermissions = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new errors_1.default(403, `Not authorized to access this route`);
        }
        next();
    };
};
exports.authorizePermissions = authorizePermissions;
