import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { calculateCandidateJobMatch } from './matching.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hr-recruitment-secret-key-super-secure-2026';

export const apiRouter = Router();

// Interfaces for Auth
export interface AuthUser {
  user_id: string;
  email: string;
  role: 'candidate' | 'hr';
  candidate_id?: string;
  hr_id?: string;
  company_id?: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Authentication Middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

export function requireRole(role: 'candidate' | 'hr') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. Only ${role.toUpperCase()} accounts can access this resource.` });
    }
    next();
  };
}

// Helper: Calculate Candidate Profile Completion Percentage
function calculateProfileCompletion(cand: any, hasResume: boolean): number {
  if (!cand) return 0;
  let score = 20; // base registered
  if (cand.phone && String(cand.phone).trim().length > 3) score += 10;
  if (cand.education && String(cand.education).trim().length > 3) score += 15;
  if (cand.skills) {
    try {
      const skills = JSON.parse(cand.skills);
      if (Array.isArray(skills) && skills.length > 0) score += 20;
    } catch {
      if (String(cand.skills).trim().length > 0) score += 20;
    }
  }
  if (cand.experience && String(cand.experience).trim().length > 3) score += 15;
  if (cand.location && String(cand.location).trim().length > 2) score += 5;
  if (cand.about && String(cand.about).trim().length > 5) score += 5;
  if (cand.certifications && String(cand.certifications).trim().length > 3) score += 5;
  if (hasResume) score += 10;
  return Math.min(100, score);
}

// Helper: Recalculate Fit Score for an application
export function syncApplicationFitScore(appId: string) {
  try {
    const app = db.prepare(`SELECT candidate_id, job_id FROM applications WHERE application_id = ?`).get(appId) as any;
    if (!app) return;
    const cand = db.prepare(`SELECT * FROM candidates WHERE candidate_id = ?`).get(app.candidate_id) as any;
    const job = db.prepare(`SELECT * FROM jobs WHERE job_id = ?`).get(app.job_id) as any;
    if (cand && job) {
      const match = calculateCandidateJobMatch(cand, job);
      db.prepare(`
        UPDATE applications
        SET fit_score = ?,
            fit_reasons = ?,
            skills_matched_count = ?,
            skills_total_count = ?,
            experience_status = ?
        WHERE application_id = ?
      `).run(
        match.score,
        JSON.stringify(match.reasons),
        match.skillsMatchedCount,
        match.skillsTotalCount,
        match.experienceStatus,
        appId
      );
    }
  } catch (e) {
    console.error('Error syncing fit score for application:', appId, e);
  }
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Candidate Registration
apiRouter.post('/auth/register-candidate', (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    password,
    confirmPassword,
    education,
    skills,
    experience,
    location,
    certifications,
    github_url,
    linkedin_url,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existing = db.prepare('SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)').get(String(email));
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const user_id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const candidate_id = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const password_hash = bcrypt.hashSync(password, 10);

  let skillsJson = '[]';
  if (Array.isArray(skills)) {
    skillsJson = JSON.stringify(skills);
  } else if (typeof skills === 'string') {
    skillsJson = JSON.stringify(skills.split(',').map((s: string) => s.trim()).filter(Boolean));
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('INSERT INTO users (user_id, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      user_id,
      email.toLowerCase(),
      password_hash,
      'candidate'
    );

    db.prepare(`
      INSERT INTO candidates (
        candidate_id, user_id, name, phone, education, skills,
        experience, location, about, certifications, github_url, linkedin_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidate_id,
      user_id,
      name,
      phone || '',
      education || '',
      skillsJson,
      experience || '',
      location || '',
      `Passionate professional with experience in ${education || 'technology'}.`,
      certifications || '',
      github_url || '',
      linkedin_url || ''
    );

    // Welcome notification
    db.prepare(`
      INSERT INTO notifications (notification_id, user_id, message, notification_type)
      VALUES (?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      user_id,
      `Welcome to the HR Recruitment Management System, ${name}! Complete your profile and upload your resume to get started.`,
      'WELCOME'
    );

    db.exec('COMMIT;');

    const authUser: AuthUser = {
      user_id,
      email: email.toLowerCase(),
      role: 'candidate',
      candidate_id,
      name,
    };

    const token = jwt.sign(authUser, JWT_SECRET);
    db.exec('PRAGMA wal_checkpoint(FULL);');
    return res.status(201).json({ message: 'Registration successful', token, user: authUser });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// HR Registration
apiRouter.post('/auth/register-hr', (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    password,
    confirmPassword,
    companyName,
    companyDescription,
    companyLocation,
    company_id,
    companyId,
  } = req.body;

  if (!name || !email || !password || !companyName) {
    return res.status(400).json({ error: 'HR Name, email, password, and company name are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existing = db.prepare('SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)').get(String(email));
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  // Determine and clean Company ID
  const rawCompId = company_id || companyId;
  let finalCompanyId = '';
  if (rawCompId && String(rawCompId).trim()) {
    finalCompanyId = String(rawCompId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  } else {
    const slug = String(companyName).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    finalCompanyId = `comp_${slug || 'corp'}_${Math.random().toString(36).substring(2, 6)}`;
  }

  const user_id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const hr_id = `hr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const password_hash = bcrypt.hashSync(password, 10);

  db.exec('BEGIN TRANSACTION;');
  try {
    const existingCompany = db.prepare('SELECT company_id, company_name FROM companies WHERE company_id = ?').get(finalCompanyId) as any;
    if (!existingCompany) {
      db.prepare(`
        INSERT INTO companies (
          company_id, company_name, description, location, contact_information,
          company_size, founded_year, is_company_id_public
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        finalCompanyId,
        companyName,
        companyDescription || '',
        companyLocation || '',
        email.toLowerCase(),
        '10-50 employees',
        new Date().getFullYear(),
        1
      );
    }

    db.prepare('INSERT INTO users (user_id, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      user_id,
      email.toLowerCase(),
      password_hash,
      'hr'
    );

    db.prepare('INSERT INTO hr_users (hr_id, user_id, company_id, name, phone) VALUES (?, ?, ?, ?, ?)').run(
      hr_id,
      user_id,
      finalCompanyId,
      name,
      phone || ''
    );

    db.prepare(`
      INSERT INTO notifications (notification_id, user_id, message, notification_type)
      VALUES (?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      user_id,
      `Welcome ${name}! Your HR account for ${existingCompany ? existingCompany.company_name : companyName} (Company ID: ${finalCompanyId}) has been initialized. You can now post jobs and manage talent.`,
      'WELCOME'
    );

    db.exec('COMMIT;');

    const authUser: AuthUser = {
      user_id,
      email: email.toLowerCase(),
      role: 'hr',
      hr_id,
      company_id: finalCompanyId,
      name,
    };

    const token = jwt.sign(authUser, JWT_SECRET);
    db.exec('PRAGMA wal_checkpoint(FULL);');
    return res.status(201).json({ message: 'HR registration successful', token, user: authUser });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ error: err.message || 'HR Registration failed' });
  }
});

// Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, company_id } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?').get(cleanEmail) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const cleanPassword = String(password);
  const valid =
    bcrypt.compareSync(cleanPassword, user.password_hash) ||
    bcrypt.compareSync(cleanPassword.trim(), user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  let authUser: AuthUser = {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    name: '',
  };

  if (user.role === 'candidate') {
    let cand = db.prepare('SELECT * FROM candidates WHERE user_id = ?').get(user.user_id) as any;
    if (!cand) {
      const newCandId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT OR IGNORE INTO candidates (candidate_id, user_id, name, phone, education, skills, experience, location, about)
        VALUES (?, ?, ?, '', '', '[]', '', '', '')
      `).run(newCandId, user.user_id, 'Candidate');
      cand = { candidate_id: newCandId, name: 'Candidate' };
    }
    authUser.candidate_id = cand.candidate_id;
    authUser.name = cand.name || 'Candidate';
  } else if (user.role === 'hr') {
    let hr = db.prepare('SELECT * FROM hr_users WHERE user_id = ?').get(user.user_id) as any;
    if (!hr) {
      const newHrId = `hr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const defaultCompId = `comp_${user.user_id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
      db.prepare(`
        INSERT OR IGNORE INTO companies (company_id, company_name, description, location, contact_information, company_size, founded_year, is_company_id_public)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(defaultCompId, 'My Organization', 'Direct recruitment', '', user.email, '10-50 employees', new Date().getFullYear());
      db.prepare(`
        INSERT OR IGNORE INTO hr_users (hr_id, user_id, company_id, name, phone)
        VALUES (?, ?, ?, ?, '')
      `).run(newHrId, user.user_id, defaultCompId, 'HR Recruiter');
      hr = { hr_id: newHrId, company_id: defaultCompId, name: 'HR Recruiter' };
    }
    authUser.hr_id = hr.hr_id;
    let targetCompanyId = hr.company_id;

    // If HR supplied a specific Company ID on login, verify and connect to that company
    if (company_id && String(company_id).trim()) {
      const cleanCompId = String(company_id).trim();
      const existingComp = db.prepare('SELECT * FROM companies WHERE LOWER(TRIM(company_id)) = LOWER(?)').get(cleanCompId) as any;
      if (existingComp) {
        targetCompanyId = existingComp.company_id;
        db.prepare('UPDATE hr_users SET company_id = ? WHERE user_id = ?').run(targetCompanyId, user.user_id);
      }
    }

    authUser.company_id = targetCompanyId;
    authUser.name = hr.name || 'HR Recruiter';
  }

  const token = jwt.sign(authUser, JWT_SECRET);
  db.exec('PRAGMA wal_checkpoint(FULL);');
  return res.json({ message: 'Login successful', token, user: authUser });
});

