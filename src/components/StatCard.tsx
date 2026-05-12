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
    <div className="bg-white rounded-lg sm:rounded-xl border border-blue-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600">{label}</p>
          {loading ? (
            <div className="mt-2 h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-20 sm:w-24" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-blue-950 mt-1 sm:mt-2 break-words">{value}</p>
          )}
          {trend && (
            <p
              className={`text-xs mt-1 sm:mt-2 font-medium ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "+" : ""}{trend.value}% from last period
            </p>
          )}
        </div>
        <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
          <Icon size={20} className="sm:w-6 sm:h-6 text-blue-700" />
        </div>
      </div>
    </div>
  );
}
