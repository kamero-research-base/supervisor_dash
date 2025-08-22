"use client"
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ComingSoonPage() {
    const router = useRouter();
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-50 overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-80 h-80 bg-teal-600 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/5"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* Logo/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-2xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
              Coming Soon
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-300">
            Something amazing is on the way.
          </p>
          <button onClick={() => router.back()} className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-teal-600 bg-white border border-transparent rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
            <i className="bi bi-arrow-left"></i> Go back
          </button>
        </div>
      </div>
    </div>
  );
}