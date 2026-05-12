"use client";

import React, { useEffect, useState } from "react";
import { useBundleStore } from "@/store";

interface ParseResult {
  bundles: Array<{ phoneNumber: string; gigAmount: number }>;
  calculationsRaw?: {
    totalGigs: number;
    totalPrice: number;
    itemCount: number;
    averagePrice: number;
  };
  calculations: {
    totalGigs: string;
    totalPrice: string;
    itemCount: string;
    averagePrice: string;
    breakdown: Array<{ gigAmount: number; count: number; total: number }>;
  };
  parseErrors: Array<{ line: string; reason: string }>;
  pricingWarnings?: Array<{ gigAmount: number; count: number; lines: Array<{ phoneNumber: string; gigAmount: number }> }>;
  missingPricingCount?: number;
}

type PricingCollection = { id: string; name: string; isActive: boolean };

export default function BundleParserForm() {
  const [rawText, setRawText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [pricingCollections, setPricingCollections] = useState<PricingCollection[]>([]);
  const [pricingWarnings, setPricingWarnings] = useState<Array<{ gigAmount: number; count: number; lines: Array<{ phoneNumber: string; gigAmount: number }> }>>([]);

  const {
    setParsedBundles,
    setLastBreakdown,
    setTotals,
    setLoading,
    setError,
    setSuccess,
    lastBreakdown,
    selectedPricingCollectionId,
    selectedPricingCollectionName,
    setSelectedPricingCollection,
  } = useBundleStore();

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const response = await fetch("/api/pricing/collections");
        const data = await response.json();
        if (data.success) {
          const collections = data.collections || [];
          setPricingCollections(collections);

          if (!selectedPricingCollectionId) {
            const activeCollection = collections.find((item: PricingCollection) => item.isActive);
            if (activeCollection) {
              setSelectedPricingCollection(activeCollection.id, activeCollection.name);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load pricing collections", error);
      }
    };

    loadCollections();
  }, [selectedPricingCollectionId, setSelectedPricingCollection]);

  const handleParse = async () => {
    if (!rawText.trim()) {
      setError("Please enter some data to parse");
      return;
    }

    setIsLoading(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bundles/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, pricingCollectionId: selectedPricingCollectionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Parse failed");
      }

      const data: ParseResult = await response.json();

      setParsedBundles(data.bundles);
      setTotals(
        Number(data.calculationsRaw?.totalGigs ?? data.calculations.totalGigs),
        Number(data.calculationsRaw?.totalPrice ?? data.calculations.totalPrice),
        Number(data.calculationsRaw?.itemCount ?? data.calculations.itemCount)
      );
      setLastBreakdown(data.calculations.breakdown || []);
      setPricingWarnings(data.pricingWarnings || []);
      
      let successMsg = `Successfully parsed ${data.bundles.length} bundles!`;
      if ((data.missingPricingCount ?? 0) > 0) {
        successMsg += ` (${data.missingPricingCount} skipped - missing pricing)`;
      }
      setSuccess(successMsg);
      setShowErrors((data.parseErrors || []).length > 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRawText("");
    setShowErrors(false);
    setLastBreakdown([]);
    setPricingWarnings([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pricing List</label>
        <select
          value={selectedPricingCollectionId || ""}
          onChange={(e) => {
            const selected = pricingCollections.find((item) => item.id === e.target.value);
            setSelectedPricingCollection(selected?.id || null, selected?.name || null);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Use active/default list</option>
          {pricingCollections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}{collection.isActive ? " (active)" : ""}
            </option>
          ))}
        </select>
        {selectedPricingCollectionName && (
          <p className="mt-1 text-xs text-gray-500">Selected: {selectedPricingCollectionName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Paste Your Data</label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste phone numbers and gig amounts here...\nExample:\n0557574477 5GB\n0557574477 5\n08012345678 10"
          className="w-full h-40 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: &quot;0557574477 5GB&quot;, &quot;0557574477 5&quot;, &quot;0557574477 5 GB&quot;
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleParse}
          disabled={isLoading || !rawText.trim()}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-gray-300 transition"
        >
          {isLoading ? "Parsing..." : "Parse Data"}
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Clear
        </button>
      </div>

      {lastBreakdown.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-900">Breakdown by GB</p>
            <p className="text-xs text-blue-700">Counts and totals that make up the grand total</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lastBreakdown.map((item) => (
              <div key={item.gigAmount} className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                <p className="text-sm font-medium text-blue-900">{item.gigAmount} GB</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{item.count} orders</p>
                <p className="text-xs text-gray-600">Contribution: {item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showErrors && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800">⚠️ Some lines couldn&apos;t be parsed</p>
          <p className="text-xs text-yellow-700 mt-1">Check the format of your data</p>
        </div>
      )}

      {pricingWarnings.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">🚫 Missing Pricing Entries</p>
          <p className="text-xs text-red-700 mt-2 mb-3">These gig amounts are NOT in your pricing list and were skipped:</p>
          <div className="space-y-2">
            {pricingWarnings.map((warning) => (
              <div key={warning.gigAmount} className="text-xs text-red-700 bg-white rounded p-2">
                <p className="font-medium">{warning.gigAmount} GB - {warning.count} order(s)</p>
                <p className="text-red-600 mt-1">
                  Phones: {warning.lines.slice(0, 3).map(l => l.phoneNumber).join(", ")}
                  {warning.lines.length > 3 ? ` +${warning.lines.length - 3} more` : ""}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-700 mt-3">👉 Add these gig amounts to your pricing table to include them in calculations.</p>
        </div>
      )}
    </div>
  );
}
