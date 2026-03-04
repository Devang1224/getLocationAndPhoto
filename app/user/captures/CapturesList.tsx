"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type CaptureMeta = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  userAgent: string | null;
  imageUrl?: string;
};

export default function CapturesList() {
  const [captures, setCaptures] = useState<CaptureMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/captures")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setCaptures)
      .catch(() => setError("Could not load captures."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">Loading captures…</p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white p-6 text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-red-400">
        {error}
      </p>
    );
  }

  if (captures.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
        No captures yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {captures.map((c) => (
        <li
          key={c.id}
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <div className="relative aspect-video bg-zinc-200 dark:bg-zinc-700">
            <Image
              src={
                c.imageUrl ??
                `/api/captures/${encodeURIComponent(c.id)}/photo`
              }
              alt="Capture"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {new Date(c.timestamp).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
            </p>
            <a
              href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Open in Google Maps
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
