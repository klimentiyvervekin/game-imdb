import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 2 },
    slug: { type: String, required: true, unique: true },
    coverUrl: { type: String },

    externalId: { type: Number, required: true, unique: true },  // external id is id from another place. this means "dont do a duplicate"

    // optional info for 5 mvp ticket
    releaseDate: { type: Date },
    developer: { type: String },
    publisher: { type: String },
    platforms: [{ type: String }],
    description: { type: String },
    score: { type: Number }, // rating from RAWG api
    stores: [{ type: String }],
    screenshotsCount: { type: Number },
    videosCount: { type: Number },
  },
  { timestamps: true }         // create and update dates
);

export default mongoose.models.Game || mongoose.model("Game", GameSchema);

// this file is my mongoose model where i have my table, game collections and so on