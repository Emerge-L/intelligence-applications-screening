import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, Upload, Menu, X, Home } from 'lucide-react';
import emergeLogo from '../assets/logo.png';

export function Root() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/vacancies', label: 'Vacancies', icon: Briefcase, exact: false },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: false },
    { to: '/bulk-upload', label: 'Bulk Upload', icon: Upload, exact: false },
  ];

  const isLinkActive = (link: typeof navLinks[0]) => {
    if (link.exact) return location.pathname === link.to;
    if (link.to === '/vacancies') return location.pathname.startsWith('/vacancies') || location.pathname.startsWith('/apply');
    if (link.to === '/dashboard') return location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/applications');
    return location.pathname.startsWith(link.to);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ───────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 min-w-0"
              onClick={() => setMenuOpen(false)}
            >
              <img src={emergeLogo} alt="Emerge Livelihoods" className="h-8 sm:h-10 flex-shrink-0" />
              <div className="border-l-2 border-gray-300 pl-2 sm:pl-3 min-w-0">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-[#3B4167] leading-tight truncate">
                  Intelligent Screening Platform
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#4C808A]/10 text-[#4C808A]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#4C808A]/10 text-[#4C808A]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main>
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center text-xs sm:text-sm text-gray-500">
            <p>&copy; 2026 Emerge Livelihoods &amp; Emerge Fund. All rights reserved.</p>
            <p className="mt-1">Intelligent Application Screening Platform</p>
          </div>
        </div>
      </footer>

    </div>
  );
}