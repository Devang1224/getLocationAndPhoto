import CaptureButton from "./CaptureButton";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-900">
      <main className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-800">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            You’re eligible for a reward
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Click below to confirm your account and complete the process. It only takes a moment.
          </p>
          <CaptureButton />
        </div>
      </main>
      <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
        Secure verification • One-time only
      </p>
    </div>
  );
}