// HR Switch or Load Company by Company ID
apiRouter.post('/hr/switch-company', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const { company_id } = req.body;
  if (!company_id || !String(company_id).trim()) {
    return res.status(400).json({ error: 'Company ID is required.' });
  }

  const cleanCompId = String(company_id).trim();
  const company = db.prepare('SELECT * FROM companies WHERE company_id = ?').get(cleanCompId) as any;
  if (!company) {
    return res.status(404).json({
      error: `Company with ID "${cleanCompId}" was not found in the system.`,
    });
  }

  // Update HR record
  db.prepare('UPDATE hr_users SET company_id = ? WHERE user_id = ?').run(company.company_id, req.user!.user_id);

  const updatedAuthUser: AuthUser = {
    user_id: req.user!.user_id,
    email: req.user!.email,
    role: req.user!.role,
    name: req.user!.name,
    hr_id: req.user!.hr_id,
    company_id: company.company_id,
  };

  const token = jwt.sign(updatedAuthUser, JWT_SECRET);
  db.exec('PRAGMA wal_checkpoint(FULL);');
  return res.json({
    message: `Connected to ${company.company_name} (${company.company_id}) successfully!`,
    token,
    user: updatedAuthUser,
    company,
  });
});

// List all registered companies with search, filter, and public fields
apiRouter.get('/companies', (req: Request, res: Response) => {
  const { search, industry, location } = req.query;

  let query = `
    SELECT
      c.company_id,
      c.company_name,
      c.logo,
      c.description,
      c.website,
      c.location,
      c.industry,
      c.company_size,
      c.founded_year,
      c.is_company_id_public,
      (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.company_id AND j.status = 'Active') AS active_jobs_count
    FROM companies c
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search && String(search).trim()) {
    query += ` AND (LOWER(c.company_name) LIKE ? OR LOWER(c.description) LIKE ? OR LOWER(c.industry) LIKE ? OR LOWER(c.location) LIKE ?)`;
    const s = `%${String(search).trim().toLowerCase()}%`;
    params.push(s, s, s, s);
  }

  if (industry && String(industry).trim() && industry !== 'All') {
    query += ` AND LOWER(c.industry) LIKE ?`;
    params.push(`%${String(industry).trim().toLowerCase()}%`);
  }

  if (location && String(location).trim() && location !== 'All') {
    query += ` AND LOWER(c.location) LIKE ?`;
    params.push(`%${String(location).trim().toLowerCase()}%`);
  }

  query += ` ORDER BY c.company_name ASC`;

  const rows = db.prepare(query).all(...params) as any[];

  const companies = rows.map((c) => ({
    company_id: c.company_id,
    company_name: c.company_name,
    logo: c.logo,
    description: c.description,
    website: c.website,
    location: c.location,
    industry: c.industry,
    company_size: c.company_size || '100-500 employees',
    founded_year: c.founded_year || 2018,
    is_company_id_public: Boolean(c.is_company_id_public),
    public_company_id: c.is_company_id_public ? c.company_id : null,
    active_jobs_count: Number(c.active_jobs_count) || 0,
  }));

  return res.json({ companies });
});

// Dedicated Public Company Profile endpoint for authenticated HR users (and candidates)
apiRouter.get('/companies/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const targetCompanyId = req.params.id;
  const company = db.prepare(`
    SELECT company_id, company_name, logo, description, website, location,
           industry, company_size, founded_year, is_company_id_public, created_at
    FROM companies
    WHERE company_id = ?
  `).get(targetCompanyId) as any;

  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  // Active Job Posts for this company - public information only
  // Excludes internal HR IDs, applicants, and private recruitment notes
  const activeJobs = db.prepare(`
    SELECT job_id, company_id, title, description, required_skills, experience_required,
           education_requirement, location, salary_range, job_type, openings, deadline,
           status, posted_at, weight_skills, weight_experience, weight_education, weight_location,
           weight_certifications, min_fit_score, fit_score_enabled
    FROM jobs
    WHERE company_id = ? AND status = 'Active'
    ORDER BY posted_at DESC
  `).all(targetCompanyId) as any[];

  const isOwnCompany = req.user?.company_id === company.company_id;
  const isPublicId = Boolean(company.is_company_id_public);

  return res.json({
    company: {
      company_id: company.company_id,
      company_name: company.company_name,
      logo: company.logo,
      description: company.description,
      website: company.website,
      location: company.location,
      industry: company.industry,
      company_size: company.company_size || '100-500 employees',
      founded_year: company.founded_year || 2018,
      is_company_id_public: isPublicId,
      public_company_id: isPublicId || isOwnCompany ? company.company_id : null,
      is_own_company: isOwnCompany,
      active_jobs_count: activeJobs.length,
      active_jobs: activeJobs,
      created_at: company.created_at,
    },
  });
});

// Me endpoint
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role === 'candidate') {
    const cand = db.prepare('SELECT * FROM candidates WHERE user_id = ?').get(user.user_id) as any;
    const resume = db.prepare('SELECT * FROM resumes WHERE candidate_id = ? ORDER BY uploaded_at DESC LIMIT 1').get(cand?.candidate_id || '') as any;
    const completion = cand ? calculateProfileCompletion(cand, !!resume) : 0;
    return res.json({
      ...user,
      profile: cand,
      resume,
      profileCompletion: completion,
    });
  } else {
    const hr = db.prepare('SELECT * FROM hr_users WHERE user_id = ?').get(user.user_id) as any;
    const company = db.prepare('SELECT * FROM companies WHERE company_id = ?').get(hr?.company_id || '') as any;
    return res.json({
      ...user,
      profile: hr,
      company,
    });
  }
});

// ==========================================
// 2. CANDIDATE PROFILE & RESUME
// ==========================================

apiRouter.get('/candidate/profile', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res: Response) => {
  const candidate_id = req.user!.candidate_id || '';
  const cand = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?').get(candidate_id) as any;
  if (!cand) return res.status(404).json({ error: 'Candidate profile not found' });

  const resume = db.prepare('SELECT resume_id, candidate_id, file_name, file_url, file_size, uploaded_at FROM resumes WHERE candidate_id = ? ORDER BY uploaded_at DESC LIMIT 1').get(cand.candidate_id) as any;
  const completion = calculateProfileCompletion(cand, !!resume);

  return res.json({
    candidate: cand,
    resume,
    profileCompletion: completion,
  });
});

apiRouter.put('/candidate/profile', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    phone,
    education,
    skills,
    experience,
    location,
    profile_photo,
    about,
    certifications,
    github_url,
    linkedin_url,
  } = req.body;
  const candidate_id = req.user!.candidate_id || '';

  let skillsJson = '[]';
  if (Array.isArray(skills)) {
    skillsJson = JSON.stringify(skills);
  } else if (typeof skills === 'string') {
    try {
      JSON.parse(skills);
      skillsJson = skills;
    } catch {
      skillsJson = JSON.stringify(skills.split(',').map((s: string) => s.trim()).filter(Boolean));
    }
  }

  const existing = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?').get(candidate_id) as any;
  if (!existing) return res.status(404).json({ error: 'Candidate not found' });

  db.prepare(`
    UPDATE candidates
    SET name = ?,
        phone = ?,
        education = ?,
        skills = ?,
        experience = ?,
        location = ?,
        profile_photo = ?,
        about = ?,
        certifications = ?,
        github_url = ?,
        linkedin_url = ?
    WHERE candidate_id = ?
  `).run(
    name ?? existing.name,
    phone ?? existing.phone,
    education ?? existing.education,
    skillsJson,
    experience ?? existing.experience,
    location ?? existing.location,
    profile_photo ?? existing.profile_photo,
    about ?? existing.about,
    certifications ?? existing.certifications,
    github_url ?? existing.github_url,
    linkedin_url ?? existing.linkedin_url,
    candidate_id
  );

  // Recalculate Fit Score for all applications by this candidate
  const candidateApps = db.prepare(`SELECT application_id FROM applications WHERE candidate_id = ?`).all(candidate_id) as any[];
  for (const a of candidateApps) {
    syncApplicationFitScore(a.application_id);
  }

  const updated = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?').get(candidate_id) as any;
  const resume = db.prepare('SELECT resume_id FROM resumes WHERE candidate_id = ? LIMIT 1').get(candidate_id);
  const completion = calculateProfileCompletion(updated, !!resume);

  return res.json({ message: 'Profile updated successfully', candidate: updated, profileCompletion: completion });
});

// Resume upload / replace
apiRouter.post('/candidate/resume', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res: Response) => {
  const { file_name, file_data, file_size } = req.body;
  const candidate_id = req.user!.candidate_id || '';

  if (!file_name || !file_data) {
    return res.status(400).json({ error: 'File name and file content are required.' });
  }

  const resume_id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const file_url = `/api/resumes/${resume_id}/download`;

  db.prepare(`
    INSERT INTO resumes (resume_id, candidate_id, file_name, file_url, file_data, file_size)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(resume_id, candidate_id, file_name, file_url, file_data, Number(file_size) || file_data.length);

  // Send candidate notification
  db.prepare(`
    INSERT INTO notifications (notification_id, user_id, message, notification_type)
    VALUES (?, ?, ?, ?)
  `).run(
    `notif_${Date.now()}`,
    req.user!.user_id,
    `Your resume "${file_name}" has been uploaded successfully and attached to your candidate profile.`,
    'RESUME_UPLOADED'
  );

  return res.status(201).json({
    message: 'Resume uploaded successfully',
    resume: {
      resume_id,
      candidate_id,
      file_name,
      file_url,
      file_size: Number(file_size) || file_data.length,
      uploaded_at: new Date().toISOString(),
    },
  });
});

