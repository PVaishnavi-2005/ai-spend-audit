"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";

type FormData = {
  tool: string;
  plan: string;
  monthlySpend: number;
  seats: number;
  teamSize: number;
  useCase: string;
};

type AuditResult = {
  savings: number;
  recommendation: string;
};

export default function Home() {
  const { register, handleSubmit, reset } = useForm<FormData>();

  const [result, setResult] = useState<AuditResult | null>(null);

  const onSubmit = (data: FormData) => {
    let savings = 0;
    let recommendation = "";

    // ChatGPT Logic
    if (
      data.tool === "ChatGPT" &&
      data.plan.toLowerCase() === "team" &&
      data.seats <= 2
    ) {
      savings = 30;

      recommendation =
        "Switch from ChatGPT Team to ChatGPT Plus. Team plans are usually unnecessary for very small teams.";
    }

    // Cursor Logic
    else if (
      data.tool === "Cursor" &&
      data.plan.toLowerCase() === "business" &&
      data.seats === 1
    ) {
      savings = 20;

      recommendation =
        "Cursor Pro is more cost-effective for solo developers than the Business plan.";
    }

    // GitHub Copilot Logic
    else if (
      data.tool === "GitHub Copilot" &&
      data.plan.toLowerCase() === "enterprise" &&
      data.teamSize < 5
    ) {
      savings = 40;

      recommendation =
        "GitHub Copilot Business offers nearly identical features for smaller teams at a lower price.";
    }

    // Claude Logic
    else if (
      data.tool === "Claude" &&
      data.monthlySpend > 100
    ) {
      savings = 25;

      recommendation =
        "Consider using API-based usage or lower-tier plans to optimize Claude costs.";
    }

    // Default
    else {
      recommendation =
        "Your current AI stack appears reasonably optimized based on the provided information.";
    }

    setResult({
      savings,
      recommendation,
    });
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        {/* HERO SECTION */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            AI Spend Auditor
          </h1>

          <p className="text-gray-400 text-lg">
            Discover hidden savings across your AI tools in under 60 seconds.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
        >
          {/* TOOL */}
          <div>
            <label className="block mb-2 font-medium">
              AI Tool
            </label>

            <select
              {...register("tool")}
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700"
            >
              <option>ChatGPT</option>
              <option>Claude</option>
              <option>Cursor</option>
              <option>GitHub Copilot</option>
              <option>Gemini</option>
              <option>OpenAI API</option>
              <option>Anthropic API</option>
              <option>Windsurf</option>
            </select>
          </div>

          {/* PLAN */}
          <div>
            <label className="block mb-2 font-medium">
              Current Plan
            </label>

            <input
              {...register("plan")}
              placeholder="Ex: Plus, Team, Enterprise"
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700"
            />
          </div>

          {/* MONTHLY SPEND */}
          <div>
            <label className="block mb-2 font-medium">
              Monthly Spend ($)
            </label>

            <input
              type="number"
              {...register("monthlySpend", { valueAsNumber: true })}
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700"
            />
          </div>

          {/* SEATS */}
          <div>
            <label className="block mb-2 font-medium">
              Number of Seats
            </label>

            <input
              type="number"
              {...register("seats", { valueAsNumber: true })}
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700"
            />
          </div>

          {/* TEAM SIZE */}
          <div>
            <label className="block mb-2 font-medium">
              Team Size
            </label>

            <input
              type="number"
              {...register("teamSize", { valueAsNumber: true })}
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700"
            />
          </div>

          {/* USE CASE */}
          <div>
            <label className="block mb-2 font-medium">
              Primary Use Case
            </label>

            <select
              {...register("useCase")}
              className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700"
            >
              <option>Coding</option>
              <option>Writing</option>
              <option>Research</option>
              <option>Data Analysis</option>
              <option>Mixed</option>
            </select>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Generate Audit
            </button>

            <button
              type="button"
              onClick={() => {
                reset();
                setResult(null);
              }}
              className="flex-1 bg-zinc-800 border border-zinc-700 py-3 rounded-xl font-semibold hover:bg-zinc-700 transition"
            >
              Reset
            </button>
          </div>
        </form>

        {/* RESULTS */}
        {result && (
          <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6">
              Audit Results
            </h2>

            {/* MONTHLY */}
            <div className="mb-6">
              <p className="text-gray-400 mb-2">
                Potential Monthly Savings
              </p>

              <h3 className="text-5xl font-bold text-green-400">
                ${result.savings}
              </h3>
            </div>

            {/* ANNUAL */}
            <div className="mb-6">
              <p className="text-gray-400 mb-2">
                Estimated Annual Savings
              </p>

              <h3 className="text-3xl font-semibold">
                ${result.savings * 12}
              </h3>
            </div>

            {/* RECOMMENDATION */}
            <div>
              <p className="text-gray-400 mb-2">
                Recommendation
              </p>

              <div className="bg-zinc-800 border border-zinc-700 p-5 rounded-xl leading-7">
                {result.recommendation}
              </div>
            </div>

            {/* CREDEx CTA */}
            {result.savings >= 50 && (
              <div className="mt-8 bg-green-500/10 border border-green-500/30 p-6 rounded-xl">
                <h4 className="text-xl font-semibold mb-2 text-green-400">
                  Unlock More Savings with Credex
                </h4>

                <p className="text-gray-300 mb-4">
                  Your stack shows strong savings potential. Credex can help you reduce AI infrastructure costs even further.
                </p>

                <button className="bg-green-400 text-black px-5 py-3 rounded-xl font-semibold hover:bg-green-300 transition">
                  Book Consultation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}