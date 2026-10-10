import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  useEffect(() => {
    document.title = '404 | NFL Hub';
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-8xl font-black text-blue-600 tracking-tighter mb-4">404</h1>
      <p className="text-2xl font-semibold text-gray-200 mb-8">Page not found</p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 transition font-medium"
      >
        Return Home
      </Link>
    </div>
  );
}
