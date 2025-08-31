"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-100 rounded-full">
            <i className="bi bi-exclamation-triangle text-teal-600 text-5xl"></i>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
          >
            <i className="bi bi-arrow-left"></i>
            Go Back
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center gap-2"
          >
            <i className="bi bi-house"></i>
            Back to Dashboard
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-400">
          Need help? <Link href="https://www.kamero.rw/~/help" className="text-teal-600 hover:text-teal-700 font-medium">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}