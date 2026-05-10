"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BarChart3, Lock, Zap } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      redirect("/dashboard");
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div
            role="status"
            aria-label="Loading"
            className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"
          />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-blue-800 to-indigo-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 sm:backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white">BundlePro</h1>
          <div className="hidden sm:flex space-x-4">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-gray-50 transition text-sm"
            >
              Get Started
            </Link>
          </div>
          <div className="sm:hidden">
            <Link
              href="/auth/signup"
              className="px-3 py-2 bg-white text-primary rounded-lg font-medium text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center text-white space-y-5 mb-12">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Automate Your Data Bundle Distribution
          </h2>
          <p className="text-base sm:text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            BundlePro helps you manage, process, and automate data bundle
            distribution at scale with built-in duplicate detection and pricing
            management.
          </p>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Get Started Free <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 md:mt-24">
          <div className="bg-white/10 sm:backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/20 hover:bg-white/15 transition">
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Smart Parsing
            </h3>
            <p className="text-blue-100">
              Automatically parse phone numbers and gig amounts from any text
              format with AI-powered regex extraction.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:bg-white/15 transition">
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Real-time Analytics
            </h3>
            <p className="text-blue-100">
              Get instant insights into total gigs, revenue, and order counts
              with beautiful dashboards.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:bg-white/15 transition">
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Lock size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Duplicate Detection
            </h3>
            <p className="text-blue-100">
              Automatically detect duplicates in your paste and check against
              last 24 hours of processed orders.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-12 md:mt-24 bg-white/10 sm:backdrop-blur-sm rounded-xl p-6 md:p-12 border border-white/20">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">
            Everything You Need
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ul className="space-y-4 text-blue-100">
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">✓</span>
                <span>Custom pricing tables for unlimited gig amounts</span>
              </li>
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">✓</span>
                <span>Multiple VTU provider API integrations</span>
              </li>
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">✓</span>
                <span>Bulk order processing with instant feedback</span>
              </li>
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">✓</span>
                <span>Mobile-responsive modern UI</span>
              </li>
            </ul>
            <ul className="space-y-4 text-blue-100">
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">✓</span>
                <span>Handles millions of orders efficiently</span>
              </li>
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">✓</span>
                <span>Secure authentication with NextAuth.js</span>
              </li>
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">✓</span>
                <span>Complete order history and analytics</span>
              </li>
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">✓</span>
                <span>Real-time notifications and logging</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 backdrop-blur-sm mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-blue-100">
          <p>© 2024 BundlePro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
