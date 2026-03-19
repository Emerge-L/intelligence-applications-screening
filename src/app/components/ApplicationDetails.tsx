import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Loader2, ArrowLeft, CheckCircle, XCircle, User, Mail, Phone, Calendar, Award, Briefcase } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';

interface Application {
  id: string;
  vacancyTitle: string;
  applicantData: {
    fullName: string;
    email: string;
    phone: string;
  };
  matchScore: number;
  status: string;
  submittedAt: string;
  knockoutAnswers: string[];
  qualifyingExperience: number;
  parsedCV: {
    education: string[];
    skills: string[];
    workHistory: Array<{
      title: string;
      duration: string;
      isInternship: boolean;
    }>;
  };
  scoringBreakdown: Array<{
    criterion: string;
    score: number;
    maxScore: number;
  }>;
  rejectionReasons?: string[];
  strengthsSummary?: string[];
  cvText: string;
}

export function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplication();
  }, [id]);

  async function loadApplication() {
    try {
      setLoading(true);
      const data = await api.getApplication(id!);
      setApplication(data.application);
    } catch (error) {
      console.error('Error loading application:', error);
      toast.error('Failed to load application details');
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

  if (!application) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Application Not Found</h2>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {application.applicantData.fullName}
            </h1>
            <p className="text-gray-600">{application.vacancyTitle}</p>
          </div>
          <div className="text-right">
            {application.status === 'qualified' ? (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
                <CheckCircle className="w-5 h-5" />
                Qualified
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold">
                <XCircle className="w-5 h-5" />
                Disqualified
              </div>
            )}
          </div>
        </div>

        {/* Match Score */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Overall Match Score</span>
            <span className="text-4xl font-bold text-gray-900">{application.matchScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                application.matchScore >= 70 ? 'bg-green-600' : 'bg-red-600'
              }`}
              style={{ width: `${application.matchScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{application.applicantData.fullName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${application.applicantData.email}`} className="text-blue-600 hover:underline">
                  {application.applicantData.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <a href={`tel:${application.applicantData.phone}`} className="text-blue-600 hover:underline">
                  {application.applicantData.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">
                  Applied: {new Date(application.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Scoring Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Scoring Breakdown</h2>
            <div className="space-y-4">
              {application.scoringBreakdown.map((item, index) => {
                const percentage = (item.score / item.maxScore) * 100;
                return (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.criterion}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.score.toFixed(1)} / {item.maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          percentage >= 70 ? 'bg-green-600' : percentage >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parsed CV Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Parsed CV Data</h2>
            
            <div className="space-y-6">
              {/* Education */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Education
                </h3>
                {application.parsedCV.education.length > 0 ? (
                  <ul className="space-y-1 ml-6">
                    {application.parsedCV.education.map((edu, index) => (
                      <li key={index} className="text-sm text-gray-700 list-disc">
                        {edu}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 ml-6">No education data found</p>
                )}
              </div>

              {/* Work History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Work History
                  <span className="text-sm font-normal text-gray-600">
                    ({application.qualifyingExperience} years qualifying experience)
                  </span>
                </h3>
                {application.parsedCV.workHistory.length > 0 ? (
                  <ul className="space-y-1 ml-6">
                    {application.parsedCV.workHistory.map((work, index) => (
                      <li key={index} className="text-sm text-gray-700 list-disc">
                        {work.title}
                        {work.isInternship && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            Excluded (Internship)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 ml-6">No work history found</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                {application.parsedCV.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {application.parsedCV.skills.slice(0, 10).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {skill.length > 50 ? skill.substring(0, 50) + '...' : skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 ml-6">No skills data found</p>
                )}
              </div>
            </div>
          </div>

          {/* Original CV Text */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Original CV/Resume</h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {application.cvText}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Rejection Reasons */}
          {application.rejectionReasons && application.rejectionReasons.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-red-900 mb-4">Disqualification Reasons</h2>
              <ul className="space-y-3">
                {application.rejectionReasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths Summary */}
          {application.strengthsSummary && application.strengthsSummary.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-green-900 mb-4">Strengths</h2>
              <ul className="space-y-3">
                {application.strengthsSummary.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Knockout Answers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Screening Responses</h2>
            <div className="space-y-3">
              {application.knockoutAnswers.map((answer, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Question {index + 1}</span>
                  <span
                    className={`font-semibold uppercase ${
                      answer === 'yes' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {answer}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Application ID */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-sm font-medium text-blue-900 mb-2">Application ID</h2>
            <p className="text-xs text-blue-700 font-mono break-all">{application.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
