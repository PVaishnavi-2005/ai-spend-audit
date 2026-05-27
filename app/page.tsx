"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Share2, ShieldCheck, Workflow } from "lucide-react";
import { buildAudit, type ToolInput, type UseCase } from "@/lib/audit-engine";
import { encodePayload, type PublicAuditPayload } from "@/lib/share-utils";

const toolCatalog = [
  "Cursor",
  "GitHub Copilot",
  "Claude",
  "ChatGPT",
  "OpenAI API",
  "Anthropic API",
  "Gemini",
  "Windsurf",
] as const;

const defaultRows: ToolInput[] = [
  { tool: "Cursor", plan: "Business", spend: 0, seats: 1 },
  { tool: "ChatGPT", plan: "Team", spend: 0, seats: 2 },
  { tool: "GitHub Copilot", plan: "Business", spend: 0, seats: 3 },
];

const getInitialState = () => {
  if (typeof window === "undefined") {
    return { toolRows: defaultRows, teamSize: 6, useCase: "mixed" as UseCase };
  }

  try {
    const stored = window.localStorage.getItem("ai-spend-audit-state");
    if (!stored) return { toolRows: defaultRows, teamSize: 6, useCase: "mixed" as UseCase };

    const parsed = JSON.parse(stored) as { toolRows?: ToolInput[]; teamSize?: number; useCase?: UseCase };
    return {
      toolRows: Array.isArray(parsed.toolRows) && parsed.toolRows.length ? parsed.toolRows : defaultRows,
      teamSize: typeof parsed.teamSize === "number" ? parsed.teamSize : 6,
      useCase: parsed.useCase || "mixed",
    };
  } catch {
    return { toolRows: defaultRows, teamSize: 6, useCase: "mixed" as UseCase };
  }
};

