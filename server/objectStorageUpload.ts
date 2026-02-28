import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";
import path from "path";

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";

function requireBucketId(): string {
  if (!BUCKET_ID) {
    throw new Error("Object storage not configured: DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set");
  }
  return BUCKET_ID;
}

export async function uploadToObjectStorage(
  buffer: Buffer,
  originalFilename: string,
  folder: string,
  contentType?: string
): Promise<string> {
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const ext = path.extname(originalFilename);
  const objectName = `uploads/${folder}/${uniqueSuffix}${ext}`;

  const bucketId = requireBucketId();
  const bucket = objectStorageClient.bucket(bucketId);
  const file = bucket.file(objectName);

  await file.save(buffer, {
    contentType: contentType || "application/octet-stream",
    resumable: false,
  });

  return `/storage/${objectName}`;
}

export async function streamFromObjectStorage(
  objectPath: string,
  res: import("express").Response
): Promise<boolean> {
  try {
    const objectName = objectPath.replace(/^\/storage\//, "");
    const bucketId = requireBucketId();
    const bucket = objectStorageClient.bucket(bucketId);
    const file = bucket.file(objectName);

    const [exists] = await file.exists();
    if (!exists) return false;

    const [metadata] = await file.getMetadata();
    res.set({
      "Content-Type": (metadata.contentType as string) || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    });
    if (metadata.size) res.set("Content-Length", String(metadata.size));

    const stream = file.createReadStream();
    stream.on("error", (err) => {
      console.error("[object-storage] Stream error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Stream error" });
    });
    stream.pipe(res);
    return true;
  } catch (err) {
    console.error("[object-storage] Download error:", err);
    return false;
  }
}
