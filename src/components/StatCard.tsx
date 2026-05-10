"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  loading = false,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse w-24" />
          ) : (
            <p className="text-3xl font-bold text-blue-950 mt-2">{value}</p>
          )}
          {trend && (
            <p
              className={`text-xs mt-2 font-medium ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "+" : ""}{trend.value}% from last period
            </p>
          )}
        </div>
        <div className="bg-blue-100 p-3 rounded-lg">
          <Icon size={24} className="text-blue-700" />
        </div>
      </div>
    </div>
  );
}