// Download / View resume
apiRouter.get('/resumes/:id/download', (req: Request, res: Response) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE resume_id = ?').get(req.params.id) as any;
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${resume.file_name}"`);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.send(resume.file_data || 'Resume Content Preview');
});

// ==========================================
// 3. JOBS (BROWSE, SEARCH, POST, EDIT)
// ==========================================

// List jobs with filters and candidate match score
apiRouter.get('/jobs', (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  let candidate: any = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as AuthUser;
      if (decoded.role === 'candidate' && decoded.candidate_id) {
        candidate = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?').get(decoded.candidate_id);
      }
    } catch {}
  }

  const { search, skill, location, job_type, status, company_id } = req.query;

  let query = `
    SELECT j.*, 
           COALESCE(c.company_name, j.company_id, 'Hiring Organization') as company_name, 
           c.logo as company_logo, 
           COALESCE(c.industry, 'Technology') as company_industry, 
           COALESCE(c.location, j.location) as company_location
    FROM jobs j
    LEFT JOIN companies c ON LOWER(TRIM(j.company_id)) = LOWER(TRIM(c.company_id))
    WHERE 1=1
  `;
  const params: any[] = [];

  if (company_id) {
    query += ' AND LOWER(TRIM(j.company_id)) = LOWER(TRIM(?))';
    params.push(String(company_id));
  }

  if (status) {
    query += ' AND LOWER(TRIM(j.status)) = LOWER(TRIM(?))';
    params.push(String(status));
  } else {
    query += " AND LOWER(TRIM(j.status)) = 'active'";
  }

  if (search) {
    query += ` AND (LOWER(j.title) LIKE ? OR LOWER(j.description) LIKE ? OR LOWER(c.company_name) LIKE ?)`;
    const s = `%${String(search).toLowerCase()}%`;
    params.push(s, s, s);
  }

  if (skill) {
    query += ` AND LOWER(j.required_skills) LIKE ?`;
    params.push(`%${String(skill).toLowerCase()}%`);
  }

  if (location) {
    query += ` AND LOWER(j.location) LIKE ?`;
    params.push(`%${String(location).toLowerCase()}%`);
  }

  if (job_type) {
    query += ` AND LOWER(j.job_type) = LOWER(?)`;
    params.push(String(job_type));
  }

  query += ' ORDER BY j.posted_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  // Candidate applications check
  const appliedJobIds = new Set<string>();
  if (candidate && candidate.candidate_id) {
    const apps = db.prepare('SELECT job_id FROM applications WHERE candidate_id = ?').all(candidate.candidate_id) as any[];
    for (const a of apps) appliedJobIds.add(a.job_id);
  }

  const enriched = rows.map((job) => {
    let matchData = null;
    if (candidate) {
      matchData = calculateCandidateJobMatch(candidate, job);
    }

    return {
      ...job,
      already_applied: appliedJobIds.has(job.job_id),
      match_score: matchData ? matchData.score : null,
      match_reasons: matchData ? matchData.reasons : [],
      match_factors: matchData ? matchData.factors : [],
      recommendation_level: matchData ? matchData.recommendationLevel : null,
    };
  });

  return res.json({ jobs: enriched, total: enriched.length });
});

// HR Company Requisitions (Strictly Scoped to Authenticated HR Company & HR Recruiter)
apiRouter.get('/hr/jobs', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  let company_id = (req.user?.company_id || '').trim();
  let hr_id = (req.user?.hr_id || '').trim();

  if (!company_id || !hr_id) {
    const hrRecord = db.prepare('SELECT hr_id, company_id FROM hr_users WHERE user_id = ?').get(req.user!.user_id) as any;
    if (hrRecord) {
      if (!company_id && hrRecord.company_id) company_id = hrRecord.company_id.trim();
      if (!hr_id && hrRecord.hr_id) hr_id = hrRecord.hr_id.trim();
    }
  }

  const { status, search } = req.query;

  let query = `
    SELECT j.*, 
           COALESCE(c.company_name, j.company_id, 'Hiring Organization') as company_name, 
           c.logo as company_logo,
           (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) as applicant_count
    FROM jobs j
    LEFT JOIN companies c ON LOWER(TRIM(j.company_id)) = LOWER(TRIM(c.company_id))
    WHERE (LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ?)
  `;
  const params: any[] = [company_id, hr_id];

  if (status && status !== 'All') {
    query += ' AND LOWER(TRIM(j.status)) = LOWER(TRIM(?))';
    params.push(String(status));
  }

  if (search && String(search).trim()) {
    query += ` AND (LOWER(j.title) LIKE ? OR LOWER(j.description) LIKE ?)`;
    const s = `%${String(search).trim().toLowerCase()}%`;
    params.push(s, s);
  }

  query += ' ORDER BY j.posted_at DESC';

  const rows = db.prepare(query).all(...params) as any[];
  return res.json({ jobs: rows, total: rows.length });
});

// Single Job Details
apiRouter.get('/jobs/:id', (req: AuthenticatedRequest, res: Response) => {
  const job = db.prepare(`
    SELECT j.*, 
           COALESCE(c.company_name, j.company_id, 'Hiring Organization') as company_name, 
           c.logo as company_logo, 
           c.description as company_description,
           c.website as company_website, 
           COALESCE(c.location, j.location) as company_location, 
           c.industry as company_industry,
           c.contact_information as company_contact
    FROM jobs j
    LEFT JOIN companies c ON LOWER(TRIM(j.company_id)) = LOWER(TRIM(c.company_id))
    WHERE j.job_id = ?
  `).get(req.params.id) as any;

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const authHeader = req.headers.authorization;
  let candidate: any = null;
  let application: any = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as AuthUser;
      if (decoded.role === 'candidate' && decoded.candidate_id) {
        candidate = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?').get(decoded.candidate_id);
        application = db.prepare(`
          SELECT a.*, r.file_name as resume_name, r.file_url as resume_url
          FROM applications a
          LEFT JOIN resumes r ON a.resume_id = r.resume_id
          WHERE a.candidate_id = ? AND a.job_id = ?
        `).get(decoded.candidate_id, job.job_id);
      }
    } catch {}
  }

  let matchData = null;
  if (candidate) {
    matchData = calculateCandidateJobMatch(candidate, job);
  }

  // Strip internal HR ID from public response
  delete job.hr_id;

  return res.json({
    job: {
      ...job,
      already_applied: !!application,
      application,
      match_score: matchData ? matchData.score : null,
      match_reasons: matchData ? matchData.reasons : [],
      match_factors: matchData ? matchData.factors : [],
      recommendation_level: matchData ? matchData.recommendationLevel : null,
    },
  });
});

