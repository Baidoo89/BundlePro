"use client";

import React, { useState } from "react";
import { useBundleStore } from "@/store";
import { AlertCircle, CheckCircle } from "lucide-react";

interface DuplicateCheckResponse {
  cleanOrders: Array<{ phoneNumber: string; gigAmount: number }>;
  flaggedDuplicates: Array<{
    phoneNumber: string;
    count: number;
    type: "same_paste" | "last_24h" | "both";
    lastServedAt?: string;
  }>;
  statistics: {
    totalItems: number;
    cleanItems: number;
    duplicateItems: number;
    duplicateCount: number;
  };
}

export default function DuplicateChecker() {
  const {
    parsedBundles,
    cleanBundles,
    setCleanBundles,
    setFlaggedBundles,
    setLoading,
    setError,
    setSuccess,
    selectedPricingCollectionId,
  } = useBundleStore();

  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<DuplicateCheckResponse | null>(null);
  const [provider, setProvider] = useState("MTN");
  const [calculateOnly, setCalculateOnly] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPricingLabel = selectedPricingCollectionId ? "Selected pricing list" : "Active/default pricing list";

  const handleCheckDuplicates = async () => {
    if (parsedBundles.length === 0) {
      setError("Please parse data first");
      return;
    }

    setIsChecking(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bundles/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundles: parsedBundles }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Check failed");
      }

      const data: DuplicateCheckResponse = await response.json();

      setCheckResults(data);
      setCleanBundles(data.cleanOrders);
      setFlaggedBundles(data.flaggedDuplicates);

      setSuccess(
        `Check complete: ${data.statistics.cleanItems} clean, ${data.statistics.duplicateItems} flagged`
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsChecking(false);
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (checkResults && checkResults.statistics.cleanItems === 0) {
      setError("No clean orders to process");
      return;
    }

    const bundlesToProcess = cleanBundles.length > 0 ? cleanBundles : checkResults?.cleanOrders || [];
    if (bundlesToProcess.length === 0) {
      setError("Please check duplicates first");
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bundles/process-and-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundles: bundlesToProcess,
          provider,
          calculateOnly,
          pricingCollectionId: selectedPricingCollectionId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Processing failed");
      }

      if (calculateOnly) {
        setSuccess(
          `Calculated ${data.calculations.itemCount} bundles. Total: ${data.calculations.totalPrice}`
        );
      } else {
        setSuccess(
          `Processed ${data.successCount} bundles successfully${data.failureCount ? `, ${data.failureCount} failed` : ""}`
        );
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred while processing");
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  if (!checkResults) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Duplicate review</p>
            <h3 className="text-xl font-semibold text-slate-900">Check the batch before processing</h3>
            <p className="mt-1 text-sm text-slate-600">
              Review duplicates, then choose whether to calculate only or send the clean bundles.
            </p>
          </div>
          <button
            onClick={handleCheckDuplicates}
            disabled={isChecking || parsedBundles.length === 0}
            className="inline-flex items-center justify-center rounded-xl bg-warning px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-warning/90 disabled:bg-gray-300"
          >
            {isChecking ? "Checking..." : "Check duplicates"}
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rows loaded</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{parsedBundles.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pricing context</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{selectedPricingLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Action mode</p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {calculateOnly ? "Calculate only" : "Process after review"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Duplicate review completed</p>
          <h3 className="text-xl font-semibold text-slate-900">Batch ready for action</h3>
          <p className="mt-1 text-sm text-slate-600">
            Review the clean items, inspect duplicates, then decide whether to calculate or process.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
          <CheckCircle size={16} /> {selectedPricingLabel}
        </div>
      </div>

      {/* Results Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">Clean orders</p>
          <p className="mt-2 text-2xl font-bold text-emerald-950">{checkResults.statistics.cleanItems}</p>
          <p className="text-xs text-emerald-700">Available for processing or calculation</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-700">Flagged items</p>
          <p className="mt-2 text-2xl font-bold text-rose-950">{checkResults.statistics.duplicateItems}</p>
          <p className="text-xs text-rose-700">Duplicates and recent repeats</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">Total scanned</p>
          <p className="mt-2 text-2xl font-bold text-blue-950">{checkResults.statistics.totalItems}</p>
          <p className="text-xs text-blue-700">Rows reviewed in this batch</p>
        </div>
      </div>

      {/* Flagged Duplicates */}
      {checkResults.flaggedDuplicates.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-rose-200">
          <div className="border-b border-rose-200 bg-rose-50 px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-rose-900">
              <AlertCircle size={20} />
              Flagged duplicates ({checkResults.statistics.duplicateCount})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Phone Number
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Count
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Last Served
                  </th>
                </tr>
              </thead>
              <tbody>
                {checkResults.flaggedDuplicates.slice(0, 50).map((dup, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-900">
                      {dup.phoneNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{dup.count}x</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {dup.type === "same_paste"
                          ? "Same Paste"
                          : dup.type === "last_24h"
                          ? "Last 24h"
                          : "Both"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {dup.lastServedAt
                        ? new Date(dup.lastServedAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {checkResults.flaggedDuplicates.length > 50 && (
            <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Showing 50 of {checkResults.flaggedDuplicates.length} flagged items
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Action controls</p>
          <p className="mt-1 text-sm text-slate-600">Choose how to handle the clean items after review.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="MTN">MTN</option>
                <option value="Airtel">Airtel</option>
                <option value="Glo">Glo</option>
                <option value="Etisalat">Etisalat</option>
              </select>
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-900">
              <input
                type="checkbox"
                checked={calculateOnly}
                onChange={(e) => setCalculateOnly(e.target.checked)}
                className="h-4 w-4 rounded border-blue-300"
              />
              Calculate only, do not send bundles
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">Primary action</p>
          <p className="mt-1 text-sm text-blue-800">
            {calculateOnly
              ? "This will compute totals for the clean items and stop before processing."
              : "This will process the clean orders after the duplicate review."}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleCheckDuplicates}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Re-check
            </button>
            <button
              onClick={handleProcess}
              disabled={(checkResults?.statistics.cleanItems ?? 0) === 0 || isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-success/90 disabled:bg-gray-300"
            >
              <CheckCircle size={18} />
              {isProcessing ? "Working..." : calculateOnly ? "Calculate clean orders" : `Process ${checkResults.statistics.cleanItems} clean orders`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
