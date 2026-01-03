import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Увеличиваем лимит body, потому что base64 может быть большой
export const config = {
  api: {
    bodyParser: { sizeLimit: "25mb" }, // для видео может быть мало — см. ниже
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { file, kind } = req.body; // kind: "image" | "video"

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const resourceType = kind === "video" ? "video" : "image";

    const result = await cloudinary.uploader.upload(file, {
      resource_type: resourceType,
      folder: "posts",
    });

    return res.status(200).json({ url: result.secure_url });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
}
