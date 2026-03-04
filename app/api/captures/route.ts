import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { list } from "@vercel/blob";

export type CaptureMeta = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  userAgent: string | null;
  imageUrl?: string;
};

const CAPTURES_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "captures")
    : path.join(process.cwd(), "data", "captures");

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function GET() {
  try {
    if (useBlob) {
      const { blobs } = await list({ prefix: "captures/" });
      const jsonBlobs = blobs.filter((b) => b.pathname.endsWith(".json"));
      const captures: CaptureMeta[] = [];
      for (const blob of jsonBlobs) {
        const res = await fetch(blob.url);
        const raw = await res.text();
        try {
          captures.push(JSON.parse(raw) as CaptureMeta);
        } catch {
          // skip invalid json
        }
      }
      captures.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return NextResponse.json(captures);
    }

    const files = await readdir(CAPTURES_DIR).catch(() => []);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const captures: CaptureMeta[] = [];
    for (const file of jsonFiles) {
      const raw = await readFile(
        path.join(CAPTURES_DIR, file),
        "utf-8"
      ).catch(() => null);
      if (raw) {
        try {
          captures.push(JSON.parse(raw) as CaptureMeta);
        } catch {
          // skip
        }
      }
    }
    captures.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return NextResponse.json(captures);
  } catch (err) {
    console.error("Captures list error:", err);
    return NextResponse.json(
      { error: "Failed to list captures" },
      { status: 500 }
    );
  }
}
