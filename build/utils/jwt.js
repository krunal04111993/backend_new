"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachCookiesToResponse = exports.isTokenValid = exports.createJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createJWT = (payload) => jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET);
exports.createJWT = createJWT;
const isTokenValid = (token) => jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
exports.isTokenValid = isTokenValid;
const attachCookiesToResponse = ({ res, user, refreshToken, }) => {
    const accessTokenJWT = (0, exports.createJWT)({ user });
    const refreshTokenJWT = (0, exports.createJWT)({ user, refreshToken });
    const oneDay = 1000 * 60 * 60 * 24;
    const longerExpiry = 1000 * 60 * 60 * 24 * 30;
    res.cookie("accessToken", accessTokenJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        signed: true,
        expires: new Date(Date.now() + oneDay),
        sameSite: 'none'
    });
    res.cookie("refreshToken", refreshTokenJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        signed: true,
        expires: new Date(Date.now() + longerExpiry),
        sameSite: 'none'
    });
};
exports.attachCookiesToResponse = attachCookiesToResponse;
