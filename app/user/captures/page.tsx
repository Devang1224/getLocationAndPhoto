import Link from "next/link";
import CapturesList from "./CapturesList";

export const metadata = {
  title: "Stored captures",
  description: "View captured images and locations",
};

export default function UserCapturesPage() {
  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Stored captures
          </h1>
          <Link
            href="/"
            className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            ← Back
          </Link>
        </div>
        <CapturesList />
      </div>
    </div>
  );
}
