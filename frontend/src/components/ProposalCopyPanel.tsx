"use client";

import React, { useState } from "react";
import { PROPOSAL_SECTIONS } from "@/data/proposalSections";
import { Copy, Check, FileCheck2 } from "lucide-react";

export default function ProposalCopyPanel() {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2200);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h2 className="text-base font-bold text-emerald-50">
              NESFIC-D-15 Proposal Form Copy-Paste Helper
            </h2>
            <p className="text-xs text-emerald-200/70">
              Plain-text entries with all markup characters (&lt; and &gt;) replaced by &ldquo;Smaller than&rdquo; and &ldquo;Greater Than&rdquo;. Ready for portal textareas.
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          12 / 12 Sections Ready (≤ 500 words each)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PROPOSAL_SECTIONS.map((sec) => {
          const isCopied = copiedId === sec.id;
          return (
            <div
              key={sec.id}
              className="rounded-xl border border-[#1e3328] bg-[#101b15] p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#1e3328] pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-emerald-50">{sec.title}</h3>
                  <span className="text-[11px] text-emerald-300/80">
                    {sec.wordCount} / 500 words · 0 markup characters
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(sec.id, sec.content)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                    isCopied
                      ? "bg-emerald-400 text-slate-950"
                      : "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Text
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                aria-label={sec.title}
                rows={8}
                value={sec.content}
                onClick={(e) => e.currentTarget.select()}
                className="w-full rounded-lg border border-[#1e3328] bg-[#09110d] p-3 text-xs leading-relaxed text-emerald-100/90 focus:border-emerald-500 focus:outline-none resize-y"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
