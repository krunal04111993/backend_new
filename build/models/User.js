"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validator_1 = __importDefault(require("validator"));
const cloudinary_1 = require("cloudinary");
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: [15, "name too long. Try nickname"],
    },
    email: {
        requried: true,
        type: String,
        trim: true,
        validate: {
            validator: validator_1.default.isEmail,
            message: "Please provide valid email",
        },
        lowercase: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minLength: [6, "password cannot be than 6 characters"],
    },
    avatar: {
        type: String,
        default: "https://flyclipart.com/thumb2/user-profile-avatar-login-account-png-icon-free-download-935697.png",
    },
    cloudinaryId: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: String,
    verified: Date,
    passwordResetToken: String,
    passwordTokenExpirationDate: { type: Date },
}, { timestamps: true });
userSchema.pre("save", function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return;
        this.password = yield bcryptjs_1.default.hash(this.password, 10);
    });
});
// ? removes the avatar from cloudinary before removing the user from db
userSchema.pre("remove", function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield cloudinary_1.v2.uploader.destroy(this.cloudinaryId);
    });
});
userSchema.methods.matchPassword = function (userInput) {
    return __awaiter(this, void 0, void 0, function* () {
        const isMatch = yield bcryptjs_1.default.compare(userInput, this.password);
        return isMatch;
    });
};
exports.default = mongoose_1.default.model("User", userSchema);
