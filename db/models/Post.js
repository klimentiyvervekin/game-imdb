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
      trim: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    videoUrl: {
      type: String,
      default: "",
    },

    authorId: {
      type: String,
      required: true,
    },

    likedBy: {
      type: [String],
      default: [],
    },

    type: {
      type: String,
      enum: ["text"],
      default: "text",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
