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
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      setSidebarOpen(!isMobileView);

      const handleResize = () => {
        const newIsMobile = window.innerWidth < 768;
        setIsMobile(newIsMobile);
        setSidebarOpen(!newIsMobile);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/orders", label: "Orders", icon: FileText },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Sidebar - Hidden on mobile unless open */}
      <div
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : `w-64`
        } bg-blue-950 border-r border-blue-900 flex flex-col shadow-xl`}
      >
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-blue-900">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-bold text-blue-100">BundlePro</h1>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-blue-900 rounded-lg transition"
              >
                <X size={20} className="text-blue-100" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition text-sm sm:text-base ${
                isActive(href) && !isActive("/dashboard/settings")
                  ? "bg-blue-600 text-white"
                  : "text-blue-100 hover:bg-blue-900"
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 sm:p-4 border-t border-blue-900 space-y-2">
          {session?.user && (
            <div className="p-2 sm:p-3 bg-blue-900 rounded-lg hidden sm:block">
              <p className="text-xs text-blue-200">Logged in as</p>
              <p className="text-xs sm:text-sm font-medium text-blue-50 truncate">
                {session.user.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-100 text-blue-900 rounded-lg hover:bg-blue-200 transition text-sm sm:text-base font-medium"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <div className="bg-white/95 border-b border-blue-100 px-3 sm:px-6 py-3 sm:py-4 shadow-sm backdrop-blur-sm flex items-center justify-between">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-blue-100 rounded-lg transition mr-2"
            >
              <Menu size={24} className="text-blue-900" />
            </button>
          )}
          <h2 className="text-base sm:text-lg font-semibold text-blue-900">
            {pathname === "/dashboard" && "Dashboard"}
            {pathname === "/dashboard/orders" && "Orders"}
            {pathname === "/dashboard/analytics" && "Analytics"}
            {pathname === "/dashboard/settings" && "Settings"}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
