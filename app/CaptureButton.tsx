"use client";

import { useState, useRef, useCallback } from "react";

type Status =
  | "idle"
  | "requesting_location"
  | "location_ok"
  | "requesting_camera"
  | "camera_ok"
  | "capturing"
  | "uploading"
  | "success"
  | "error";

function getFriendlyError(err: unknown): string {
  if (typeof err !== "object" || err === null) return "Something went wrong.";
  const e = err as { code?: number; name?: string; message?: string };
  // GeolocationPositionError: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
  if (typeof e.code === "number") {
    if (e.code === 1)
      return "Location denied. Use the site over https:// or localhost, then allow location when the browser asks.";
    if (e.code === 2) return "Location unavailable. Check device location is on.";
    if (e.code === 3) return "Location timed out. Please try again.";
  }
  if (e.name === "NotAllowedError")
    return "Camera denied. Use https:// or localhost and allow camera when the browser asks.";
  if (e.message) return e.message;
  return "Something went wrong.";
}

export default function CaptureButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSecureContext =
    typeof window !== "undefined" && window.isSecureContext;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const capturePhoto = useCallback(async (): Promise<Blob> => {
    const video = videoRef.current;
    if (!video || !streamRef.current) throw new Error("No video stream");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");
    ctx.drawImage(video, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))),
        "image/webp",
        0.9
      );
    });
  }, []);

  const handleClick = async () => {
    setMessage("");
    if (!isSecureContext) {
      setStatus("error");
      setMessage(
        "Location and camera only work on a secure page. Open this site at https://... or http://localhost:3000"
      );
      return;
    }
    setStatus("requesting_location");

    try {
      // 1) Ask for geolocation permission (browser shows "Allow location?" prompt)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      setStatus("location_ok");

      // 2) Ask for camera permission (browser shows "Allow camera?" prompt)
      setStatus("requesting_camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("camera_ok");
      // Short delay so a frame is available
      await new Promise((r) => setTimeout(r, 500));

      setStatus("capturing");
      const imageBlob = await capturePhoto();
      stopStream();

      setStatus("uploading");

      const form = new FormData();
      form.append("latitude", String(position.coords.latitude));
      form.append("longitude", String(position.coords.longitude));
      form.append("accuracy", String(position.coords.accuracy ?? ""));
      form.append("image", imageBlob, "photo.webp");

      const res = await fetch("/api/capture", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      setStatus("success");
      setMessage("Done. Thank you.");
    } catch (err) {
      console.error(err);
      stopStream();
      setStatus("error");
      setMessage(getFriendlyError(err));
    }
  };

  const isLoading =
    status === "requesting_location" ||
    status === "location_ok" ||
    status === "requesting_camera" ||
    status === "camera_ok" ||
    status === "capturing" ||
    status === "uploading";

  return (
    <div className="flex flex-col items-center gap-4">
      {!isSecureContext && (
        <p className="max-w-sm text-center text-sm text-amber-600 dark:text-amber-400">
          Open this page at <strong>http://localhost:3000</strong> or an{" "}
          <strong>https://</strong> URL so location and camera can work.
        </p>
      )}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        autoPlay
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading
          ? status === "requesting_location"
            ? "Allow location..."
            : status === "requesting_camera"
              ? "Allow camera..."
              : status === "location_ok" || status === "camera_ok"
                ? "Access granted..."
                : status === "capturing"
                  ? "Taking photo..."
                  : "Saving..."
          : status === "success"
            ? "Done"
            : status === "error"
              ? "Try again"
              : "Continue"}
      </button>
      {message && (
        <p
          className={
            status === "error"
              ? "text-sm text-red-600"
              : "text-sm text-zinc-600 dark:text-zinc-400"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
