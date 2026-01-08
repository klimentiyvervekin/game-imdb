import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // clientId: { type: String, required: true, unique: true },
    // username: { type: String, default: "Guest" },

    email: { type: String, required: true, unique: true },
    name: { type: String, default: "User" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },

    provider: { type: String, default: "google" },
    providerAccountId: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
