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
const sendVerificationMail = ({ name, email, verificationToken, }) => __awaiter(void 0, void 0, void 0, function* () {
    const origin = process.env.ORIGIN;
    const subject = `Verification Email`;
    const link = `${origin}/verify-email?token=${verificationToken}&email=${email}`;
    const body = "To use all the features of Chatty! you must verify your email account first";
    const html = (0, emailTemplate_1.emailTemplate)({
        from: "Chatty App",
        to: name,
        url: link,
        body,
        btnText: "Verify Email",
        preHeader: "Verify your Chatty account",
    });
    yield (0, sendMail_1.default)({ to: email, subject, html });
});
exports.default = sendVerificationMail;
