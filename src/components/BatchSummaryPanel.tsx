"use client";

import React, { useMemo } from "react";
import { useBundleStore } from "@/store";
import { formatGHS } from "@/lib/currency";
import { BarChart3, CheckCircle2, ListChecks, AlertTriangle } from "lucide-react";

export default function BatchSummaryPanel() {
  const { parsedBundles, cleanBundles, flaggedBundles, lastBreakdown, totalGigs, totalPrice, itemCount } = useBundleStore();

  const breakdown = useMemo(() => [...lastBreakdown].sort((a, b) => a.gigAmount - b.gigAmount), [lastBreakdown]);

  const repeatedInPaste = useMemo(() => {
    const counts = new Map<string, number>();
    for (const bundle of parsedBundles) {
      counts.set(bundle.phoneNumber, (counts.get(bundle.phoneNumber) || 0) + 1);
    }

    return Array.from(counts.values()).filter((count) => count > 1).length;
  }, [parsedBundles]);

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Batch summary</p>
          <h3 className="text-xl font-semibold text-slate-900">How this paste breaks down</h3>
          <p className="mt-1 text-sm text-slate-600">
            Useful for quick validation before calculating or processing bundles.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-sm text-blue-800">
          <BarChart3 size={16} />
          {breakdown.length} GB tiers
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <ListChecks size={16} /> Parsed
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{parsedBundles.length}</p>
          <p className="text-xs text-slate-500">Rows detected from the paste</p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} /> Clean
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{cleanBundles.length}</p>
          <p className="text-xs text-slate-500">Ready for calculation or sending</p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <AlertTriangle size={16} /> Flagged
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{flaggedBundles.length}</p>
          <p className="text-xs text-slate-500">Duplicates or recent repeats</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <BarChart3 size={16} /> Totals
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatGHS(totalPrice)}</p>
          <p className="text-xs text-slate-500">{totalGigs.toFixed(2)} GB across {itemCount} rows</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">GB breakdown</p>
            <p className="text-xs text-slate-500">Counts and contribution to the total</p>
          </div>
          <div className="space-y-3">
            {breakdown.map((item) => (
              <div key={item.gigAmount} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.gigAmount} GB</p>
                    <p className="text-xs text-slate-500">{item.count} items</p>
                  </div>
                  <p className="font-semibold text-blue-700">{formatGHS(item.total)}</p>
                </div>
              </div>
            ))}
            {breakdown.length === 0 && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-500">
                No pricing breakdown available for this batch yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Duplicate notes</p>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium text-slate-900">Repeated phone numbers</p>
              <p className="mt-1">{repeatedInPaste} phone numbers appeared more than once in the same paste.</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-blue-900">
              <p className="font-medium">Processing rule</p>
              <p className="mt-1">The first occurrence is kept; later repeats are flagged so bulk handling stays accurate.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
