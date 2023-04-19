"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createTokenUser = (user) => {
    const tokenUser = {
        userId: user._id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
    };
    return tokenUser;
};
exports.default = createTokenUser;