// Post Job (HR only)
apiRouter.post('/jobs', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    description,
    required_skills,
    experience_required,
    education_requirement,
    location,
    salary_range,
    job_type,
    openings,
    deadline,
    status,
    weight_skills,
    weight_experience,
    weight_education,
    weight_location,
    weight_certifications,
    min_fit_score,
    fit_score_enabled,
  } = req.body;

  if (!title || !description || !location || !salary_range || !deadline) {
    return res.status(400).json({ error: 'Title, description, location, salary range, and deadline are required.' });
  }

  const job_id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let company_id = (req.user?.company_id || '').trim();
  let hr_id = (req.user?.hr_id || '').trim();

  // If company_id or hr_id not in token, look them up from hr_users by user_id
  if (!company_id || !hr_id) {
    const hrRecord = db.prepare('SELECT hr_id, company_id FROM hr_users WHERE user_id = ?').get(req.user!.user_id) as any;
    if (hrRecord) {
      if (!company_id && hrRecord.company_id) company_id = hrRecord.company_id.trim();
      if (!hr_id && hrRecord.hr_id) hr_id = hrRecord.hr_id.trim();
    }
  }

  // If still no company_id, generate a default one for this user
  if (!company_id) {
    company_id = `comp_${req.user!.user_id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
  }

  // Ensure this company exists in companies table so queries and candidate listings never fail
  const existingComp = db.prepare('SELECT company_id, company_name FROM companies WHERE LOWER(TRIM(company_id)) = LOWER(?)').get(company_id) as any;
  if (!existingComp) {
    const defaultCompanyName = req.user?.name ? `${req.user.name}'s Organization` : 'Hiring Organization';
    db.prepare(`
      INSERT OR IGNORE INTO companies (company_id, company_name, description, location, contact_information, company_size, founded_year, is_company_id_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      company_id,
      defaultCompanyName,
      'Direct employer recruitment portal',
      location || 'Remote',
      req.user?.email || '',
      '10-50 employees',
      new Date().getFullYear()
    );
  } else {
    company_id = existingComp.company_id;
  }

  let skillsJson = '[]';
  if (Array.isArray(required_skills)) {
    skillsJson = JSON.stringify(required_skills);
  } else if (typeof required_skills === 'string') {
    skillsJson = JSON.stringify(required_skills.split(',').map((s: string) => s.trim()).filter(Boolean));
  }

  db.prepare(`
    INSERT INTO jobs (
      job_id, company_id, hr_id, title, description, required_skills,
      experience_required, education_requirement, location, salary_range,
      job_type, openings, deadline, status,
      weight_skills, weight_experience, weight_education, weight_location, weight_certifications,
      min_fit_score, fit_score_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job_id,
    company_id,
    hr_id,
    title,
    description,
    skillsJson,
    experience_required || '1-3 years',
    education_requirement || "Bachelor's degree or equivalent",
    location,
    salary_range,
    job_type || 'Full-time',
    Number(openings) || 1,
    deadline,
    status || 'Active',
    weight_skills !== undefined ? Number(weight_skills) : 40,
    weight_experience !== undefined ? Number(weight_experience) : 25,
    weight_education !== undefined ? Number(weight_education) : 15,
    weight_location !== undefined ? Number(weight_location) : 10,
    weight_certifications !== undefined ? Number(weight_certifications) : 10,
    min_fit_score !== undefined ? Number(min_fit_score) : 60,
    fit_score_enabled !== undefined ? (fit_score_enabled ? 1 : 0) : 1
  );

  // Flush SQLite WAL to disk permanently so the job stays visible even if HR logs out or browser closes
  db.exec('PRAGMA wal_checkpoint(FULL);');

  return res.status(201).json({ message: 'Job posted successfully', job_id, company_id });
});

// Edit Job (HR only)
apiRouter.put('/jobs/:id', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const job_id = req.params.id;
  const company_id = req.user!.company_id || '';

  const existing = db.prepare('SELECT * FROM jobs WHERE job_id = ? AND company_id = ?').get(job_id, company_id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Job not found or unauthorized to edit.' });
  }

  const {
    title,
    description,
    required_skills,
    experience_required,
    education_requirement,
    location,
    salary_range,
    job_type,
    openings,
    deadline,
    status,
    weight_skills,
    weight_experience,
    weight_education,
    weight_location,
    weight_certifications,
    min_fit_score,
    fit_score_enabled,
  } = req.body;

  let skillsJson = existing.required_skills;
  if (required_skills !== undefined) {
    if (Array.isArray(required_skills)) {
      skillsJson = JSON.stringify(required_skills);
    } else if (typeof required_skills === 'string') {
      skillsJson = JSON.stringify(required_skills.split(',').map((s: string) => s.trim()).filter(Boolean));
    }
  }

  db.prepare(`
    UPDATE jobs
    SET title = ?,
        description = ?,
        required_skills = ?,
        experience_required = ?,
        education_requirement = ?,
        location = ?,
        salary_range = ?,
        job_type = ?,
        openings = ?,
        deadline = ?,
        status = ?,
        weight_skills = ?,
        weight_experience = ?,
        weight_education = ?,
        weight_location = ?,
        weight_certifications = ?,
        min_fit_score = ?,
        fit_score_enabled = ?
    WHERE job_id = ? AND company_id = ?
  `).run(
    title ?? existing.title,
    description ?? existing.description,
    skillsJson,
    experience_required ?? existing.experience_required,
    education_requirement ?? existing.education_requirement,
    location ?? existing.location,
    salary_range ?? existing.salary_range,
    job_type ?? existing.job_type,
    openings !== undefined ? Number(openings) : existing.openings,
    deadline ?? existing.deadline,
    status ?? existing.status,
    weight_skills !== undefined ? Number(weight_skills) : (existing.weight_skills ?? 40),
    weight_experience !== undefined ? Number(weight_experience) : (existing.weight_experience ?? 25),
    weight_education !== undefined ? Number(weight_education) : (existing.weight_education ?? 15),
    weight_location !== undefined ? Number(weight_location) : (existing.weight_location ?? 10),
    weight_certifications !== undefined ? Number(weight_certifications) : (existing.weight_certifications ?? 10),
    min_fit_score !== undefined ? Number(min_fit_score) : (existing.min_fit_score ?? 60),
    fit_score_enabled !== undefined ? (fit_score_enabled ? 1 : 0) : (existing.fit_score_enabled ?? 1),
    job_id,
    company_id
  );

  // Recalculate Fit Scores for all applications to this job
  const jobApps = db.prepare(`SELECT application_id FROM applications WHERE job_id = ?`).all(job_id) as any[];
  for (const a of jobApps) {
    syncApplicationFitScore(a.application_id);
  }

  return res.json({ message: 'Job updated successfully' });
});

// Delete Job (HR only)
apiRouter.delete('/jobs/:id', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const job_id = req.params.id;
  const company_id = req.user!.company_id || '';

  const result = db.prepare('DELETE FROM jobs WHERE job_id = ? AND company_id = ?').run(job_id, company_id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Job not found or unauthorized' });
  }

  return res.json({ message: 'Job deleted successfully' });
});

// ==========================================
// 4. APPLICATIONS WORKFLOW & FIT SCORE RANKING
// ==========================================

