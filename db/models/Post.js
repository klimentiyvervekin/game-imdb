// db/models/Post.js
import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },

    content: { 
      type: String, 
      required: true, 
      trim: true 
    },

    imageUrl: { 
      type: String, 
      default: "" 
    },

    videoUrl: { 
      type: String, 
      default: "" 
    },

    authorId: {
      type: String,
      required: true, // clientId until now
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["text"], // later: image, link, video
      default: "text",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
