"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const notFound = (req, res) => {
    res.status(404).json({
        status: "failed",
        message: "the page you requested for does not exist",
    });
};
exports.notFound = notFound;
