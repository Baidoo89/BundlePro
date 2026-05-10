"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import BatchSummaryPanel from "@/components/BatchSummaryPanel";
import BundleParserForm from "@/components/BundleParserForm";
import DuplicateChecker from "@/components/DuplicateChecker";
import { useBundleStore } from "@/store";
import { formatGHS } from "@/lib/currency";
import { Package, DollarSign, Smartphone } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { totalGigs, totalPrice, itemCount, successMessage, error } =
    useBundleStore();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-6 py-8 text-white shadow-lg sm:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">
              Operations dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Parse, review, calculate, and process bundle batches from one place.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Load a batch, inspect the GB breakdown, check duplicates, and choose between calculate-only or sending clean orders.
            </p>
          </div>
        </section>

        {/* Alerts */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            ✓ {successMessage}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Total Gigs"
            value={totalGigs.toFixed(2)}
            icon={Package}
          />
          <StatCard
            label="Total Price"
            value={formatGHS(totalPrice)}
            icon={DollarSign}
          />
          <StatCard
            label="Order Count"
            value={itemCount}
            icon={Smartphone}
          />
        </div>

        {itemCount > 0 && <BatchSummaryPanel />}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Parser (2 columns) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Parse bundle data
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a pricing list, paste your batch, then review the result before any action.
              </p>
            </div>
            <BundleParserForm />
          </div>

          {/* Recent Stats (1 column) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Quick stats
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-700">Total items</p>
                <p className="mt-2 text-2xl font-bold text-blue-950">
                  {itemCount}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-700">
                  Revenue
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-950">
                  {formatGHS(totalPrice, 0)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-100 p-4">
                <p className="text-sm font-medium text-blue-800">
                  Avg per bundle
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-950">
                  {formatGHS(itemCount > 0 ? totalPrice / itemCount : 0, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate Checker */}
        {itemCount > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Duplicate review and action
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the batch first, then calculate only or process the clean items.
              </p>
            </div>
            <DuplicateChecker />
          </div>
        )}

        {/* Help Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6">
            <h3 className="mb-2 font-semibold text-blue-950">
              How to use
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>1. Paste your bundle data in the text area</li>
              <li>2. Select a pricing list if required</li>
              <li>3. Review calculations and the GB breakdown</li>
              <li>4. Check duplicates and decide the action</li>
              <li>5. Process or calculate only</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6">
            <h3 className="mb-2 font-semibold text-blue-950">
              Data format
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Phone + GBs: &quot;0557574477 5&quot;</li>
              <li>• Phone + GBs text: &quot;0557574477 5GB&quot;</li>
              <li>• Space, comma, or tab separated</li>
              <li>• 10-digit phone numbers only</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
