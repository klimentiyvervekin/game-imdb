import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // это мой localStorage clientId
    clientId: { type: String, required: true, unique: true },

    username: { type: String, default: "Guest" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
