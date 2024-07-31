import express,{ Request,Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt, { decode, JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import path from "path"

const PORT = 3000
const JWT_SECRET = "pranavchaitu"

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: "http://localhost:5173"
}));

const client = new PrismaClient();

app.post('/signup',async (req,res) => {
    const { username,password } = req.body; 
    try {
        const user = await client.user.create({
            data : {
                username : username,
                password : password
            },
            select : {
                id : true
            }
        })
        return res.json({
            user
        })   
    } catch (error) {
        return res.status(400).json({
            error : "user aldready exists"
        })
    }
})

app.post('/signin',async (req,res) => {
    const { username,password } = req.body
    const user = await client.user.findFirst({
        where : {
            username : username,
            password : password
        },
        select : {
            id : true
        }  
    })
    if(!user) return res.status(404).json({msg : "user not found"})
    const token = jwt.sign({
        id : user.id
    },JWT_SECRET)
    res.cookie("token",token)
    res.json({
        msg : "logged in"
    })
})

// type declaration for Request interface to include userId
declare module 'express-serve-static-core' {
    interface Request {
        userId?: string;
    }
}

// auth middleware
const authMiddleware = (req : Request,res : Response,next : Function) => {
    const token = req.cookies.token
    try {
        const decoded = jwt.verify(token,JWT_SECRET) as JwtPayload
        req.userId = decoded.id        
        next()
    } catch (error) {
        return res.status(400).json({
            msg : "user not authenticated"
        })
    }
}

app.get('/user',authMiddleware,async (req,res) => {
    const user = await client.user.findFirst({
        where : {
            id : Number(req.userId)
        },
        select : {
            username : true
        }
    })
    return res.json({
        user
    })
})

app.post('/logout',authMiddleware,(req,res) => {
    res.cookie('token',"")
    return res.json({
        msg : "logged out"
    })
})

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname,'./index.html'))
})

app.listen(PORT,() => {
    console.log(`listening to port ${PORT}`);
})