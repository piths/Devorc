import React from "react";
import { AuthGuard } from "@/components/auth-guard";
import { OverviewClient } from "./overview-client";

function OverviewLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-lg text-gray-600">Loading overview...</p>
        <p className="text-sm text-gray-500">Verifying authentication</p>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  // Temporarily bypass AuthGuard to test overview content
  return <OverviewClient />;
}

export const metadata = {
  title: "Overview - Devorc Suite",
  description: "High-level overview of the platform modules and navigation",
};

