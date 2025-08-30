import Link from 'next/link';

interface NavigationProps {
  currentPage?: 'home' | 'upload' | 'meeting';
}

export function Navigation({ currentPage = 'home' }: NavigationProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              🧠 Smart Meeting Hub
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link 
                href="/"
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'home' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/upload"
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'upload' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upload
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Recording
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}