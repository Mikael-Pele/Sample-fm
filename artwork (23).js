import { getSupabaseAdmin, ARTWORK_BUCKET } from "../../../lib/supabaseAdmin";
import { getSessionFromRequest } from "../../../lib/auth";

// Cover art is uploaded directly from the artist's device — no external
// image host required. The client reads the file as a base64 data URL and
// POSTs it here; this route decodes it, uploads it to a public Supabase
// Storage bucket, and returns the public URL to store on the SmartLink.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 6 * 1024 * 1024; // 6MB per image, comfortably under the 8mb body limit

function extensionForMime(mime) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      return res.status(401).json({ error: "You must be signed in to upload cover art." });
    }

    const { data_url } = req.body || {};

    if (!data_url || typeof data_url !== "string" || !data_url.startsWith("data:")) {
      return res.status(400).json({ error: "No image data received." });
    }

    const match = data_url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Malformed image data." });
    }

    const [, mimeType, base64Payload] = match;

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({
        error: "Unsupported image type. Please upload a JPG, PNG, WEBP, or GIF.",
      });
    }

    const buffer = Buffer.from(base64Payload, "base64");

    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ error: "Image is too large. Max size is 6MB." });
    }

    const supabase = getSupabaseAdmin();
    const filePath = `${session.userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extensionForMime(mimeType)}`;

    const { error: uploadError } = await supabase.storage
      .from(ARTWORK_BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[/api/upload/artwork] storage upload error:", uploadError);
      return res.status(502).json({ error: "Could not upload image to storage." });
    }

    const { data: publicUrlData } = supabase.storage.from(ARTWORK_BUCKET).getPublicUrl(filePath);

    return res.status(201).json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("[/api/upload/artwork] error:", err);
    return res.status(500).json({ error: "Internal server error while uploading cover art." });
  }
}
