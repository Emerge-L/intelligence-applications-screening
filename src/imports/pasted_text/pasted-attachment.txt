Full System Summary: Intelligent Application Screening Platform
Overview
The platform is designed as an Intelligent Filtering Hub focused exclusively on screening and analysing job applications. Its core purpose is to automate the filtering process, score each applicant against employer-defined requirements, and clearly explain why every candidate passed or failed. It is currently configured to screen applicants for two active vacancies — the Communications & Marketing Officer (Emerge Livelihoods) and the Office Assistant / Receptionist (Emerge Fund) — both based in Mzuzu.

Section 1: Core Components
1. Requirement Configuration Engine
Before any screening begins, the system loads the benchmark for each vacancy. This includes defining mandatory vs. preferred qualifications and setting knock-out questions that immediately disqualify candidates who don't meet baseline requirements.

Knock-out Questions are custom Yes/No or multiple-choice prompts at the point of application — for example, "Do you hold a Diploma in Business Administration or related field?" A "No" answer instantly flags the applicant as disqualified before any further processing occurs.

Weighted Criteria Mapping assigns higher scores to must-have qualifications and lower weights to nice-to-have attributes, ensuring the final match score accurately reflects how well a candidate meets the employer's priorities.

2. Automated Screening & Parsing
This is the core filter that processes every incoming application.

AI Resume Parser extracts structured data — education, skills, certifications, and work history — from uploaded CVs and maps them against the loaded job requirement profile.
Match Scoring assigns each applicant a percentage score (e.g., "82% Match") based on how closely their parsed profile aligns with the job requirements.
Status Categorisation automatically sorts every applicant into one of two buckets: Qualified or Disqualified.
3. Gap Analysis Module
This component explains every outcome in specific, data-driven terms.

Reason Tagging — every disqualified applicant is tagged with the exact requirement they failed (e.g., "Missing relevant qualification," "Insufficient qualifying experience").
Success Indicators — qualified applicants receive a strengths summary (e.g., "Exceeds required experience by 2 years").
Comparative Heatmaps — a visual breakdown of a candidate's profile against the ideal candidate profile for that specific vacancy.
4. Analysis Summary & Reporting Dashboard
Provides a high-level overview of each vacancy's applicant pool.

Disqualification Funnel — shows which specific requirement eliminated the most applicants (e.g., "55% of Office Assistant applicants did not meet the 3-year experience threshold").
Talent Quality Report — displays the average match score across the entire pool for each vacancy.
Auto-Feedback Generator — pulls data from the Gap Analysis module to send personalised, automated rejection emails citing the exact unmet criteria for each individual applicant.
Section 2: Vacancy-Specific Screening Profiles
Position 1: Communications & Marketing Officer
Organisation: Emerge Livelihoods | Location: Mzuzu (On-site) | Closing Date: 09 March 2026 | Reports to: Team Leader, Communications & Marketing

Knock-out / Must-Have Criteria

Relevant qualification in Communications, Marketing, Journalism, or related field
Proven professional experience in communications, marketing, or a similar role
Experience creating content for digital and traditional media platforms
Demonstrated ability to engage diverse stakeholders including members, partners, and community
Preferred / Nice-to-Have Criteria

Knowledge of brand management and visibility strategies
Strong creativity and written/verbal communication skills
Ability to work collaboratively across departments
Commitment to safeguarding and equitable practices
Key responsibilities the system verifies capability for: Content creation and management, stakeholder communications, member engagement, community relations, brand visibility, partner relations, and policy compliance.

Position 2: Office Assistant / Receptionist
Organisation: Emerge Fund | Location: Mzuzu (On-site) | Reports to: Risk and Recoveries Officer

Knock-out / Must-Have Criteria

Diploma in Business Administration, Management, or Marketing
Minimum 3 years of qualifying work experience (nonprofit or service sector preferred)
Proficiency in Microsoft Packages
Fluency in written and spoken English and native languages
Preferred / Nice-to-Have Criteria

Experience in office administration and client relations
Strong recordkeeping, inventory management, and event organisation skills
Excellent communication, presentation, and negotiation skills
Highly motivated, mature, decisive, and able to work under pressure
Key responsibilities the system verifies capability for: Client relations, administration, appointment management, office management, marketing support, and team collaboration.

Section 3: Internship & Attachment Exclusion Rule
The Rule
Any work history entry identified as an internship, attachment, industrial placement, trainee role, or volunteer position is excluded from the calculated years of qualifying work experience before the experience threshold check is applied.

How the System Applies It
Extracts all work history entries from the parsed CV
Identifies and strips out entries where the title or description contains keywords such as intern, internship, attachment, industrial attachment, trainee, volunteer, or work placement
Calculates total experience only from substantive, paid employment
If the remaining experience falls below the required threshold → auto-disqualified
Reason Tag Applied
"Experience requirement not met: [X] years of qualifying employment found after excluding internship/attachment roles. Minimum required: 3 years."

Why This Rule Exists
Without it, a candidate could combine internship time with limited paid employment and appear to meet the experience threshold when they do not. This rule protects the integrity of the shortlist for both vacancies.

Section 4: Screening Logic Flow
Step	Action	Output
1. Input	Candidate submits application for a specific vacancy	Structured data profile created
2. Knock-out Check	System checks knock-out question responses	Immediate disqualification if triggered
3. Parse	AI parser extracts education, skills, and work history from CV	Mapped candidate profile
4. Experience Filter	Internship/attachment roles stripped from experience calculation	Verified qualifying years of experience
5. Compare	Profile matched against vacancy requirement configuration	Match score (%) generated
6. Sort	If score falls below threshold → Disqualified	Moved to Unsuccessful bucket
7. Analyse	System identifies specific missing data points	Reason tags assigned
8. Summarise	All tags aggregated per vacancy	Hiring manager dashboard updated
9. Communicate	Auto-feedback generator sends personalised rejection email	Applicant informed of exact gaps
Section 5: Critical Implementation Requirement
Every rejection must be stored with a specific, mandatory reason data point — the system should not allow a "No" without a corresponding data tag. This enables a Rejection Reason Distribution Report per vacancy, which serves two key purposes: it shows whether the job requirements are set too strictly, and it reveals whether the applicant pool is generally under-qualified for the role. This historical data also supports future recruitment planning and job description refinement.