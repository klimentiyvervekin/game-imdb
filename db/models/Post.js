import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    content: { type: String, required: true },
    imageUrl: { type: String },
  },
  { timestamps: true } // create and update dates
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
