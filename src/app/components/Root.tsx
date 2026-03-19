import { Outlet, Link, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, Upload } from 'lucide-react';
import emergeLogo from '../assets/logo.png';

export function Root() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src={emergeLogo} alt="Emerge Livelihoods" className="h-10" />
              <div className="border-l-2 border-gray-300 pl-3">
                <h1 className="text-lg font-bold text-[#3B4167]">Intelligent Screening Platform</h1>
              </div>
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') && location.pathname === '/'
                    ? 'bg-[#4C808A]/10 text-[#4C808A]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Home
              </Link>
              
              <Link
                to="/vacancies"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/vacancies') || isActive('/apply')
                    ? 'bg-[#4C808A]/10 text-[#4C808A]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Vacancies
              </Link>
              
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard') || isActive('/applications')
                    ? 'bg-[#4C808A]/10 text-[#4C808A]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                to="/bulk-upload"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/bulk-upload')
                    ? 'bg-[#4C808A]/10 text-[#4C808A]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Upload className="w-4 h-4" />
                Bulk Upload
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2026 Emerge Livelihoods & Emerge Fund. All rights reserved.</p>
            <p className="mt-1">Intelligent Application Screening Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}