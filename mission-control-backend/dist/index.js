"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server"));
// Create and start the server
const server = new server_1.default();
server.start().catch((error) => {
    console.error('💥 Failed to start Mission Control Backend:', error);
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=index.js.map