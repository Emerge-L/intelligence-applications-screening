import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono().basePath('/server');

// ── Supabase client (uses service role — full DB access) ──
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BUCKET_NAME = "screening-applications";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

// ── Middleware ────────────────────────────────────────────
app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ── Storage bucket bootstrap ──────────────────────────────
async function initializeBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET_NAME)) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10485760, // 10 MB
      });
      console.log(`Created storage bucket: ${BUCKET_NAME}`);
    }
  } catch (e) {
    console.log("Bucket init error:", e);
  }
}
initializeBucket();

// ── Health check ──────────────────────────────────────────
app.get("/health", (c) => c.json({ status: "ok" }));

// ─────────────────────────────────────────────────────────
// AI CV PARSER
// Uses Claude Haiku via the Anthropic API. Falls back to
// the original regex parser if the API call fails.
// ─────────────────────────────────────────────────────────

interface WorkEntry {
  title: string;
  duration: string;
  isInternship: boolean;
}

interface ParsedCV {
  education: string[];
  skills: string[];
  workHistory: WorkEntry[];
}

/** Regex fallback — original logic preserved exactly */
function fallbackParseCV(cvText: string): ParsedCV {
  const lines = cvText.toLowerCase().split("\n");
  const education: string[] = [];
  const skills: string[] = [];
  const workHistory: WorkEntry[] = [];

  const eduKw = ["diploma", "degree", "bachelor", "master", "phd", "certificate", "qualification"];
  const skillKw = ["microsoft", "excel", "word", "powerpoint", "communication", "marketing", "administration"];
  const internKw = ["intern", "internship", "attachment", "industrial attachment", "trainee", "volunteer", "work placement"];

  lines.forEach((line) => {
    if (eduKw.some((k) => line.includes(k))) education.push(line.trim());
    if (skillKw.some((k) => line.includes(k))) skills.push(line.trim());
    const yearPat = /\d{4}[-–]\d{4}|\d+\s*years?/i;
    if (yearPat.test(line)) {
      workHistory.push({
        title: line.trim(),
        duration: line.match(yearPat)?.[0] ?? "unknown",
        isInternship: internKw.some((k) => line.includes(k)),
      });
    }
  });

  return { education, skills, workHistory };
}

