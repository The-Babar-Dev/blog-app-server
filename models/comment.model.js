import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    // User who commented
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    //Each comment belongs to a post
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    desc: { type: String, require: true },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
