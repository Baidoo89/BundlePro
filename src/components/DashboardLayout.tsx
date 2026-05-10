"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Menu,
  X,
  BarChart3,
  Settings,
  LogOut,
  Home,
  FileText,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-blue-950 border-r border-blue-900 transition-all duration-300 flex flex-col shadow-xl`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-900">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-blue-100">BundlePro</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-blue-900 rounded-lg transition"
            >
              {sidebarOpen ? (
                <X size={20} className="text-blue-100" />
              ) : (
                <Menu size={20} className="text-blue-100" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <Link
            href="/dashboard"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              isActive("/dashboard") && !isActive("/dashboard/settings")
                ? "bg-blue-600 text-white"
                : "text-blue-100 hover:bg-blue-900"
            }`}
          >
            <Home size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </Link>

          <Link
            href="/dashboard/orders"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              isActive("/dashboard/orders")
                ? "bg-blue-600 text-white"
                : "text-blue-100 hover:bg-blue-900"
            }`}
          >
            <FileText size={20} />
            {sidebarOpen && <span>Orders</span>}
          </Link>

          <Link
            href="/dashboard/analytics"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              isActive("/dashboard/analytics")
                ? "bg-blue-600 text-white"
                : "text-blue-100 hover:bg-blue-900"
            }`}
          >
            <BarChart3 size={20} />
            {sidebarOpen && <span>Analytics</span>}
          </Link>

          <Link
            href="/dashboard/settings"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              isActive("/dashboard/settings")
                ? "bg-blue-600 text-white"
                : "text-blue-100 hover:bg-blue-900"
            }`}
          >
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </Link>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-blue-900">
          {sidebarOpen && session?.user && (
            <div className="mb-3 p-3 bg-blue-900 rounded-lg">
              <p className="text-xs text-blue-200">Logged in as</p>
              <p className="text-sm font-medium text-blue-50 truncate">
                {session.user.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-lg hover:bg-blue-200 transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white/95 border-b border-blue-100 px-6 py-4 shadow-sm backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-blue-900">
            {pathname === "/dashboard" && "Dashboard"}
            {pathname === "/dashboard/orders" && "Orders"}
            {pathname === "/dashboard/analytics" && "Analytics"}
            {pathname === "/dashboard/settings" && "Settings"}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