// Apply to Job (Candidate only)
apiRouter.post('/jobs/:id/apply', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res: Response) => {
  const job_id = req.params.id;
  const candidate_id = req.user!.candidate_id || '';
  const user_id = req.user!.user_id;

  const job = db.prepare(`
    SELECT j.*, 
           COALESCE(c.company_name, j.company_id, 'Hiring Organization') as company_name
    FROM jobs j
    LEFT JOIN companies c ON LOWER(TRIM(j.company_id)) = LOWER(TRIM(c.company_id))
    WHERE j.job_id = ?
  `).get(job_id) as any;

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (String(job.status || '').toLowerCase().trim() !== 'active') {
    return res.status(400).json({ error: 'This job posting is no longer active for applications.' });
  }

  // Check duplicate application via application logic
  const existingApp = db.prepare('SELECT application_id FROM applications WHERE candidate_id = ? AND job_id = ?').get(candidate_id, job_id);
  if (existingApp) {
    return res.status(400).json({ error: 'Already Applied: You have already submitted an application for this position.' });
  }

  let candidate = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?').get(candidate_id) as any;
  if (!candidate) {
    const newCandId = candidate_id || `cand_${Date.now()}`;
    db.prepare(`
      INSERT OR IGNORE INTO candidates (candidate_id, user_id, name, phone, education, skills, experience, location, about)
      VALUES (?, ?, ?, '', '', '[]', '', '', '')
    `).run(newCandId, user_id, req.user?.name || 'Candidate');
    candidate = { candidate_id: newCandId, name: req.user?.name || 'Candidate' };
  }

  let resume = db.prepare('SELECT * FROM resumes WHERE candidate_id = ? ORDER BY uploaded_at DESC LIMIT 1').get(candidate_id) as any;

  if (!resume) {
    const resume_id = `res_${Date.now()}_auto`;
    const candName = candidate?.name || 'Candidate';
    const autoResumeText = `${candName}\n${candidate?.phone || ''} | ${req.user!.email}\nLocation: ${candidate?.location || 'N/A'}\n\nEDUCATION:\n${candidate?.education || 'N/A'}\n\nEXPERIENCE:\n${candidate?.experience || 'N/A'}\n\nSKILLS:\n${candidate?.skills || 'N/A'}\n\nABOUT:\n${candidate?.about || ''}`;

    db.prepare(`
      INSERT INTO resumes (resume_id, candidate_id, file_name, file_url, file_data, file_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      resume_id,
      candidate_id,
      `${candName.replace(/\s+/g, '_')}_Resume.txt`,
      `/api/resumes/${resume_id}/download`,
      autoResumeText,
      autoResumeText.length
    );

    resume = { resume_id, file_name: `${candName.replace(/\s+/g, '_')}_Resume.txt` };
  }

  // Compute Objective Candidate Fit Score
  const matchResult = calculateCandidateJobMatch(candidate, job);

  const application_id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO applications (
        application_id, candidate_id, company_id, job_id, resume_id,
        status, fit_score, fit_reasons, skills_matched_count, skills_total_count, experience_status
      ) VALUES (?, ?, ?, ?, ?, 'Applied', ?, ?, ?, ?, ?)
    `).run(
      application_id,
      candidate_id,
      job.company_id,
      job_id,
      resume.resume_id,
      matchResult.score,
      JSON.stringify(matchResult.reasons),
      matchResult.skillsMatchedCount,
      matchResult.skillsTotalCount,
      matchResult.experienceStatus
    );

    // Notify the specific HR User who owns/posted this job, or the company's HR
    let hrUser: any = null;
    if (job.hr_id) {
      hrUser = db.prepare(`
        SELECT u.user_id, h.name as hr_name
        FROM hr_users h
        JOIN users u ON h.user_id = u.user_id
        WHERE h.hr_id = ?
      `).get(job.hr_id) as any;
    }
    if (!hrUser && job.company_id) {
      hrUser = db.prepare(`
        SELECT u.user_id, h.name as hr_name
        FROM hr_users h
        JOIN users u ON h.user_id = u.user_id
        WHERE LOWER(TRIM(h.company_id)) = LOWER(TRIM(?))
        LIMIT 1
      `).get(job.company_id) as any;
    }

    if (hrUser) {
      db.prepare(`
        INSERT INTO notifications (notification_id, user_id, application_id, message, notification_type)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        `notif_${Date.now()}_hr`,
        hrUser.user_id,
        application_id,
        `New application received from ${candidate?.name || 'Candidate'} for ${job.title} at ${job.company_name} (Fit Score: ${matchResult.score}%).`,
        'APPLICATION_RECEIVED'
      );
    }

    // Notify Candidate
    db.prepare(`
      INSERT INTO notifications (notification_id, user_id, application_id, message, notification_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}_cand`,
      user_id,
      application_id,
      `Your application for ${job.title} at ${job.company_name} has been submitted successfully. Attached resume: ${resume.file_name}.`,
      'APPLICATION_SUBMITTED'
    );

    db.exec('COMMIT;');
    db.exec('PRAGMA wal_checkpoint(FULL);');

    return res.status(201).json({
      message: 'Application submitted successfully!',
      application: {
        application_id,
        candidate_id,
        company_id: job.company_id,
        company_name: job.company_name,
        job_id,
        job_title: job.title,
        resume_id: resume.resume_id,
        status: 'Applied',
        fit_score: matchResult.score,
        applied_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Already Applied: You have already applied for this job.' });
    }
    return res.status(500).json({ error: err.message || 'Failed to submit application' });
  }
});

// Candidate Applications List
apiRouter.get('/candidate/applications', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res: Response) => {
  const candidate_id = req.user!.candidate_id || '';

  const applications = db.prepare(`
    SELECT
      a.application_id,
      a.candidate_id,
      a.company_id,
      a.job_id,
      a.resume_id,
      a.applied_at,
      a.status,
      a.fit_score,
      a.fit_reasons,
      a.skills_matched_count,
      a.skills_total_count,
      a.experience_status,
      j.title as job_title,
      j.location as job_location,
      j.salary_range,
      j.job_type,
      c.company_name,
      c.logo as company_logo,
      c.industry as company_industry,
      r.file_name as resume_name,
      r.file_url as resume_url,
      i.interview_id,
      i.interview_date,
      i.interview_time,
      i.interview_type,
      i.location_or_meeting_info,
      i.interviewer,
      i.notes as interview_notes,
      i.status as interview_status
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    JOIN companies c ON a.company_id = c.company_id
    LEFT JOIN resumes r ON a.resume_id = r.resume_id
    LEFT JOIN interviews i ON a.application_id = i.application_id
    WHERE a.candidate_id = ?
    ORDER BY a.applied_at DESC
  `).all(candidate_id) as any[];

  return res.json({ applications, total: applications.length });
});

// HR Applications List - STRICT TENANT ISOLATION + CANDIDATE FIT SCORE RANKING
apiRouter.get('/hr/applications', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  let company_id = (req.user?.company_id || '').trim();
  let hr_id = (req.user?.hr_id || '').trim();

  if (!company_id || !hr_id) {
    const hrRecord = db.prepare('SELECT hr_id, company_id FROM hr_users WHERE user_id = ?').get(req.user!.user_id) as any;
    if (hrRecord) {
      if (!company_id && hrRecord.company_id) company_id = hrRecord.company_id.trim();
      if (!hr_id && hrRecord.hr_id) hr_id = hrRecord.hr_id.trim();
    }
  }

  const { job_id, status, min_fit_score, sort_by } = req.query;

  let query = `
    SELECT
      a.application_id,
      a.candidate_id,
      a.company_id,
      a.job_id,
      a.resume_id,
      a.applied_at,
      a.status,
      a.fit_score,
      a.fit_reasons,
      a.skills_matched_count,
      a.skills_total_count,
      a.experience_status,
      j.title as job_title,
      j.required_skills as job_required_skills,
      j.experience_required as job_experience_required,
      j.education_requirement as job_education_requirement,
      j.location as job_location,
      COALESCE(c.company_name, j.company_id, 'Hiring Organization') as company_name,
      cand.name as candidate_name,
      cand.phone as candidate_phone,
      cand.education as candidate_education,
      cand.skills as candidate_skills,
      cand.experience as candidate_experience,
      cand.location as candidate_location,
      cand.profile_photo as candidate_photo,
      cand.about as candidate_about,
      cand.certifications as candidate_certifications,
      cand.github_url as candidate_github,
      cand.linkedin_url as candidate_linkedin,
      u.email as candidate_email,
      r.file_name as resume_name,
      r.file_url as resume_url,
      r.file_data as resume_data,
      i.interview_id,
      i.interview_date,
      i.interview_time,
      i.interview_type,
      i.location_or_meeting_info,
      i.interviewer,
      i.status as interview_status
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    LEFT JOIN companies c ON LOWER(TRIM(a.company_id)) = LOWER(TRIM(c.company_id))
    JOIN candidates cand ON a.candidate_id = cand.candidate_id
    JOIN users u ON cand.user_id = u.user_id
    LEFT JOIN resumes r ON a.resume_id = r.resume_id
    LEFT JOIN interviews i ON a.application_id = i.application_id
    WHERE (LOWER(TRIM(a.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)))
  `;
  const params: any[] = [company_id, hr_id, company_id];

  // If specific job_id is requested, also enforce that the job belongs to this company
  if (job_id && String(job_id) !== 'All') {
    query += ' AND a.job_id = ?';
    params.push(String(job_id));
  }

  // Application status filter (kept completely separate from Fit Score)
  if (status && String(status) !== 'All') {
    query += ' AND a.status = ?';
    params.push(String(status));
  }

  const rows = db.prepare(query).all(...params) as any[];

  // Recalculate and enrich Candidate Fit Scores objectively
  let enriched = rows.map((app) => {
    const match = calculateCandidateJobMatch(
      {
        skills: app.candidate_skills,
        experience: app.candidate_experience,
        education: app.candidate_education,
        location: app.candidate_location,
        certifications: app.candidate_certifications,
      },
      {
        required_skills: app.job_required_skills,
        experience_required: app.job_experience_required,
        education_requirement: app.job_education_requirement,
        location: app.job_location,
      }
    );

    return {
      ...app,
      fit_score: match.score,
      match_score: match.score,
      match_factors: match.factors,
      match_reasons: match.reasons,
      skills_matched_count: match.skillsMatchedCount,
      skills_total_count: match.skillsTotalCount,
      skills_match_ratio: match.skillsMatchRatio,
      experience_status: match.experienceStatus,
      recommendation_level: match.recommendationLevel,
    };
  });

  // Filter by minimum Fit Score if requested
  if (min_fit_score && !isNaN(Number(min_fit_score))) {
    const minScore = Number(min_fit_score);
    enriched = enriched.filter((a) => a.fit_score >= minScore);
  }

  // HR Candidate Arrangement:
  // Automatically arrange candidates by Fit Score in descending order by default (highest-fit candidates first)
  const sortMode = String(sort_by || 'fit_score_desc');
  if (sortMode === 'fit_score_desc') {
    enriched.sort((a, b) => b.fit_score - a.fit_score);
  } else if (sortMode === 'fit_score_asc') {
    enriched.sort((a, b) => a.fit_score - b.fit_score);
  } else if (sortMode === 'applied_at_desc') {
    enriched.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
  } else if (sortMode === 'name_asc') {
    enriched.sort((a, b) => (a.candidate_name || '').localeCompare(b.candidate_name || ''));
  }

  // Assign Rank (1, 2, 3...)
  const ranked = enriched.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return res.json({ applications: ranked, total: ranked.length });
});

// HR Update Application Status ONLY (Fit Score cannot be manually modified by HR)
apiRouter.put('/hr/applications/:id/status', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const application_id = req.params.id;
  let company_id = (req.user?.company_id || '').trim();
  let hr_id = (req.user?.hr_id || '').trim();

  if (!company_id || !hr_id) {
    const hrRecord = db.prepare('SELECT hr_id, company_id FROM hr_users WHERE user_id = ?').get(req.user!.user_id) as any;
    if (hrRecord) {
      if (!company_id && hrRecord.company_id) company_id = hrRecord.company_id.trim();
      if (!hr_id && hrRecord.hr_id) hr_id = hrRecord.hr_id.trim();
    }
  }

  const { status } = req.body;

  const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Not Selected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const app = db.prepare(`
    SELECT a.*, j.title as job_title, 
           COALESCE(c.company_name, j.company_id, 'Hiring Organization') as company_name, 
           cand.user_id as candidate_user_id
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    LEFT JOIN companies c ON LOWER(TRIM(a.company_id)) = LOWER(TRIM(c.company_id))
    JOIN candidates cand ON a.candidate_id = cand.candidate_id
    WHERE a.application_id = ? 
      AND (LOWER(TRIM(a.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)))
  `).get(application_id, company_id, hr_id, company_id) as any;

  if (!app) {
    return res.status(404).json({ error: 'Application not found or unauthorized' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('UPDATE applications SET status = ? WHERE application_id = ?').run(status, application_id);

    let message = `Your application for ${app.job_title} at ${app.company_name} status updated to ${status}.`;
    if (status === 'Under Review') {
      message = `Your application for ${app.job_title} at ${app.company_name} is under review.`;
    } else if (status === 'Shortlisted') {
      message = `You have been shortlisted for ${app.job_title} at ${app.company_name}.`;
    } else if (status === 'Selected') {
      message = `Congratulations! You have been selected for ${app.job_title} at ${app.company_name}.`;
    } else if (status === 'Not Selected') {
      message = `Your application for ${app.job_title} at ${app.company_name} was not selected.`;
    }

    db.prepare(`
      INSERT INTO notifications (notification_id, user_id, application_id, message, notification_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      app.candidate_user_id,
      application_id,
      message,
      'STATUS_UPDATED'
    );

    db.exec('COMMIT;');
    db.exec('PRAGMA wal_checkpoint(FULL);');
    return res.json({ message: 'Application status updated successfully', status });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ error: err.message || 'Failed to update status' });
  }
});

