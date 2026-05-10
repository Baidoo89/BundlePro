"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  TrendingUp,
  BarChart3,
  Activity,
  Clock,
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }
  }, [status]);

  if (status === "loading") {
    return <DashboardLayout><div className="text-center py-12">Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Orders"
            value="0"
            icon={BarChart3}
            trend={{ value: 0, isPositive: true }}
          />
          <StatCard
            label="Successful"
            value="0"
            icon={Activity}
            trend={{ value: 0, isPositive: true }}
          />
          <StatCard
            label="Failed"
            value="0"
            icon={TrendingUp}
            trend={{ value: 0, isPositive: false }}
          />
          <StatCard
            label="Avg Processing Time"
            value="--"
            icon={Clock}
          />
        </div>

        {/* Charts (Placeholder) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Orders Over Time
            </h2>
            <div className="h-64 flex items-center justify-center bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-blue-700">Chart coming soon...</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue
            </h2>
            <div className="h-64 flex items-center justify-center bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-blue-700">Chart coming soon...</p>
            </div>
          </div>
        </div>

        {/* Top Packages */}
        <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Packages
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-medium">5GB Bundle</span>
              <span className="text-gray-600 text-sm">No data yet</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-medium">10GB Bundle</span>
              <span className="text-gray-600 text-sm">No data yet</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-medium">100GB Bundle</span>
              <span className="text-gray-600 text-sm">No data yet</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
