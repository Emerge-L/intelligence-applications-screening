import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Loader2, ArrowLeft, TrendingUp, Users, XCircle, Award, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '../utils/api';
import { toast } from 'sonner';

interface Vacancy {
  title: string;
  organization: string;
}

interface Analytics {
  totalApplications: number;
  qualified: number;
  disqualified: number;
  averageMatchScore: number;
  rejectionReasons: Record<string, number>;
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
  topCandidates: Array<{
    id: string;
    name: string;
    matchScore: number;
    email: string;
  }>;
}

const COLORS = ['#10b981', '#ef4444'];
const SCORE_COLORS = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#10b981'];

export function Analytics() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [vacancyId]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load vacancy details
      const vacancyData = await api.getVacancy(vacancyId!);
      setVacancy(vacancyData.vacancy);

      // Load analytics
      const analyticsData = await api.getVacancyAnalytics(vacancyId!);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!vacancy || !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Data Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-red-700 font-semibold hover:text-red-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Qualified', value: analytics.qualified },
    { name: 'Disqualified', value: analytics.disqualified },
  ];

  const rejectionData = Object.entries(analytics.rejectionReasons).map(([reason, count]) => ({
    reason: reason.length > 50 ? reason.substring(0, 50) + '...' : reason,
    count,
  })).sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{vacancy.title}</h1>
        <p className="text-gray-600">{vacancy.organization} - Analytics Report</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Applications</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalApplications}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Qualified</span>
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">{analytics.qualified}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.totalApplications > 0
              ? ((analytics.qualified / analytics.totalApplications) * 100).toFixed(1)
              : 0}% of total
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Disqualified</span>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-900">{analytics.disqualified}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.totalApplications > 0
              ? ((analytics.disqualified / analytics.totalApplications) * 100).toFixed(1)
              : 0}% of total
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Match Score</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">{analytics.averageMatchScore}%</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Qualification Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Qualification Status</h2>
          {analytics.totalApplications > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Score Distribution</h2>
          {analytics.scoreDistribution.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {analytics.scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SCORE_COLORS[index % SCORE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Disqualification Funnel */}
      {rejectionData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Disqualification Funnel - Top Rejection Reasons
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={rejectionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="reason" type="category" width={250} />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Candidates */}
      {analytics.topCandidates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Qualified Candidates</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Match Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.topCandidates.map((candidate, index) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{candidate.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {candidate.matchScore}%
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${candidate.matchScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/applications/${candidate.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights */}
      {analytics.totalApplications > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Key Insights
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              • <strong>Talent Quality:</strong> The average match score of {analytics.averageMatchScore}% 
              {analytics.averageMatchScore >= 70
                ? ' indicates a strong applicant pool with many qualified candidates.'
                : ' suggests that many applicants may not fully meet the job requirements.'
              }
            </li>
            <li>
              • <strong>Qualification Rate:</strong>{' '}
              {((analytics.qualified / analytics.totalApplications) * 100).toFixed(1)}% of applicants qualified.
              {analytics.qualified / analytics.totalApplications < 0.3
                ? ' Consider reviewing if requirements are too strict or if the job description needs broader appeal.'
                : ' This indicates a good match between requirements and the applicant pool.'
              }
            </li>
            {rejectionData.length > 0 && (
              <li>
                • <strong>Top Disqualification Reason:</strong> "{rejectionData[0].reason}" eliminated{' '}
                {rejectionData[0].count} applicants (
                {((rejectionData[0].count / analytics.disqualified) * 100).toFixed(1)}% of disqualified).
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