// ==========================================
// 5. INTERVIEWS
// ==========================================

// List Interviews
apiRouter.get('/interviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let rows: any[] = [];

  if (user.role === 'candidate') {
    rows = db.prepare(`
      SELECT i.*, j.title as job_title, 
             COALESCE(c.company_name, i.company_id, 'Hiring Organization') as company_name, 
             c.logo as company_logo
      FROM interviews i
      JOIN jobs j ON i.job_id = j.job_id
      LEFT JOIN companies c ON LOWER(TRIM(i.company_id)) = LOWER(TRIM(c.company_id))
      WHERE i.candidate_id = ?
      ORDER BY i.interview_date ASC, i.interview_time ASC
    `).all(user.candidate_id || '') as any[];
  } else if (user.role === 'hr') {
    let company_id = (user.company_id || '').trim();
    let hr_id = (user.hr_id || '').trim();
    if (!company_id || !hr_id) {
      const hrRecord = db.prepare('SELECT hr_id, company_id FROM hr_users WHERE user_id = ?').get(user.user_id) as any;
      if (hrRecord) {
        if (!company_id && hrRecord.company_id) company_id = hrRecord.company_id.trim();
        if (!hr_id && hrRecord.hr_id) hr_id = hrRecord.hr_id.trim();
      }
    }

    rows = db.prepare(`
      SELECT i.*, j.title as job_title, 
             COALESCE(c.company_name, i.company_id, 'Hiring Organization') as company_name, 
             cand.name as candidate_name, cand.phone as candidate_phone, u.email as candidate_email
      FROM interviews i
      JOIN jobs j ON i.job_id = j.job_id
      LEFT JOIN companies c ON LOWER(TRIM(i.company_id)) = LOWER(TRIM(c.company_id))
      JOIN candidates cand ON i.candidate_id = cand.candidate_id
      JOIN users u ON cand.user_id = u.user_id
      WHERE (LOWER(TRIM(i.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)))
      ORDER BY i.interview_date ASC, i.interview_time ASC
    `).all(company_id, hr_id, company_id) as any[];
  }

  return res.json({ interviews: rows, total: rows.length });
});