export default function Home() {
  const initialState = getInitialState();
  const [toolRows, setToolRows] = useState<ToolInput[]>(initialState.toolRows);
  const [teamSize, setTeamSize] = useState(initialState.teamSize);
  const [useCase, setUseCase] = useState<UseCase>(initialState.useCase);
  const [summary, setSummary] = useState("Generate an audit to get an AI summary.");
  const [summarySource, setSummarySource] = useState("templated");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [leadStatus, setLeadStatus] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [leadForm, setLeadForm] = useState({ email: "", company: "", role: "", teamSize: "" });

  useEffect(() => {
    window.localStorage.setItem("ai-spend-audit-state", JSON.stringify({ toolRows, teamSize, useCase }));
  }, [toolRows, teamSize, useCase]);

  const audit = useMemo(() => buildAudit(toolRows, useCase, teamSize), [toolRows, useCase, teamSize]);

  useEffect(() => {
    let active = true;

    const generateSummary = async () => {
      if (!toolRows.length) return;

      try {
        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(audit),
        });
        const data = await response.json();
        if (active) {
          setSummary(data.summary || "A quick summary is unavailable right now.");
          setSummarySource(data.source || "fallback");
        }
      } catch {
        if (active) {
          setSummary("Summary generation fell back to the template version because the AI endpoint was unavailable.");
          setSummarySource("fallback");
        }
      }
    };

    generateSummary();

    return () => {
      active = false;
    };
  }, [audit, toolRows.length]);

  const updateRow = (index: number, field: keyof ToolInput, value: string | number) => {
    setToolRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    setToolRows((current) => [...current, { tool: "Cursor", plan: "Pro", spend: 0, seats: 1 }]);
  };

  const removeRow = (index: number) => {
    setToolRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleGenerate = () => {
    setHasGenerated(true);
    setShareLink("");
    setCopied(false);
  };

  const createShareLink = () => {
    const payload: PublicAuditPayload = {
      generatedAt: new Date().toISOString(),
      teamSize,
      useCase,
      totalMonthlySavings: audit.totalMonthlySavings,
      totalAnnualSavings: audit.totalAnnualSavings,
      summary,
      perTool: audit.perTool.map((entry) => ({
        tool: entry.tool,
        currentPlan: entry.currentPlan,
        recommendedPlan: entry.recommendedPlan,
        currentSpend: entry.currentSpend,
        savings: entry.savings,
        reason: entry.reason,
        recommendedAction: entry.recommendedAction,
        alternative: entry.alternative,
      })),
    };

    const encoded = encodePayload(payload);
    const url = `${window.location.origin}/share?payload=${encoded}`;
    setShareLink(url);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const submitLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const honeypot = formData.get("website");

    if (honeypot) {
      setLeadStatus("Thanks — your note has been queued.");
      return;
    }

    const body = {
      email: formData.get("email"),
      company: formData.get("company"),
      role: formData.get("role"),
      teamSize: formData.get("teamSize"),
      honeypot: false,
      audit: audit.totalMonthlySavings,
    };

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    setLeadStatus(data.ok ? "Thanks — your confirmation email is on its way." : data.message || "Please try again.");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#111827_0%,_#020617_40%,_#020617_100%)] text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl shadow-emerald-950/20">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Credex • AI Spend Audit</p>
              <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Find the hidden spend in your AI stack in under a minute.</h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-300">Audit seat counts, plan fit, and API usage before the next invoice lands. The tool is designed for founders, finance leads, and engineering managers who want a quick second opinion.</p>
            </div>
            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm text-emerald-100">
              <p className="font-semibold">What this version does</p>
              <ul className="mt-3 space-y-2 text-emerald-50/90">
                <li>• Persistent form state across reloads</li>
                <li>• Public share URL with no personal data</li>
                <li>• AI summary fallback + lead capture</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/30">
            <div className="flex items-center gap-2 text-emerald-300"><Sparkles className="h-5 w-5" /> <span className="text-sm uppercase tracking-[0.35em]">Audit builder</span></div>
            <h2 className="mt-4 text-2xl font-semibold text-white">Input your AI spend</h2>
            <p className="mt-2 text-slate-300">Add one row per tool you currently pay for. The rules are intentionally simple and finance-readable.</p>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-200">
                  Team size
                  <input type="number" min="1" value={teamSize} onChange={(event) => setTeamSize(Number(event.target.value) || 1)} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-0 transition focus:border-emerald-400" />
                </label>
                <label className="grid gap-2 text-sm text-slate-200">
                  Primary use case
                  <select value={useCase} onChange={(event) => setUseCase(event.target.value as UseCase)} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400">
                    <option value="coding">Coding</option>
                    <option value="writing">Writing</option>
                    <option value="data">Data</option>
                    <option value="research">Research</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </label>
              </div>

              {toolRows.map((row, index) => (
                <article key={`${row.tool}-${index}`} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Tool {index + 1}</p>
                    {toolRows.length > 1 && <button type="button" onClick={() => removeRow(index)} className="text-xs text-rose-300">Remove</button>}
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm text-slate-200">Tool
                      <select value={row.tool} onChange={(event) => updateRow(index, "tool", event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400">
                        {toolCatalog.map((tool) => <option key={tool} value={tool}>{tool}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm text-slate-200">Plan
                      <input value={row.plan} onChange={(event) => updateRow(index, "plan", event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400" />
                    </label>
                    <label className="grid gap-2 text-sm text-slate-200">Monthly spend
                      <input type="number" min="0" value={row.spend} onChange={(event) => updateRow(index, "spend", Number(event.target.value) || 0)} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400" />
                    </label>
                    <label className="grid gap-2 text-sm text-slate-200">Seats
                      <input type="number" min="1" value={row.seats} onChange={(event) => updateRow(index, "seats", Number(event.target.value) || 1)} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400" />
                    </label>
                  </div>
                </article>
              ))}

              <button type="button" onClick={addRow} className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 hover:border-emerald-400 hover:text-emerald-200">Add another tool</button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={handleGenerate} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200">Generate audit</button>
              <button type="button" onClick={() => { setToolRows(defaultRows); setTeamSize(6); setUseCase("mixed"); setShareLink(""); setHasGenerated(false); }} className="rounded-full border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-emerald-200">Reset</button>
            </div>
          </article>

          <aside className="space-y-6">
            <article className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/30">
              <div className="flex items-center gap-2 text-emerald-300"><Workflow className="h-5 w-5" /> <span className="text-sm uppercase tracking-[0.35em]">Audit preview</span></div>
              <p className="mt-4 text-sm text-slate-300">Monthly savings</p>
              <h3 className="mt-2 text-5xl font-semibold text-emerald-300">${audit.totalMonthlySavings.toFixed(2)}</h3>
              <p className="mt-2 text-slate-300">Annualized: ${audit.totalAnnualSavings.toFixed(2)}</p>
              <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-100">{audit.summary}</div>
              <div className="mt-5 text-sm text-slate-300">AI summary source: {summarySource}</div>
              <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">{summary}</div>
            </article>

            <article className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/30">
              <div className="flex items-center gap-2 text-emerald-300"><ShieldCheck className="h-5 w-5" /> <span className="text-sm uppercase tracking-[0.35em]">Why it works</span></div>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li>• Plan fit rules are based on seat count, plan tier, and spend size.</li>
                <li>• API-heavy stacks get a lower-cost alternative recommendation.</li>
                <li>• High-savings cases are surfaced for Credex consultation follow-up.</li>
              </ul>
            </article>
          </aside>
        </section>

        {hasGenerated && (
          <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Per-tool recommendations</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Where the savings are</h2>
                </div>
                <button type="button" onClick={createShareLink} className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20">Share public audit</button>
              </div>
              <div className="mt-6 space-y-4">
                {audit.perTool.map((entry) => (
                  <article key={`${entry.tool}-${entry.currentPlan}`} className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-white">{entry.tool}</p>
                        <p className="mt-1 text-sm text-slate-300">Current plan: {entry.currentPlan} • Current spend: ${entry.currentSpend.toFixed(2)}</p>
                        <p className="mt-2 text-sm text-slate-200">{entry.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Monthly savings</p>
                        <p className="text-2xl font-semibold text-emerald-300">${entry.savings.toFixed(2)}</p>
                        <p className="mt-1 text-xs text-slate-400">{entry.recommendedAction}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/30">
              <div className="flex items-center gap-2 text-emerald-300"><Share2 className="h-5 w-5" /> <span className="text-sm uppercase tracking-[0.35em]">Lead capture</span></div>
              <p className="mt-3 text-slate-300">Email capture only appears after the audit value is displayed, as required for the lead-gen flow.</p>
              <form onSubmit={submitLead} className="mt-6 space-y-4">
                <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
                <input required name="email" type="email" placeholder="Email address" value={leadForm.email} onChange={(event) => setLeadForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400" />
                <input name="company" placeholder="Company" value={leadForm.company} onChange={(event) => setLeadForm((current) => ({ ...current, company: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400" />
                <input name="role" placeholder="Role" value={leadForm.role} onChange={(event) => setLeadForm((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400" />
                <input name="teamSize" type="number" placeholder="Team size" value={leadForm.teamSize} onChange={(event) => setLeadForm((current) => ({ ...current, teamSize: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400" />
                <button type="submit" className="w-full rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300">Send audit confirmation</button>
              </form>
              {leadStatus && <p className="mt-3 text-sm text-emerald-200">{leadStatus}</p>}
              {shareLink && <div className="mt-4 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100"><p>Share URL ready</p><button type="button" onClick={copyShareLink} className="mt-2 rounded-full border border-emerald-400/40 px-3 py-2 text-xs font-semibold text-emerald-50">{copied ? "Copied!" : "Copy public link"}</button></div>}
            </article>
          </section>
        )}
      </div>
    </main>
  );
}