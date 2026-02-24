import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vote for Sahil Baligar",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://sahilbaligar.com/Senate",
  },
};

export default function SenatePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 px-6 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Vote for Sahil Baligar
          </h1>
          <p className="text-base text-gray-300">
            Scan the QR code to cast your vote.
          </p>
          <p className="mt-2">
            <a
              href="https://purdue.ca1.qualtrics.com/jfe/form/SV_cZvk5GOr3l99JNs"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Click Here to Vote
            </a>
          </p>
        </header>

        <section className="w-full">
          <img
            src="/Senate/QRCode.png"
            alt="Voting QR code"
            className="mx-auto w-full max-w-xs rounded-md bg-white p-4 shadow-lg"
          />
        </section>

        <section className="w-full">
          <h2 className="mb-4 text-2xl font-semibold">Flyer</h2>
          <div className="flex w-full flex-col gap-6">
            <iframe
              src="/Senate/UpdatedPoster.html"
              title="Vote flyer"
              className="h-[900px] w-full rounded-md border border-gray-800 bg-white"
            />
            <div className="flex w-full flex-col items-center gap-3">
              <iframe
                src="/Senate/QRCode.pdf"
                title="Flyer PDF"
                className="h-[700px] w-full rounded-md border border-gray-800 bg-white"
              />
              <a
                href="/Senate/QRCode.pdf"
                className="text-sm text-gray-300 underline"
              >
                Download PDF
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
