import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Plus, Trash2, Loader2, CheckCircle, XCircle, ArrowLeft, AlertTriangle, FileText, Mail } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';

interface Vacancy {
  id: string;
  title: string;
  organization: string;
  knockoutCriteria: Array<{
    question: string;
    type: string;
    required: boolean;
  }>;
}

interface ApplicationForm {
  id: string;
  vacancyId: string;
  fullName: string;
  email: string;
  phone: string;
  knockoutAnswers: string[];
  cvText: string;
  cvFile: File | null;
  letterFile: File | null;
  extracting: boolean;
}

export function BulkUpload() {
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [applications, setApplications] = useState<ApplicationForm[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    loadVacancies();
  }, []);

  async function loadVacancies() {
    try {
      setLoading(true);
      const data = await api.getVacancies();
      setVacancies(data.vacancies);
    } catch (error) {
      console.error('Error loading vacancies:', error);
      toast.error('Failed to load vacancies');
    } finally {
      setLoading(false);
    }
  }

  function handleVacancySelect(vacancyId: string) {
    const vacancy = vacancies.find(v => v.id === vacancyId);
    if (vacancy) {
      setSelectedVacancy(vacancy);
      setApplications([]);
      setUploadResult(null);
    }
  }

  function addApplication() {
    if (!selectedVacancy) return;

    const newApp: ApplicationForm = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vacancyId: selectedVacancy.id,
      fullName: '',
      email: '',
      phone: '',
      knockoutAnswers: new Array(selectedVacancy.knockoutCriteria.length).fill(''),
      cvText: '',
      cvFile: null,
      letterFile: null,
      extracting: false,
    };

    setApplications([...applications, newApp]);
  }

  function removeApplication(id: string) {
    setApplications(applications.filter(app => app.id !== id));
  }

  function updateApplication(id: string, field: string, value: any) {
    setApplications(applications.map(app => {
      if (app.id === id) {
        return { ...app, [field]: value };
      }
      return app;
    }));
  }

  function updateKnockoutAnswer(appId: string, questionIndex: number, answer: string) {
    setApplications(applications.map(app => {
      if (app.id === appId) {
        const newAnswers = [...app.knockoutAnswers];
        newAnswers[questionIndex] = answer;
        return { ...app, knockoutAnswers: newAnswers };
      }
      return app;
    }));
  }

  async function handleBulkUpload() {
    if (!selectedVacancy) {
      toast.error('Please select a vacancy');
      return;
    }

    if (applications.length === 0) {
      toast.error('Please add at least one application');
      return;
    }

    // Validate all applications
    const invalidApps = applications.filter(app => 
      !app.fullName || !app.email || !app.phone || !app.cvText.trim() ||
      app.knockoutAnswers.some(answer => !answer)
    );

    if (invalidApps.length > 0) {
      toast.error(`${invalidApps.length} application(s) have missing required fields`);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        applications: applications.map(app => ({
          vacancyId: app.vacancyId,
          applicantData: {
            fullName: app.fullName,
            email: app.email,
            phone: app.phone,
          },
          knockoutAnswers: app.knockoutAnswers,
          cvText: app.cvText,
        }))
      };

      const result = await api.bulkUploadApplications(payload);
      setUploadResult(result);
      toast.success(`Successfully processed ${result.successful} applications!`);

      // Scroll to results
      setTimeout(() => {
        document.getElementById('upload-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error uploading applications:', error);
      toast.error('Failed to upload applications');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setApplications([]);
    setUploadResult(null);
    setSelectedVacancy(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Upload Applications</h1>
        <p className="text-gray-600">
          Upload multiple applications received through email or other channels for automated screening
        </p>
      </div>

      {/* Vacancy Selection */}
      {!uploadResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Vacancy</h2>
          <select
            value={selectedVacancy?.id || ''}
            onChange={(e) => handleVacancySelect(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Choose a vacancy --</option>
            {vacancies.map(vacancy => (
              <option key={vacancy.id} value={vacancy.id}>
                {vacancy.title} - {vacancy.organization}
              </option>
            ))}
          </select>

          {selectedVacancy && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Selected:</strong> {selectedVacancy.title}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Applications will be screened against {selectedVacancy.knockoutCriteria.length} knockout questions
              </p>
            </div>
          )}
        </div>
      )}

      {/* Applications List */}
      {selectedVacancy && !uploadResult && (
        <div className="space-y-6">
          {applications.map((app, index) => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Application #{index + 1}</h3>
                <button
                  onClick={() => removeApplication(app.id)}
                  className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={app.fullName}
                    onChange={(e) => updateApplication(app.id, 'fullName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={app.email}
                    onChange={(e) => updateApplication(app.id, 'email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={app.phone}
                    onChange={(e) => updateApplication(app.id, 'phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+265 123 456 789"
                  />
                </div>
              </div>

              {/* Knockout Questions */}
              <div className="mb-4 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Screening Questions</h4>
                <div className="space-y-3">
                  {selectedVacancy.knockoutCriteria.map((criterion, qIndex) => (
                    <div key={qIndex} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {qIndex + 1}. {criterion.question}
                      </p>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`${app.id}-q${qIndex}`}
                            value="yes"
                            checked={app.knockoutAnswers[qIndex] === 'yes'}
                            onChange={(e) => updateKnockoutAnswer(app.id, qIndex, e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`${app.id}-q${qIndex}`}
                            value="no"
                            checked={app.knockoutAnswers[qIndex] === 'no'}
                            onChange={(e) => updateKnockoutAnswer(app.id, qIndex, e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CV Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CV/Resume Content <span className="text-red-600">*</span>
                </label>

                {/* File Upload Section */}
                <div className="mb-4 grid md:grid-cols-2 gap-4">
                  {/* CV File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateApplication(app.id, 'cvFile', file);
                            updateApplication(app.id, 'extracting', true);
                            try {
                              const result = await api.extractText(file);
                              updateApplication(app.id, 'cvText', result.extractedText);
                              toast.success('CV file uploaded and text extracted');
                            } catch (error) {
                              console.error('Error extracting text:', error);
                              toast.error('Failed to extract text from file');
                            } finally {
                              updateApplication(app.id, 'extracting', false);
                            }
                          }
                        }}
                        className="hidden"
                      />
                      <div className="text-center">
                        {app.extracting ? (
                          <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
                        ) : app.cvFile ? (
                          <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        ) : (
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        )}
                        <p className="text-sm font-medium text-gray-700">
                          {app.cvFile ? app.cvFile.name : 'Upload CV'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {app.extracting ? 'Extracting text...' : 'PDF, DOC, DOCX, or TXT'}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Cover Letter File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateApplication(app.id, 'letterFile', file);
                            toast.success('Cover letter uploaded');
                          }
                        }}
                        className="hidden"
                      />
                      <div className="text-center">
                        {app.letterFile ? (
                          <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        ) : (
                          <Mail className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        )}
                        <p className="text-sm font-medium text-gray-700">
                          {app.letterFile ? app.letterFile.name : 'Upload Cover Letter'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Optional
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* <textarea
                  value={app.cvText}
                  onChange={(e) => updateApplication(app.id, 'cvText', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Paste CV content or upload a file above to auto-extract text. Include education, work experience (with years), and skills..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Upload a CV file to automatically extract text, or paste content directly. You can edit the extracted text if needed.
                </p> */}
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <button
              onClick={addApplication}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Another Application
            </button>

            {applications.length > 0 && (
              <button
                onClick={handleBulkUpload}
                disabled={submitting}
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Screen {applications.length} Application{applications.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <div id="upload-results" className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Upload Complete</h2>
              <p className="text-gray-600">{uploadResult.message}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-900 mb-1">{uploadResult.successful}</p>
                <p className="text-sm text-green-800">Successfully Processed</p>
              </div>

              {uploadResult.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-red-900 mb-1">{uploadResult.failed}</p>
                  <p className="text-sm text-red-800">Failed to Process</p>
                </div>
              )}
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Processing Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Screening Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Match Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Application ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uploadResult.details.map((detail: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{detail.applicant}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {detail.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {detail.screeningStatus ? (
                          detail.screeningStatus === 'qualified' ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                              Qualified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                              Disqualified
                            </span>
                          )
                        ) : (
                          <span className="text-sm text-gray-500">{detail.error || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {detail.matchScore !== undefined ? (
                          <span className="text-sm font-semibold text-gray-900">{detail.matchScore}%</span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {detail.applicationId ? (
                          <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {detail.applicationId.substring(0, 20)}...
                          </code>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Dashboard
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Upload More Applications
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedVacancy && applications.length === 0 && !uploadResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Added Yet</h3>
          <p className="text-gray-600 mb-6">
            Click the button below to add applications for screening
          </p>
          <button
            onClick={addApplication}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add First Application
          </button>
        </div>
      )}

      {/* Info Box */}
      {!uploadResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-2">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All fields marked with <span className="text-red-600">*</span> are required</li>
                <li>CV content should include years of experience in the format "2020-2023" or "3 years"</li>
                <li>Internships, attachments, and volunteer roles should be clearly labeled - they will be excluded from experience calculation</li>
                <li>Each application will be automatically screened and scored based on the vacancy requirements</li>
                <li>You'll receive immediate results showing qualified and disqualified candidates</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}