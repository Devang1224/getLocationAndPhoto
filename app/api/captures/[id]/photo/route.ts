import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { list } from "@vercel/blob";

const CAPTURES_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "captures")
    : path.join(process.cwd(), "data", "captures");

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.includes("..") || id.includes("/")) {
      return new NextResponse("Invalid id", { status: 400 });
    }

    if (useBlob) {
      const { blobs } = await list({ prefix: `captures/${id}.webp` });
      const blob = blobs.find((b) => b.pathname === `captures/${id}.webp`);
      if (!blob) return new NextResponse("Not found", { status: 404 });
      return NextResponse.redirect(blob.url);
    }

    const imagePath = path.join(CAPTURES_DIR, `${id}.webp`);
    const buffer = await readFile(imagePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
