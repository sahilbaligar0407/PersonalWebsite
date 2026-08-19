import type { Metadata } from "next";

const RESUME_PATH = "/Resume-SahilBaligar-August2026.pdf";

export const metadata: Metadata = {
  title: "Resume | Sahil Baligar",
  description: "Resume of Sahil Baligar — Computer Science student at Purdue University.",
};

export default function ResumePage() {
  return (
    <main className="min-h-screen w-full bg-black flex flex-col">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
        <h1 className="text-lg font-semibold text-white">Sahil Baligar — Resume</h1>
        <a
          href={RESUME_PATH}
          download
          className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          Download PDF
        </a>
      </div>
      <div className="flex-1">
        <object
          data={RESUME_PATH}
          type="application/pdf"
          className="h-full min-h-[calc(100vh-65px)] w-full"
          aria-label="Sahil Baligar resume"
        >
          <div className="flex h-full min-h-[calc(100vh-65px)] flex-col items-center justify-center gap-4 p-8 text-center text-white">
            <p className="text-gray-300">
              Your browser can&apos;t display the PDF inline.
            </p>
            <a
              href={RESUME_PATH}
              download
              className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Download the resume
            </a>
          </div>
        </object>
      </div>
    </main>
  );
}
