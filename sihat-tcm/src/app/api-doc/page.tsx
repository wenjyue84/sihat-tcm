"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

/**
 * API Documentation Page
 *
 * Renders the Swagger UI for interactive API documentation.
 * Visit http://localhost:3100/api-doc to view the API docs.
 */
export default function ApiDocPage() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the OpenAPI spec from the API endpoint
    fetch("/api/doc")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load API spec: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
          <p className="text-lg text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 text-center text-6xl">⚠️</div>
          <h1 className="mb-2 text-xl font-bold text-gray-900">Error Loading Documentation</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            🌿 Sihat TCM API Documentation
          </h1>
          <p className="mt-2 text-gray-600">
            Interactive API documentation for the Sihat TCM platform
          </p>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-white shadow-lg overflow-hidden">
          {spec && <SwaggerUI spec={spec} />}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pb-8 text-center text-sm text-gray-500">
        <p>
          Made with 💚 by the Sihat TCM Team | Version{" "}
          {(((spec as Record<string, unknown>)?.info as Record<string, unknown>)
            ?.version as string) || "1.0.0"}
        </p>
      </div>
    </div>
  );
}
