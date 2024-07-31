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
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const PORT = 3000;
const JWT_SECRET = "pranavchaitu";
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    credentials: true,
    origin: "http://localhost:5173"
}));
const client = new client_1.PrismaClient();
app.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield client.user.create({
            data: {
                username: username,
                password: password
            },
            select: {
                id: true
            }
        });
        return res.json({
            user
        });
    }
    catch (error) {
        return res.status(400).json({
            error: "user aldready exists"
        });
    }
}));
app.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield client.user.findFirst({
        where: {
            username: username,
            password: password
        },
        select: {
            id: true
        }
    });
    if (!user)
        return res.status(404).json({ msg: "user not found" });
    const token = jsonwebtoken_1.default.sign({
        id: user.id
    }, JWT_SECRET);
    res.cookie("token", token);
    res.json({
        msg: "logged in"
    });
}));
// auth middleware
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    }
    catch (error) {
        return res.status(400).json({
            msg: "user not authenticated"
        });
    }
};
app.get('/user', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client.user.findFirst({
        where: {
            id: Number(req.userId)
        },
        select: {
            username: true
        }
    });
    return res.json({
        user
    });
}));
app.post('/logout', authMiddleware, (req, res) => {
    res.cookie('token', "");
    return res.json({
        msg: "logged out"
    });
});
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, './index.html'));
});
app.listen(PORT, () => {
    console.log(`listening to port ${PORT}`);
});
