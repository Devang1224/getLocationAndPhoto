import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { list, del } from "@vercel/blob";

const CAPTURES_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "captures")
    : path.join(process.cwd(), "data", "captures");

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const DELETE_PASSWORD = process.env.CAPTURE_DELETE_PASSWORD ?? "random1234";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === "string" ? body.password : "";
    if (password !== DELETE_PASSWORD) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.includes("..") || id.includes("/")) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    if (useBlob) {
      const { blobs } = await list({ prefix: "captures/" });
      const toDelete = blobs.filter(
        (b) =>
          b.pathname === `captures/${id}.webp` ||
          b.pathname === `captures/${id}.json`
      );
      if (toDelete.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      await del(toDelete.map((b) => b.url));
      return NextResponse.json({ success: true });
    }

    const imagePath = path.join(CAPTURES_DIR, `${id}.webp`);
    const metaPath = path.join(CAPTURES_DIR, `${id}.json`);
    await unlink(imagePath).catch(() => {});
    await unlink(metaPath).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Capture delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
