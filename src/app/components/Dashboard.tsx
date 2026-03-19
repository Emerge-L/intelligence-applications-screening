import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Loader2, Search, CheckCircle, XCircle, Eye, BarChart3, Upload } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';

interface Vacancy {
  id: string;
  title: string;
  organization: string;
}

interface Application {
  id: string;
  vacancyId: string;
  vacancyTitle: string;
  applicantData: {
    fullName: string;
    email: string;
    phone: string;
  };
  matchScore: number;
  status: string;
  submittedAt: string;
  rejectionReasons?: string[];
}

export function Dashboard() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVacancy, setSelectedVacancy] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadData(); }, []);
  useEffect(() => { filterApplications(); }, [applications, selectedVacancy, searchTerm, statusFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const vacanciesData = await api.getVacancies();
      setVacancies(vacanciesData.vacancies ?? []);
      const allApps: Application[] = [];
      for (const vacancy of (vacanciesData.vacancies ?? [])) {
        const appsData = await api.getVacancyApplications(vacancy.id);
        allApps.push(...(appsData.applications ?? []));
      }
      setApplications(allApps);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  function filterApplications() {
    let filtered = [...applications];
    if (selectedVacancy !== 'all') filtered = filtered.filter(a => a.vacancyId === selectedVacancy);
    if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.applicantData.fullName.toLowerCase().includes(term) ||
        a.applicantData.email.toLowerCase().includes(term) ||
        a.id.toLowerCase().includes(term)
      );
    }
    filtered.sort((a, b) => b.matchScore - a.matchScore);
    setFilteredApplications(filtered);
  }

  const stats = {
    total: applications.length,
    qualified: applications.filter(a => a.status === 'qualified').length,
    disqualified: applications.filter(a => a.status === 'disqualified').length,
    averageScore: applications.length > 0
      ? Math.round(applications.reduce((s, a) => s + a.matchScore, 0) / applications.length)
      : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Applications Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Review and manage all job applications across vacancies</p>
      </div>

      {/* Bulk Upload Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">
              Need to upload applications received externally?
            </h3>
            <p className="text-xs sm:text-sm text-blue-700">
              Use bulk upload to screen applications received via email or other channels
            </p>
          </div>
          <Link
            to="/bulk-upload"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm flex-shrink-0"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {[
          { label: 'Total Applications', value: stats.total, icon: BarChart3, color: 'blue' },
          { label: 'Qualified', value: stats.qualified, icon: CheckCircle, color: 'green' },
          { label: 'Disqualified', value: stats.disqualified, icon: XCircle, color: 'red' },
          { label: 'Avg Match Score', value: `${stats.averageScore}%`, icon: BarChart3, color: 'purple' },
        ].map((stat) => {
          const Icon = stat.icon;
          const colors: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            red: 'bg-red-100 text-red-600',
            purple: 'bg-purple-100 text-purple-600',
          };
          const textColors: Record<string, string> = {
            blue: 'text-gray-900',
            green: 'text-green-900',
            red: 'text-red-900',
            purple: 'text-purple-900',
          };
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">{stat.label}</span>
                <div className={`${colors[stat.color]} p-1.5 sm:p-2 rounded-lg flex-shrink-0`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${textColors[stat.color]}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, email or ID..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Vacancy</label>
            <select
              value={selectedVacancy}
              onChange={(e) => setSelectedVacancy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Vacancies</option>
              {vacancies.map(v => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="qualified">Qualified</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications — Card layout on mobile, Table on desktop */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-gray-200">
          {filteredApplications.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500 text-sm">
              No applications found matching your filters
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div key={app.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{app.applicantData.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{app.applicantData.email}</p>
                  </div>
                  {app.status === 'qualified' ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
                      <CheckCircle className="w-3 h-3" /> Qualified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
                      <XCircle className="w-3 h-3" /> Disqualified
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-1">{app.vacancyTitle}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{app.matchScore}%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${app.matchScore >= 70 ? 'bg-green-600' : 'bg-red-500'}`}
                        style={{ width: `${app.matchScore}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    to={`/applications/${app.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 font-medium text-xs"
                  >
                    <Eye className="w-3 h-3" /> View
                  </Link>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(app.submittedAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Applicant', 'Vacancy', 'Match Score', 'Status', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No applications found matching your filters
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{app.applicantData.fullName}</div>
                      <div className="text-sm text-gray-500">{app.applicantData.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">{app.vacancyTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{app.matchScore}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${app.matchScore >= 70 ? 'bg-green-600' : 'bg-red-500'}`}
                            style={{ width: `${app.matchScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {app.status === 'qualified' ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Qualified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                          <XCircle className="w-3 h-3" /> Disqualified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Links */}
      {vacancies.length > 0 && (
        <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h3 className="font-semibold text-blue-900 mb-3 sm:mb-4 text-sm sm:text-base">Vacancy Analytics</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {vacancies.map(v => (
              <Link
                key={v.id}
                to={`/analytics/${v.id}`}
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-300 text-xs sm:text-sm"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                {v.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}