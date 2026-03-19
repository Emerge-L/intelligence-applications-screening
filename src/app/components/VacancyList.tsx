import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Briefcase, MapPin, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';

interface Vacancy {
  id: string;
  title: string;
  organization: string;
  location: string;
  closing_date?: string;   // from DB (snake_case)
  closingDate?: string;    // legacy camelCase fallback
  reports_to?: string;
  reportsTo?: string;
  status: string;
  minimum_experience?: number;
  minimumExperience?: number;
}

// Normalise either shape into one consistent object
function normalise(v: Vacancy) {
  return {
    ...v,
    closingDate: v.closing_date ?? v.closingDate ?? '',
    reportsTo: v.reports_to ?? v.reportsTo ?? '',
    minimumExperience: v.minimum_experience ?? v.minimumExperience ?? 0,
  };
}

export function VacancyList() {
  const [vacancies, setVacancies] = useState<ReturnType<typeof normalise>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVacancies();
  }, []);

  async function loadVacancies() {
    try {
      setLoading(true);
      const data = await api.getVacancies();
      setVacancies((data.vacancies ?? []).map(normalise));
    } catch (error) {
      console.error('Error loading vacancies:', error);
      toast.error('Failed to load vacancies. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#4C808A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Open Vacancies</h1>
        <p className="text-gray-600">
          Browse and apply for available positions at Emerge Livelihoods and Emerge Fund
        </p>
      </div>

      {vacancies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No vacancies available</h3>
          <p className="text-gray-600">
            There are currently no open positions. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {vacancies.map((vacancy) => (
            <div
              key={vacancy.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{vacancy.title}</h2>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                      {vacancy.status}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium">{vacancy.organization}</p>
                </div>
                <Link
                  to={`/apply/${vacancy.id}`}
                  className="bg-[#4C808A] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#3B6570] transition-colors flex items-center gap-2 flex-shrink-0 ml-4"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{vacancy.location}</span>
                </div>
                {vacancy.closingDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Closes: {new Date(vacancy.closingDate).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {vacancy.reportsTo && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">Reports to: {vacancy.reportsTo}</span>
                  </div>
                )}
              </div>

              {vacancy.minimumExperience > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>Minimum Experience Required:</strong> {vacancy.minimumExperience} years of qualifying work experience
                    <span className="block mt-1 text-xs">
                      (Internships, attachments, and volunteer roles are excluded from experience calculation)
                    </span>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Link
                  to={`/analytics/${vacancy.id}`}
                  className="text-[#4C808A] font-semibold text-sm hover:text-[#3B6570] flex items-center gap-1"
                >
                  View Analytics
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}