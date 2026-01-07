import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId, // here you cant write just "string" because then you cant use populate. this means "this review" is part of a specific game"
      ref: "Game", // link (reference) to the Game.js model
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: String,
      default: "Anonymous",
    },

    authorId: { type: String, default: null }, // clientId
    hasSpoilers: { type: Boolean, default: false },

    helpfulCount: { type: Number, default: 0 },
    notHelpfulCount: { type: Number, default: 0 },
    helpfulVoters: [{ type: String }], // clientId until now
    notHelpfulVoters: [{ type: String }],

    updates: [
      {
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },

        authorId: { type: String, default: null }, // clientId
        hasSpoilers: { type: Boolean, default: false },

        helpfulCount: { type: Number, default: 0 },
        notHelpfulCount: { type: Number, default: 0 },
        helpfulVoters: [{ type: String }], 
        notHelpfulVoters: [{ type: String }], 
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
