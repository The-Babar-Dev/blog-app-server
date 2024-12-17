import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

import { connectDb } from "./lib/connectDb.js";

import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import commentRouter from "./routes/comment.route.js";
import webHooksRouter from "./routes/webhook.route.js";
import { clerkMiddleware } from "@clerk/express";

const app = express();

app.use(cors(process.env.CLIENT_URL));
app.use(clerkMiddleware());

app.use("/api/webhooks", webHooksRouter); // place before express.json() middleware to avoid conflicts
app.use(express.json());

// allow cross-origin requests
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// app.get("/auth-state", (req, res) => {
//   const authState = req.auth;

//   res.json(authState);
// });

// app.get("/protect", (req, res) => {
//   const { userId } = req.auth;

//   if (!userId) res.status(401).json("Not Authenticated");

//   res.status(200).json("Content");
// });

app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentRouter);

//Base route
app.get("/", (req, res) => {
  res.send("Sever is running!");
});

//Error handler middleware
app.use((error, req, res, next) => {
  res.status(error.status || 500);

  res.json({
    message: error.message || "Something went wrong!",
    status: error.status || 500,
    stack: error.stack,
  });
});

//Default router handler

app.listen(3001, () => {
  connectDb(); //Make Db Connection
  console.log("Express Server Running on port 3001");
});
