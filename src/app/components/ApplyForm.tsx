import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Loader2, CheckCircle, XCircle, ArrowLeft, Upload } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';

interface KnockoutCriterion {
  question: string;
  type: string;
  required: boolean;
}

interface Vacancy {
  id: string;
  title: string;
  organization: string;
  location: string;
  // Accept both naming conventions from DB or legacy KV store
  knockout_criteria?: KnockoutCriterion[];
  knockoutCriteria?: KnockoutCriterion[];
}

function getKnockout(v: Vacancy): KnockoutCriterion[] {
  return v.knockout_criteria ?? v.knockoutCriteria ?? [];
}

export function ApplyForm() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cvText, setCvText] = useState('');
  const [knockoutAnswers, setKnockoutAnswers] = useState<string[]>([]);

  // Submission result
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadVacancy();
  }, [vacancyId]);

  async function loadVacancy() {
    try {
      setLoading(true);
      const data = await api.getVacancy(vacancyId!);
      const v: Vacancy = data.vacancy;
      setVacancy(v);
      setKnockoutAnswers(new Array(getKnockout(v).length).fill(''));
    } catch (error) {
      console.error('Error loading vacancy:', error);
      toast.error('Failed to load vacancy details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName || !email || !phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (knockoutAnswers.some(a => !a)) {
      toast.error('Please answer all screening questions');
      return;
    }

    if (!cvText.trim()) {
      toast.error('Please provide your CV/resume details');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.submitApplication({
        vacancyId: vacancyId!,
        applicantData: { fullName, email, phone },
        knockoutAnswers,
        cvText,
      });
      setResult(response);
      toast.success('Application submitted successfully');
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#4C808A] animate-spin" />
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Vacancy Not Found</h2>
          <p className="text-red-700 mb-4">The vacancy you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/vacancies')}
            className="text-red-700 font-semibold hover:text-red-800"
          >
            ← Back to Vacancies
          </button>
        </div>
      </div>
    );
  }

  const knockoutCriteria = getKnockout(vacancy);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate('/vacancies')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vacancies
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{vacancy.title}</h1>
        <p className="text-gray-600 mb-1">{vacancy.organization}</p>
        <p className="text-gray-600">{vacancy.location}</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4C808A] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4C808A] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4C808A] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Knockout Questions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Screening Questions</h2>
            <p className="text-sm text-gray-600 mb-6">
              Please answer all questions honestly. These are mandatory requirements.
            </p>
            <div className="space-y-6">
              {knockoutCriteria.map((criterion, index) => (
                <div key={index} className="pb-6 border-b border-gray-200 last:border-0">
                  <p className="font-medium text-gray-900 mb-3">
                    {index + 1}. {criterion.question}
                  </p>
                  <div className="flex gap-4">
                    {['yes', 'no'].map((val) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`knockout-${index}`}
                          value={val}
                          checked={knockoutAnswers[index] === val}
                          onChange={(e) => {
                            const next = [...knockoutAnswers];
                            next[index] = e.target.value;
                            setKnockoutAnswers(next);
                          }}
                          className="w-4 h-4 text-[#4C808A]"
                        />
                        <span className="text-gray-700 capitalize">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CV / Resume */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">CV / Resume</h2>
            <p className="text-sm text-gray-600 mb-6">
              Paste your CV/resume content below. Include education, work experience (with years), skills, and certifications.
              Our AI parser will extract and analyse the structured data automatically.
            </p>
            <div>
              <label htmlFor="cvText" className="block text-sm font-medium text-gray-700 mb-2">
                CV Content <span className="text-red-600">*</span>
              </label>
              <textarea
                id="cvText"
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                rows={14}
                placeholder={`Example:\n\nEducation:\nDiploma in Business Administration - University Name (2018-2020)\n\nWork Experience:\nMarketing Officer - Company Name (2020-2023) - 3 years\nDeveloped marketing campaigns and managed social media...\n\nInternship:\nMarketing Intern - Firm Name (2018) - 6 months  ← clearly marked, will be excluded\n\nSkills:\nMicrosoft Office (Word, Excel, PowerPoint), Communication, Marketing...`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4C808A] focus:border-transparent font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Include specific years (e.g. "2020–2023" or "3 years"). Clearly label internships,
                attachments, or volunteer positions — they will be excluded from experience calculation.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#4C808A] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#3B6570] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting & Screening…
                </>
              ) : (
                <>
                  Submit Application
                  <Upload className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* ── Result Panel ── */
        <div id="results" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            {result.status === 'qualified' ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-900 mb-2">Application Qualified!</h2>
                <p className="text-gray-600">
                  Congratulations! Your application has met the requirements for this position.
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-900 mb-2">Application Not Successful</h2>
                <p className="text-gray-600">
                  Unfortunately, your application did not meet the minimum requirements for this position.
                </p>
              </>
            )}
          </div>

          {/* Match Score Bar */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Match Score</span>
              <span className="text-3xl font-bold text-gray-900">{result.matchScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  result.matchScore >= 70 ? 'bg-green-600' : 'bg-red-500'
                }`}
                style={{ width: `${result.matchScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">
              Passing threshold: 70%
            </p>
          </div>

          {/* Rejection reasons */}
          {result.rejectionReasons && result.rejectionReasons.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-red-900 mb-3">Reasons for Disqualification:</h3>
              <ul className="space-y-2">
                {result.rejectionReasons.map((reason: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-red-800 text-sm">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application ID */}
          <div className="bg-[#4C808A]/10 border border-[#4C808A]/30 rounded-lg p-6 mb-6">
            <p className="text-sm text-[#3B4167]">
              <strong>Application ID:</strong> {result.applicationId}
            </p>
            <p className="text-xs text-[#3B4167]/80 mt-2">
              Please save this ID for your records.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/vacancies')}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              View Other Vacancies
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#4C808A] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#3B6570] transition-colors"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
