import type { Metadata } from "next";
import Link from "next/link";
import { decodePayload } from "@/lib/share-utils";

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ payload?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const payload = params.payload ? decodePayload(params.payload) : null;

  const title = payload
    ? `AI Spend Audit • ${payload.totalMonthlySavings.toFixed(0)} saved`
    : "AI Spend Audit";

  const description = payload
    ? `A public audit for ${payload.useCase} spend shows ${payload.totalMonthlySavings.toFixed(0)} in estimated monthly savings.`
    : "Public AI spend audit page.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/share${params.payload ? `?payload=${params.payload}` : ""}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ payload?: string }>;
}) {
  const params = await searchParams;

  if (!params.payload) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Public audit</p>
          <h1 className="mt-4 text-3xl font-semibold">No shared audit was found.</h1>
          <p className="mt-3 text-slate-300">Generate an audit from the landing page to create a shareable link.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950">
            Return to audit builder
          </Link>
        </div>
      </main>
    );
  }

  const payload = decodePayload(params.payload);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Public audit preview</p>
          <h1 className="mt-4 text-4xl font-semibold">Estimated monthly savings: ${payload.totalMonthlySavings.toFixed(2)}</h1>
          <p className="mt-3 max-w-2xl text-slate-200">
            This shareable audit is focused on the savings opportunities and recommendations only, with no individual contact information included.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950">
              Build your own audit
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-300">Annual savings</p>
            <p className="mt-2 text-3xl font-semibold">${payload.totalAnnualSavings.toFixed(2)}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-300">Primary use case</p>
            <p className="mt-2 text-3xl font-semibold capitalize">{payload.useCase}</p>
          </div>
        </div>

        <div className="space-y-4">
          {payload.perTool.map((tool) => (
            <div key={`${tool.tool}-${tool.currentPlan}`} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{tool.tool}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{tool.recommendedAction}</h2>
                  <p className="mt-2 text-slate-200">{tool.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300">Estimated savings</p>
                  <p className="text-2xl font-semibold text-emerald-300">${tool.savings.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
