import express from "express";
import {
  getPostComments,
  addComment,
  deleteComment,
} from "../controller/comment.controller.js";

const router = express.Router();

router.get("/:postId", getPostComments);
router.post("/:postId", addComment);
router.delete("/:id", deleteComment); //id = commentId

export default router;
