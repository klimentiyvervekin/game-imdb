import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },

    content: { type: String, required: true, trim: true },

    imageUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },

    authorId: { type: String, required: true }, // dbUserId

    likedBy: { type: [String], default: [] }, // post likes

    comments: {
      type: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          authorId: { type: String, required: true }, // dbUserId
          text: { type: String, required: true, trim: true },
          imageUrl: { type: String, default: "" },
          createdAt: { type: Date, default: Date.now },

          likedBy: { type: [String], default: [] }, // comment likes

          replies: {
            type: [
              {
                _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
                authorId: { type: String, required: true }, // dbUserId
                text: { type: String, required: true, trim: true },
                imageUrl: { type: String, default: "" },

                // reply-to-reply (store parent reply id as string)
                replyToId: { type: String, default: null },

                createdAt: { type: Date, default: Date.now },

                likedBy: { type: [String], default: [] }, // reply likes
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },

    type: { type: String, enum: ["text"], default: "text" },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