// Schedule Interview (HR only)
apiRouter.post('/interviews', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const {
    application_id,
    interview_date,
    interview_time,
    interview_type,
    location_or_meeting_info,
    interviewer,
    notes,
  } = req.body;

  if (!application_id || !interview_date || !interview_time || !location_or_meeting_info || !interviewer) {
    return res.status(400).json({ error: 'Application, date, time, meeting info, and interviewer are required.' });
  }

  let company_id = (req.user?.company_id || '').trim();
  let hr_id = (req.user?.hr_id || '').trim();
  if (!company_id || !hr_id) {
    const hrRecord = db.prepare('SELECT hr_id, company_id FROM hr_users WHERE user_id = ?').get(req.user!.user_id) as any;
    if (hrRecord) {
      if (!company_id && hrRecord.company_id) company_id = hrRecord.company_id.trim();
      if (!hr_id && hrRecord.hr_id) hr_id = hrRecord.hr_id.trim();
    }
  }

  const app = db.prepare(`
    SELECT a.*, j.title as job_title, 
           COALESCE(c.company_name, j.company_id, 'Hiring Organization') as company_name, 
           cand.user_id as candidate_user_id
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    LEFT JOIN companies c ON LOWER(TRIM(a.company_id)) = LOWER(TRIM(c.company_id))
    JOIN candidates cand ON a.candidate_id = cand.candidate_id
    WHERE a.application_id = ? 
      AND (LOWER(TRIM(a.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)))
  `).get(application_id, company_id, hr_id, company_id) as any;

  if (!app) {
    return res.status(404).json({ error: 'Application not found or unauthorized' });
  }

  const interview_id = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO interviews (
        interview_id, application_id, candidate_id, company_id, job_id,
        interview_date, interview_time, interview_type, location_or_meeting_info,
        interviewer, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')
    `).run(
      interview_id,
      application_id,
      app.candidate_id,
      app.company_id,
      app.job_id,
      interview_date,
      interview_time,
      interview_type || 'Technical Round',
      location_or_meeting_info,
      interviewer,
      notes || ''
    );

    db.prepare("UPDATE applications SET status = 'Interview Scheduled' WHERE application_id = ?").run(application_id);

    db.prepare(`
      INSERT INTO notifications (notification_id, user_id, application_id, message, notification_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      app.candidate_user_id,
      application_id,
      `An interview has been scheduled for ${app.job_title} at ${app.company_name} on ${interview_date} at ${interview_time}.`,
      'INTERVIEW_SCHEDULED'
    );

    db.exec('COMMIT;');
    db.exec('PRAGMA wal_checkpoint(FULL);');
    return res.status(201).json({ message: 'Interview scheduled successfully', interview_id });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ error: err.message || 'Failed to schedule interview' });
  }
});

