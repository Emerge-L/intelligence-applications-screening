import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FileSearch, Target, TrendingUp, UserCheck, ArrowRight, Zap, Shield, BarChart, LayoutDashboard, Loader2, Calendar, MapPin, Briefcase } from 'lucide-react';
import { api } from '../utils/api';

interface Vacancy {
  id: string;
  title: string;
  organization: string;
  location: string;
  closing_date?: string;
  closingDate?: string;
  status: string;
}

function getClosingDate(v: Vacancy): string {
  return v.closing_date ?? v.closingDate ?? '';
}

export function Home() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVacancies()
      .then((data) => setVacancies(data.vacancies ?? []))
      .catch(() => setVacancies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-[#4C808A] p-4 rounded-2xl">
              <FileSearch className="w-16 h-16 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Intelligent Application Screening Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Streamlined recruitment for Emerge Livelihoods &amp; Emerge Fund positions
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/vacancies"
              className="inline-flex items-center gap-2 bg-[#4C808A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#3B6570] transition-colors"
            >
              View Open Positions
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-[#4C808A] px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-[#4C808A]"
            >
              Admin Dashboard
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Automated Screening Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our AI-powered platform streamlines the recruitment process with intelligent automation
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

            <div className="bg-gradient-to-br from-[#4C808A]/10 to-[#4C808A]/20 p-6 rounded-xl">
              <div className="bg-[#4C808A] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Smart Knockout Questions</h3>
              <p className="text-sm text-gray-600">
                Automatic disqualification based on predefined criteria answered at point of application.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
              <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Screening</h3>
              <p className="text-gray-600 text-sm">
                Claude AI parses every CV, extracts structured data, and calculates match scores automatically.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gap Analysis</h3>
              <p className="text-gray-600 text-sm">
                Detailed explanations for every decision with specific reason tags and strength summaries.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
              <div className="bg-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics &amp; Reporting</h3>
              <p className="text-gray-600 text-sm">
                Comprehensive dashboards with disqualification funnels and talent quality reports.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Active Vacancies (dynamic from DB) ───────────── */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Active Vacancies</h2>
            <p className="text-lg text-gray-600">
              Currently screening applications for these positions
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#4C808A] animate-spin" />
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No active vacancies at the moment. Check back soon.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {vacancies.map((vacancy) => {
                const closing = getClosingDate(vacancy);
                return (
                  <div
                    key={vacancy.id}
                    className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {vacancy.title}
                        </h3>
                        <p className="text-sm text-gray-600">{vacancy.organization}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full capitalize flex-shrink-0 ml-3">
                        {vacancy.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{vacancy.location}</span>
                      </div>
                      {closing && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Closing: {new Date(closing).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <Link
                        to={`/analytics/${vacancy.id}`}
                        className="text-gray-500 text-sm hover:text-[#4C808A] transition-colors"
                      >
                        View Analytics
                      </Link>
                      <Link
                        to={`/apply/${vacancy.id}`}
                        className="text-[#4C808A] font-semibold text-sm hover:text-[#3B6570] flex items-center gap-1"
                      >
                        Apply Now
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────── */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">
              From application to decision in a few automated steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Application</h3>
              <p className="text-gray-600 text-sm">
                Candidates apply online, answer knockout questions, and paste their CV content.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Screening</h3>
              <p className="text-gray-600 text-sm">
                Claude AI parses the CV, validates qualifying experience, and calculates a match score against vacancy requirements.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Results</h3>
              <p className="text-gray-600 text-sm">
                Immediate qualified or disqualified decision with detailed reasons and a strengths summary for every applicant.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Internship Rule Notice ────────────────────────── */}
      <div className="bg-amber-50 border-t border-amber-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3 max-w-3xl mx-auto text-center justify-center">
            <div>
              <p className="text-sm text-amber-800">
                <strong>Note on Experience:</strong> Internships, attachments, industrial placements,
                and volunteer roles are automatically excluded from the qualifying experience calculation.
                Only substantive paid employment counts toward experience thresholds.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