/** AI parser — calls Claude Haiku to extract structured CV data */
async function parseCV(cvText: string): Promise<ParsedCV> {
  if (!cvText.trim()) return { education: [], skills: [], workHistory: [] };

  if (!ANTHROPIC_API_KEY) {
    console.log("No ANTHROPIC_API_KEY set — using fallback parser");
    return fallbackParseCV(cvText);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are a structured CV data extractor.
Read the CV text provided and return ONLY a valid JSON object.
Do NOT include any markdown, code fences, explanation, or preamble — just raw JSON.

Return exactly this structure:
{
  "education": ["list each qualification as a plain string"],
  "skills": ["list each skill or tool as a plain string"],
  "workHistory": [
    {
      "title": "Job title and company name",
      "duration": "e.g. 2020-2023 or 3 years",
      "isInternship": false
    }
  ]
}

Rules:
- Set isInternship: true for any role described as: intern, internship, attachment, industrial attachment, trainee, volunteer, work placement, or similar.
- Extract duration from year ranges (e.g. "2019-2022") or explicit statements ("4 years").
- Include all education: degrees, diplomas, certificates, professional qualifications.
- Include all skills: software, languages, technical tools, soft skills.`,
        messages: [{ role: "user", content: `Parse this CV:\n\n${cvText}` }],
      }),
    });

    if (!response.ok) {
      console.log("Anthropic API error:", response.status);
      return fallbackParseCV(cvText);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text ?? "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as ParsedCV;

    if (
      !Array.isArray(parsed.education) ||
      !Array.isArray(parsed.skills) ||
      !Array.isArray(parsed.workHistory)
    ) {
      console.log("AI parser returned unexpected shape — falling back");
      return fallbackParseCV(cvText);
    }

    return parsed;
  } catch (e) {
    console.log("AI parse exception — falling back:", e);
    return fallbackParseCV(cvText);
  }
}

// ─────────────────────────────────────────────────────────
// SCORING LOGIC
// ─────────────────────────────────────────────────────────

function calculateQualifyingExperience(workHistory: WorkEntry[]): number {
  let total = 0;
  workHistory
    .filter((j) => !j.isInternship)
    .forEach((job) => {
      const years = job.duration.match(/(\d+)\s*years?/i);
      if (years) { total += parseInt(years[1]); return; }
      const range = job.duration.match(/(\d{4})[-–](\d{4})/);
      if (range) total += parseInt(range[2]) - parseInt(range[1]);
    });
  return total;
}

interface Criterion {
  name: string;
  weight: number;
  type: string;
}

interface Vacancy {
  id: string;
  title: string;
  organization: string;
  knockout_criteria: any[];
  required_criteria: Criterion[];
  preferred_criteria: Criterion[];
  minimum_experience: number;
  passing_score: number;
}

function calculateMatchScore(
  vacancy: Vacancy,
  parsedCV: ParsedCV,
  qualifyingExperience: number
) {
  let totalScore = 0;
  let maxScore = 0;
  const breakdown: { criterion: string; score: number; maxScore: number }[] = [];
  const gaps: string[] = [];
  const strengths: string[] = [];

  const allText = [
    ...parsedCV.education,
    ...parsedCV.skills,
    ...parsedCV.workHistory.map((j) => j.title),
  ].join(" ").toLowerCase();

  const wordMatch = (name: string) =>
    name.toLowerCase().split(" ").some((w) => w.length > 3 && allText.includes(w));

  vacancy.required_criteria.forEach((c) => {
    let score = 0;
    const w = c.weight;

    if (c.type === "education") {
      const has = parsedCV.education.some((e) =>
        c.name.toLowerCase().split(" ").some(
          (word) => word.length > 3 && e.toLowerCase().includes(word)
        )
      );
      score = has ? w : 0;
      if (has) strengths.push(`Meets requirement: ${c.name}`);
      else gaps.push(`Missing: ${c.name}`);

    } else if (c.type === "experience") {
      if (c.name.includes("3+") || c.name.toLowerCase().includes("years")) {
        const req = vacancy.minimum_experience || 3;
        score = qualifyingExperience >= req
          ? w
          : Math.round((qualifyingExperience / req) * w);
        if (qualifyingExperience < req)
          gaps.push(`Insufficient experience: ${qualifyingExperience} years qualifying (required: ${req}+)`);
        else if (qualifyingExperience > req)
          strengths.push(`Exceeds required experience by ${qualifyingExperience - req} years`);
      } else {
        score = parsedCV.workHistory.length > 0 ? w : 0;
        if (parsedCV.workHistory.length === 0)
          gaps.push(`No relevant experience found for: ${c.name}`);
      }
    } else if (c.type === "skill") {
      const has = wordMatch(c.name);
      score = has ? w : Math.round(w * 0.5);
      if (!has) gaps.push(`Skill not demonstrated: ${c.name}`);
    }

    totalScore += score;
    maxScore += w;
    breakdown.push({ criterion: c.name, score, maxScore: w });
  });

  vacancy.preferred_criteria.forEach((c) => {
    const has = wordMatch(c.name);
    const score = has ? c.weight : 0;
    if (has) strengths.push(`Additional strength: ${c.name}`);
    totalScore += score;
    maxScore += c.weight;
    breakdown.push({ criterion: c.name, score, maxScore: c.weight });
  });

  return {
    totalScore: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    breakdown,
    gaps,
    strengths,
  };
}

// ─────────────────────────────────────────────────────────
// SHARED APPLICATION PROCESSOR
// ─────────────────────────────────────────────────────────

async function processApplication(appData: {
  vacancyId: string;
  applicantData: { fullName: string; email: string; phone: string };
  knockoutAnswers: string[];
  cvText: string;
  vacancy: Vacancy;
}) {
  const { vacancyId, applicantData, knockoutAnswers, cvText, vacancy } = appData;

  const applicationId = `${vacancyId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Step 1 — Knockout check
  let knockoutFailed = false;
  let knockoutReason = "";
  for (let i = 0; i < vacancy.knockout_criteria.length; i++) {
    const c = vacancy.knockout_criteria[i];
    if (c.required && knockoutAnswers[i] !== "yes") {
      knockoutFailed = true;
      knockoutReason = `Failed knockout question: ${c.question}`;
      break;
    }
  }

  // Step 2 — AI parse CV
  const parsedCV = await parseCV(cvText);

  // Step 3 — Experience filter (exclude internships)
  const qualifyingExperience = calculateQualifyingExperience(parsedCV.workHistory);

  // Step 4 — Experience threshold check
  let experienceFailed = false;
  let experienceReason = "";
  if (vacancy.minimum_experience > 0 && qualifyingExperience < vacancy.minimum_experience) {
    experienceFailed = true;
    experienceReason = `Experience requirement not met: ${qualifyingExperience} years of qualifying employment found after excluding internship/attachment roles. Minimum required: ${vacancy.minimum_experience} years.`;
  }

  // Step 5 — Match score
  const scoring = calculateMatchScore(vacancy, parsedCV, qualifyingExperience);

  // Step 6 — Final status
  let status = "qualified";
  const rejectionReasons: string[] = [];

  if (knockoutFailed) {
    status = "disqualified";
    rejectionReasons.push(knockoutReason);
  } else if (experienceFailed) {
    status = "disqualified";
    rejectionReasons.push(experienceReason);
  } else if (scoring.totalScore < vacancy.passing_score) {
    status = "disqualified";
    rejectionReasons.push(
      `Overall match score (${scoring.totalScore}%) below passing threshold (${vacancy.passing_score}%)`
    );
    scoring.gaps.forEach((g) => rejectionReasons.push(g));
  }

  // Step 7 — Persist to DB
  const { error } = await supabase.from("applications").insert({
    id: applicationId,
    vacancy_id: vacancyId,
    vacancy_title: vacancy.title,
    applicant_name: applicantData.fullName,
    applicant_email: applicantData.email,
    applicant_phone: applicantData.phone,
    knockout_answers: knockoutAnswers,
    cv_text: cvText || "",
    parsed_cv: parsedCV,
    qualifying_experience: qualifyingExperience,
    match_score: scoring.totalScore,
    scoring_breakdown: scoring.breakdown,
    status,
    rejection_reasons: rejectionReasons,
    strengths_summary: status === "qualified" ? scoring.strengths : [],
  });

  if (error) throw new Error(error.message);

  return {
    applicationId,
    status,
    matchScore: scoring.totalScore,
    rejectionReasons: status === "disqualified" ? rejectionReasons : [],
    parsedCV,
    qualifyingExperience,
    scoring,
  };
}

// ─────────────────────────────────────────────────────────
// HELPER — map DB row → camelCase shape the React app expects
// ─────────────────────────────────────────────────────────
function rowToApplication(row: any) {
  return {
    id: row.id,
    vacancyId: row.vacancy_id,
    vacancyTitle: row.vacancy_title,
    applicantData: {
      fullName: row.applicant_name,
      email: row.applicant_email,
      phone: row.applicant_phone,
    },
    knockoutAnswers: row.knockout_answers,
    cvText: row.cv_text,
    parsedCV: row.parsed_cv,
    qualifyingExperience: row.qualifying_experience,
    matchScore: row.match_score,
    scoringBreakdown: row.scoring_breakdown,
    status: row.status,
    rejectionReasons: row.rejection_reasons ?? [],
    strengthsSummary: row.strengths_summary ?? [],
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  };
}

// ─────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────

// Upload file to storage
app.post("/upload-file", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const applicationId = formData.get("applicationId") as string;
    const fileType = formData.get("fileType") as string;

    if (!file || !applicationId || !fileType)
      return c.json({ error: "Missing required fields" }, 400);

    const fileExt = file.name.split(".").pop();
    const fileName = `${applicationId}/${fileType}-${Date.now()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, { contentType: file.type });

    if (error)
      return c.json({ error: "Failed to upload file", details: error.message }, 500);

    const { data: signed } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 31_536_000); // 1 year

    return c.json({
      message: "File uploaded successfully",
      filePath: fileName,
      signedUrl: signed?.signedUrl,
    });
  } catch (e) {
    return c.json({ error: "Failed to upload file", details: String(e) }, 500);
  }
});

// Extract text from uploaded file
app.post("/extract-text", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    if (!file) return c.json({ error: "No file provided" }, 400);

    let extractedText = "";

    if (file.type === "text/plain") {
      // Plain text — read directly
      extractedText = await file.text();

    } else if (file.type === "application/pdf" && ANTHROPIC_API_KEY) {
      // PDF — send to Claude AI as base64 document
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            messages: [{
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: "Extract all text content from this CV/resume document. Return only the raw text content, preserving structure like sections, dates, and bullet points. Do not summarize or add commentary.",
                },
              ],
            }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          extractedText = data.content?.[0]?.text ?? "";
        } else {
          extractedText = `PDF uploaded: ${file.name}\n\nCould not extract text automatically. Please paste CV content manually.`;
        }
      } catch {
        extractedText = `PDF uploaded: ${file.name}\n\nCould not extract text automatically. Please paste CV content manually.`;
      }

    } else if (
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // DOC/DOCX — attempt plain text read
      extractedText = await file
        .text()
        .catch(() => `File: ${file.name}\nPlease paste CV content manually.`);

    } else {
      extractedText = await file
        .text()
        .catch(() => `File: ${file.name}\nPlease paste CV content manually.`);
    }

    return c.json({ extractedText, fileName: file.name, fileType: file.type });
  } catch (e) {
    return c.json({ error: "Failed to extract text", details: String(e) }, 500);
  }
});
// Get all active vacancies
app.get("/vacancies", async (c) => {
  const { data, error } = await supabase
    .from("vacancies")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ vacancies: data ?? [] });
});

// Get single vacancy
app.get("/vacancies/:id", async (c) => {
  const { data, error } = await supabase
    .from("vacancies")
    .select("*")
    .eq("id", c.req.param("id"))
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "Vacancy not found" }, 404);
  return c.json({ vacancy: data });
});

// Submit a single application
app.post("/applications", async (c) => {
  try {
    const body = await c.req.json();
    const { vacancyId, applicantData, knockoutAnswers, cvText } = body;

    if (!vacancyId || !applicantData || !knockoutAnswers)
      return c.json({ error: "Missing required fields" }, 400);

    const { data: vacancy } = await supabase
      .from("vacancies")
      .select("*")
      .eq("id", vacancyId)
      .maybeSingle();
    if (!vacancy) return c.json({ error: "Vacancy not found" }, 404);

    const result = await processApplication({
      vacancyId,
      applicantData,
      knockoutAnswers,
      cvText,
      vacancy,
    });

    return c.json({
      message: "Application submitted successfully",
      applicationId: result.applicationId,
      status: result.status,
      matchScore: result.matchScore,
      rejectionReasons: result.rejectionReasons.length
        ? result.rejectionReasons
        : undefined,
    });
  } catch (e) {
    return c.json({ error: "Failed to submit application", details: String(e) }, 500);
  }
});

// Bulk upload — multiple applications at once
app.post("/applications/bulk", async (c) => {
  try {
    const { applications } = await c.req.json();
    if (!Array.isArray(applications) || applications.length === 0)
      return c.json({ error: "Applications array is required" }, 400);

    const results = { successful: 0, failed: 0, details: [] as any[] };

    for (const appData of applications) {
      const { vacancyId, applicantData, knockoutAnswers, cvText } = appData;

      if (!vacancyId || !applicantData || !knockoutAnswers) {
        results.failed++;
        results.details.push({
          applicant: applicantData?.fullName ?? "Unknown",
          status: "failed",
          error: "Missing required fields",
        });
        continue;
      }

      const { data: vacancy } = await supabase
        .from("vacancies")
        .select("*")
        .eq("id", vacancyId)
        .maybeSingle();

      if (!vacancy) {
        results.failed++;
        results.details.push({
          applicant: applicantData.fullName,
          status: "failed",
          error: "Vacancy not found",
        });
        continue;
      }

      try {
        const result = await processApplication({
          vacancyId,
          applicantData,
          knockoutAnswers,
          cvText,
          vacancy,
        });
        results.successful++;
        results.details.push({
          applicant: applicantData.fullName,
          status: "success",
          applicationId: result.applicationId,
          screeningStatus: result.status,
          matchScore: result.matchScore,
        });
      } catch (err) {
        results.failed++;
        results.details.push({
          applicant: applicantData.fullName,
          status: "failed",
          error: String(err),
        });
      }
    }

    return c.json({
      message: `Processed ${applications.length} application(s)`,
      successful: results.successful,
      failed: results.failed,
      details: results.details,
    });
  } catch (e) {
    return c.json({ error: "Failed to process bulk upload", details: String(e) }, 500);
  }
});

// Get all applications for a vacancy
app.get("/vacancies/:vacancyId/applications", async (c) => {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("vacancy_id", c.req.param("vacancyId"))
    .order("match_score", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ applications: (data ?? []).map(rowToApplication) });
});

// Get a single application by ID
app.get("/applications/:id", async (c) => {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", c.req.param("id"))
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "Application not found" }, 404);
  return c.json({ application: rowToApplication(data) });
});

// Analytics for a vacancy
app.get("/vacancies/:vacancyId/analytics", async (c) => {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("vacancy_id", c.req.param("vacancyId"));
  if (error) return c.json({ error: error.message }, 500);

  const apps = data ?? [];
  if (apps.length === 0) {
    return c.json({
      totalApplications: 0,
      qualified: 0,
      disqualified: 0,
      averageMatchScore: 0,
      rejectionReasons: {},
      scoreDistribution: [],
      topCandidates: [],
    });
  }

  const qualified = apps.filter((a) => a.status === "qualified");
  const disqualified = apps.filter((a) => a.status === "disqualified");
  const averageMatchScore = Math.round(
    apps.reduce((s, a) => s + a.match_score, 0) / apps.length
  );

  // Rejection reason counts
  const rejectionReasonCounts: Record<string, number> = {};
  disqualified.forEach((app) => {
    (app.rejection_reasons ?? []).forEach((r: string) => {
      rejectionReasonCounts[r] = (rejectionReasonCounts[r] ?? 0) + 1;
    });
  });

  // Score distribution buckets
  const scoreRanges = [
    { range: "0-20%", count: 0 },
    { range: "21-40%", count: 0 },
    { range: "41-60%", count: 0 },
    { range: "61-80%", count: 0 },
    { range: "81-100%", count: 0 },
  ];
  apps.forEach((a) => {
    if (a.match_score <= 20) scoreRanges[0].count++;
    else if (a.match_score <= 40) scoreRanges[1].count++;
    else if (a.match_score <= 60) scoreRanges[2].count++;
    else if (a.match_score <= 80) scoreRanges[3].count++;
    else scoreRanges[4].count++;
  });

  return c.json({
    totalApplications: apps.length,
    qualified: qualified.length,
    disqualified: disqualified.length,
    averageMatchScore,
    rejectionReasons: rejectionReasonCounts,
    scoreDistribution: scoreRanges,
    topCandidates: qualified
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        name: a.applicant_name,
        matchScore: a.match_score,
        email: a.applicant_email,
      })),
  });
});

Deno.serve({ port: 8000 }, app.fetch);