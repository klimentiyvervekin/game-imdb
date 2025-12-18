import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 2 },
    slug: { type: String, required: true, unique: true },
    coverUrl: { type: String },

    externalId: { type: Number, required: true, unique: true },  // external id is id from another place. this means "dont do a duplicate"
  },
  { timestamps: true }         // create and update dates
);

export default mongoose.models.Game || mongoose.model("Game", GameSchema);