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
const emailTemplate_1 = require("./emailTemplate");
const sendMail_1 = __importDefault(require("./sendMail"));
const sendResetPasswordMail = ({ name, email, passwordResetToken, }) => __awaiter(void 0, void 0, void 0, function* () {
    const origin = process.env.ORIGIN;
    const subject = `Reset Password`;
    const link = `${origin}/reset-password?token=${passwordResetToken}&email=${email}`;
    const body = "To reset your password click the following button.";
    const html = (0, emailTemplate_1.emailTemplate)({
        from: "Chatty App",
        to: name,
        url: link,
        body,
        btnText: "Reset Password",
        preHeader: "You made a password reset request",
    });
    yield (0, sendMail_1.default)({ to: email, subject, html });
});
exports.default = sendResetPasswordMail;