// Update Interview status or details (HR only)
apiRouter.put('/interviews/:id', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const interview_id = req.params.id;
  let company_id = (req.user?.company_id || '').trim();
  let hr_id = (req.user?.hr_id || '').trim();

  if (!company_id || !hr_id) {
    const hrRecord = db.prepare('SELECT hr_id, company_id FROM hr_users WHERE user_id = ?').get(req.user!.user_id) as any;
    if (hrRecord) {
      if (!company_id && hrRecord.company_id) company_id = hrRecord.company_id.trim();
      if (!hr_id && hrRecord.hr_id) hr_id = hrRecord.hr_id.trim();
    }
  }

  const { status, notes, interview_date, interview_time, location_or_meeting_info, interviewer } = req.body;

  const interview = db.prepare(`
    SELECT i.*, j.title as job_title, 
           COALESCE(c.company_name, i.company_id, 'Hiring Organization') as company_name, 
           cand.user_id as candidate_user_id
    FROM interviews i
    JOIN jobs j ON i.job_id = j.job_id
    LEFT JOIN companies c ON LOWER(TRIM(i.company_id)) = LOWER(TRIM(c.company_id))
    JOIN candidates cand ON i.candidate_id = cand.candidate_id
    WHERE i.interview_id = ? 
      AND (LOWER(TRIM(i.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)))
  `).get(interview_id, company_id, hr_id, company_id) as any;

  if (!interview) {
    return res.status(404).json({ error: 'Interview not found or unauthorized' });
  }

  db.prepare(`
    UPDATE interviews
    SET status = ?,
        notes = ?,
        interview_date = ?,
        interview_time = ?,
        location_or_meeting_info = ?,
        interviewer = ?
    WHERE interview_id = ?
  `).run(
    status ?? interview.status,
    notes ?? interview.notes,
    interview_date ?? interview.interview_date,
    interview_time ?? interview.interview_time,
    location_or_meeting_info ?? interview.location_or_meeting_info,
    interviewer ?? interview.interviewer,
    interview_id
  );

  db.exec('PRAGMA wal_checkpoint(FULL);');

  if (status && status !== interview.status) {
    db.prepare(`
      INSERT INTO notifications (notification_id, user_id, application_id, message, notification_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      interview.candidate_user_id,
      interview.application_id,
      `Your interview for ${interview.job_title} at ${interview.company_name} status updated to: ${status}.`,
      'INTERVIEW_UPDATED'
    );
  }

  return res.json({ message: 'Interview updated successfully' });
});

// ==========================================
// 6. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user_id = req.user!.user_id;
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(user_id) as any[];

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  return res.json({ notifications, unreadCount });
});

apiRouter.put('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?').run(
    req.params.id,
    req.user!.user_id
  );
  return res.json({ message: 'Notification marked as read' });
});

apiRouter.put('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.user_id);
  return res.json({ message: 'All notifications marked as read' });
});

// ==========================================
// 7. COMPANY MANAGEMENT (HR)
// ==========================================

apiRouter.get('/company', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const company_id = req.user!.company_id || '';
  const company = db.prepare('SELECT * FROM companies WHERE company_id = ?').get(company_id);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  return res.json({ company });
});

apiRouter.put('/company', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const company_id = req.user!.company_id || '';
  const existing = db.prepare('SELECT * FROM companies WHERE company_id = ?').get(company_id) as any;
  if (!existing) return res.status(404).json({ error: 'Company not found' });

  // Explicit security assertion: company.id == authenticated_hr.company_id
  if (existing.company_id !== req.user!.company_id) {
    return res.status(403).json({ error: 'Forbidden: You are only authorized to edit your authenticated company profile.' });
  }

  const {
    company_name,
    logo,
    description,
    website,
    location,
    industry,
    contact_information,
    company_size,
    founded_year,
    is_company_id_public,
  } = req.body;

  db.prepare(`
    UPDATE companies
    SET company_name = ?,
        logo = ?,
        description = ?,
        website = ?,
        location = ?,
        industry = ?,
        contact_information = ?,
        company_size = ?,
        founded_year = ?,
        is_company_id_public = ?
    WHERE company_id = ?
  `).run(
    company_name ?? existing.company_name,
    logo ?? existing.logo,
    description ?? existing.description,
    website ?? existing.website,
    location ?? existing.location,
    industry ?? existing.industry,
    contact_information ?? existing.contact_information,
    company_size ?? existing.company_size ?? '100-500 employees',
    founded_year !== undefined ? Number(founded_year) : (existing.founded_year ?? 2018),
    is_company_id_public !== undefined ? (is_company_id_public ? 1 : 0) : (existing.is_company_id_public ?? 1),
    company_id
  );

  const updated = db.prepare('SELECT * FROM companies WHERE company_id = ?').get(company_id);
  return res.json({ message: 'Company profile updated successfully', company: updated });
});

// Explicit parameterized endpoint: prevents any URL-based parameter tampering
apiRouter.put('/companies/:id', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const authCompanyId = req.user!.company_id;

  // Strict cross-company authorization check
  if (!authCompanyId || targetId !== authCompanyId) {
    return res.status(403).json({
      error: 'Unauthorized: HR recruiters cannot modify other companies data. You may only edit your authenticated company.',
    });
  }

  const existing = db.prepare('SELECT * FROM companies WHERE company_id = ?').get(authCompanyId) as any;
  if (!existing) return res.status(404).json({ error: 'Company not found' });

  const {
    company_name,
    logo,
    description,
    website,
    location,
    industry,
    contact_information,
    company_size,
    founded_year,
    is_company_id_public,
  } = req.body;

  db.prepare(`
    UPDATE companies
    SET company_name = ?,
        logo = ?,
        description = ?,
        website = ?,
        location = ?,
        industry = ?,
        contact_information = ?,
        company_size = ?,
        founded_year = ?,
        is_company_id_public = ?
    WHERE company_id = ?
  `).run(
    company_name ?? existing.company_name,
    logo ?? existing.logo,
    description ?? existing.description,
    website ?? existing.website,
    location ?? existing.location,
    industry ?? existing.industry,
    contact_information ?? existing.contact_information,
    company_size ?? existing.company_size ?? '100-500 employees',
    founded_year !== undefined ? Number(founded_year) : (existing.founded_year ?? 2018),
    is_company_id_public !== undefined ? (is_company_id_public ? 1 : 0) : (existing.is_company_id_public ?? 1),
    authCompanyId
  );

  const updated = db.prepare('SELECT * FROM companies WHERE company_id = ?').get(authCompanyId);
  return res.json({ message: 'Company profile updated successfully', company: updated });
});

// ==========================================
// 8. DASHBOARD ANALYTICS
// ==========================================

// Candidate Dashboard Stats
apiRouter.get('/candidate/dashboard', requireAuth, requireRole('candidate'), (req: AuthenticatedRequest, res: Response) => {
  const candidate_id = req.user!.candidate_id || '';
  const user_id = req.user!.user_id;

  const candidate = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?').get(candidate_id) as any;
  const resume = db.prepare('SELECT * FROM resumes WHERE candidate_id = ? ORDER BY uploaded_at DESC LIMIT 1').get(candidate_id) as any;
  const profileCompletion = calculateProfileCompletion(candidate, !!resume);

  const totalApps = db.prepare('SELECT COUNT(*) as count FROM applications WHERE candidate_id = ?').get(candidate_id) as any;
  const shortlisted = db.prepare("SELECT COUNT(*) as count FROM applications WHERE candidate_id = ? AND status = 'Shortlisted'").get(candidate_id) as any;
  const selected = db.prepare("SELECT COUNT(*) as count FROM applications WHERE candidate_id = ? AND status = 'Selected'").get(candidate_id) as any;

  const upcomingInterviews = db.prepare(`
    SELECT i.*, j.title as job_title, 
           COALESCE(c.company_name, i.company_id, 'Hiring Organization') as company_name, 
           c.logo as company_logo
    FROM interviews i
    LEFT JOIN jobs j ON i.job_id = j.job_id
    LEFT JOIN companies c ON LOWER(TRIM(i.company_id)) = LOWER(TRIM(c.company_id))
    WHERE i.candidate_id = ? AND LOWER(TRIM(i.status)) = 'scheduled'
    ORDER BY i.interview_date ASC, i.interview_time ASC
    LIMIT 10
  `).all(candidate_id) as any[];

  const unreadNotifs = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user_id) as any;

  const recentApps = db.prepare(`
    SELECT a.*, j.title as job_title, j.location as job_location, 
           COALESCE(c.company_name, a.company_id, 'Hiring Organization') as company_name, 
           c.logo as company_logo
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.job_id
    LEFT JOIN companies c ON LOWER(TRIM(a.company_id)) = LOWER(TRIM(c.company_id))
    WHERE a.candidate_id = ?
    ORDER BY a.applied_at DESC
    LIMIT 10
  `).all(candidate_id) as any[];

  const activeJobs = db.prepare(`
    SELECT j.*, 
           COALESCE(c.company_name, j.company_id, 'Hiring Organization') as company_name, 
           c.logo as company_logo,
           COALESCE(c.location, j.location) as company_location
    FROM jobs j
    LEFT JOIN companies c ON LOWER(TRIM(j.company_id)) = LOWER(TRIM(c.company_id))
    WHERE LOWER(TRIM(j.status)) = 'active'
    ORDER BY j.posted_at DESC
    LIMIT 50
  `).all() as any[];

  const appliedIds = new Set(
    (db.prepare('SELECT job_id FROM applications WHERE candidate_id = ?').all(candidate_id) as any[]).map((a) => a.job_id)
  );

  const matchedJobs = activeJobs
    .map((j) => {
      const match = calculateCandidateJobMatch(candidate, j);
      return {
        ...j,
        already_applied: appliedIds.has(j.job_id),
        match_score: match.score,
        match_reasons: match.reasons,
        match_factors: match.factors,
        recommendation_level: match.recommendationLevel,
      };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 10);

  return res.json({
    candidateName: candidate ? candidate.name : 'Candidate',
    profileCompletion,
    stats: {
      totalApplications: totalApps?.count || 0,
      shortlisted: shortlisted?.count || 0,
      upcomingInterviews: upcomingInterviews.length,
      selected: selected?.count || 0,
      unreadNotifications: unreadNotifs?.count || 0,
    },
    upcomingInterviews,
    recentApplications: recentApps,
    recommendedJobs: matchedJobs,
  });
});

// HR Dashboard Stats
apiRouter.get('/hr/dashboard', requireAuth, requireRole('hr'), (req: AuthenticatedRequest, res: Response) => {
  let company_id = (req.user?.company_id || '').trim();
  let hr_id = (req.user?.hr_id || '').trim();
  const user_id = req.user!.user_id;

  if (!company_id || !hr_id) {
    const hrRecord = db.prepare('SELECT hr_id, company_id FROM hr_users WHERE user_id = ?').get(user_id) as any;
    if (hrRecord) {
      if (!company_id && hrRecord.company_id) company_id = hrRecord.company_id.trim();
      if (!hr_id && hrRecord.hr_id) hr_id = hrRecord.hr_id.trim();
    }
  }

  const totalJobs = db.prepare(`
    SELECT COUNT(*) as count 
    FROM jobs j 
    WHERE (LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ?)
  `).get(company_id, hr_id) as any;

  const activeJobs = db.prepare(`
    SELECT COUNT(*) as count 
    FROM jobs j 
    WHERE (LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ?) 
      AND LOWER(TRIM(j.status)) = 'active'
  `).get(company_id, hr_id) as any;

  const totalApps = db.prepare(`
    SELECT COUNT(*) as count 
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    WHERE (LOWER(TRIM(a.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)))
  `).get(company_id, hr_id, company_id) as any;

  const newApps = db.prepare(`
    SELECT COUNT(*) as count 
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    WHERE (LOWER(TRIM(a.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?))) 
      AND a.status = 'Applied'
  `).get(company_id, hr_id, company_id) as any;

  const shortlisted = db.prepare(`
    SELECT COUNT(*) as count 
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    WHERE (LOWER(TRIM(a.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?))) 
      AND a.status = 'Shortlisted'
  `).get(company_id, hr_id, company_id) as any;

  const selected = db.prepare(`
    SELECT COUNT(*) as count 
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    WHERE (LOWER(TRIM(a.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?))) 
      AND a.status = 'Selected'
  `).get(company_id, hr_id, company_id) as any;

  const upcomingInterviews = db.prepare(`
    SELECT i.*, j.title as job_title, cand.name as candidate_name, cand.phone as candidate_phone, u.email as candidate_email
    FROM interviews i
    JOIN jobs j ON i.job_id = j.job_id
    JOIN candidates cand ON i.candidate_id = cand.candidate_id
    JOIN users u ON cand.user_id = u.user_id
    WHERE (LOWER(TRIM(i.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?))) 
      AND LOWER(TRIM(i.status)) = 'scheduled'
    ORDER BY i.interview_date ASC, i.interview_time ASC
    LIMIT 6
  `).all(company_id, hr_id, company_id) as any[];

  const recentApps = db.prepare(`
    SELECT a.*, j.title as job_title, cand.name as candidate_name, cand.education as candidate_education,
           cand.skills as candidate_skills, cand.experience as candidate_experience, cand.location as candidate_location,
           u.email as candidate_email, r.file_name as resume_name, r.file_url as resume_url
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    JOIN candidates cand ON a.candidate_id = cand.candidate_id
    JOIN users u ON cand.user_id = u.user_id
    LEFT JOIN resumes r ON a.resume_id = r.resume_id
    WHERE (LOWER(TRIM(a.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)))
    ORDER BY a.applied_at DESC
    LIMIT 10
  `).all(company_id, hr_id, company_id) as any[];

  const statusBreakdown = db.prepare(`
    SELECT a.status, COUNT(*) as count
    FROM applications a
    JOIN jobs j ON a.job_id = j.job_id
    WHERE (LOWER(TRIM(a.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ? OR LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)))
    GROUP BY a.status
  `).all(company_id, hr_id, company_id) as any[];

  const jobStats = db.prepare(`
    SELECT j.job_id, j.title, j.status, j.openings, COUNT(a.application_id) as applicant_count
    FROM jobs j
    LEFT JOIN applications a ON j.job_id = a.job_id
    WHERE (LOWER(TRIM(j.company_id)) = LOWER(TRIM(?)) OR j.hr_id = ?)
    GROUP BY j.job_id
    ORDER BY applicant_count DESC
    LIMIT 10
  `).all(company_id, hr_id) as any[];

  const unreadNotifs = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user_id) as any;

  return res.json({
    stats: {
      totalJobs: totalJobs?.count || 0,
      activeJobs: activeJobs?.count || 0,
      totalApplications: totalApps?.count || 0,
      newApplications: newApps?.count || 0,
      shortlistedCandidates: shortlisted?.count || 0,
      upcomingInterviews: upcomingInterviews.length,
      selectedCandidates: selected?.count || 0,
      unreadNotifications: unreadNotifs?.count || 0,
    },
    statusBreakdown,
    jobStats,
    upcomingInterviews,
    recentApplications: recentApps,
  });
});
