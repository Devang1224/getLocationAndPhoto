import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const CAPTURES_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "captures")
    : path.join(process.cwd(), "data", "captures");

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const lat = formData.get("latitude") as string | null;
    const lng = formData.get("longitude") as string | null;
    const accuracy = formData.get("accuracy") as string | null;
    const image = formData.get("image") as Blob | null;

    if (!image || typeof lat !== "string" || typeof lng !== "string") {
      return NextResponse.json(
        { error: "Missing latitude, longitude, or image" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const id = `${timestamp}_${Math.random().toString(36).slice(2, 9)}`;
    const meta = {
      id,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") ?? null,
    };

    if (useBlob) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const { url: imageUrl } = await put(`captures/${id}.webp`, buffer, {
        access: "public",
        contentType: "image/webp",
      });
      const metaWithUrl = { ...meta, imageUrl };
      await put(`captures/${id}.json`, JSON.stringify(metaWithUrl, null, 2), {
        access: "public",
        contentType: "application/json",
      });
      return NextResponse.json({ success: true, id });
    }

    await mkdir(CAPTURES_DIR, { recursive: true });
    const imagePath = path.join(CAPTURES_DIR, `${id}.webp`);
    const metaPath = path.join(CAPTURES_DIR, `${id}.json`);
    const buffer = Buffer.from(await image.arrayBuffer());
    await writeFile(imagePath, buffer);
    await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Capture API error:", err);
    return NextResponse.json(
      { error: "Failed to save capture" },
      { status: 500 }
    );
  }
}
