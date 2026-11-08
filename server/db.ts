import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_FILE = path.join(DB_DIR, 'hr_system.db');
export const db = new DatabaseSync(DB_FILE);

// Enable foreign keys and WAL mode
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('candidate', 'hr')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS companies (
      company_id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      logo TEXT,
      description TEXT,
      website TEXT,
      location TEXT,
      industry TEXT,
      contact_information TEXT,
      company_size TEXT DEFAULT '100-500 employees',
      founded_year INTEGER DEFAULT 2018,
      is_company_id_public INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS candidates (
      candidate_id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT,
      education TEXT,
      skills TEXT,
      experience TEXT,
      location TEXT,
      profile_photo TEXT,
      about TEXT,
      certifications TEXT,
      github_url TEXT,
      linkedin_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hr_users (
      hr_id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      company_id TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      job_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      hr_id TEXT NOT NULL REFERENCES hr_users(hr_id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_skills TEXT NOT NULL,
      experience_required TEXT NOT NULL,
      education_requirement TEXT NOT NULL,
      location TEXT NOT NULL,
      salary_range TEXT NOT NULL,
      job_type TEXT NOT NULL,
      openings INTEGER NOT NULL DEFAULT 1,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Draft', 'Active', 'Closed')),
      posted_at TEXT NOT NULL DEFAULT (datetime('now')),
      weight_skills INTEGER DEFAULT 40,
      weight_experience INTEGER DEFAULT 25,
      weight_education INTEGER DEFAULT 15,
      weight_location INTEGER DEFAULT 10,
      weight_certifications INTEGER DEFAULT 10,
      min_fit_score INTEGER DEFAULT 60,
      fit_score_enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS resumes (
      resume_id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_data TEXT,
      file_size INTEGER,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      application_id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
      company_id TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      job_id TEXT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
      resume_id TEXT NOT NULL REFERENCES resumes(resume_id) ON DELETE RESTRICT,
      applied_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'Applied' CHECK(status IN ('Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Not Selected')),
      fit_score REAL DEFAULT 0,
      fit_reasons TEXT,
      skills_matched_count INTEGER DEFAULT 0,
      skills_total_count INTEGER DEFAULT 0,
      experience_status TEXT DEFAULT 'Matched',
      UNIQUE(candidate_id, job_id)
    );

    CREATE TABLE IF NOT EXISTS interviews (
      interview_id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
      candidate_id TEXT NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
      company_id TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      job_id TEXT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
      interview_date TEXT NOT NULL,
      interview_time TEXT NOT NULL,
      interview_type TEXT NOT NULL,
      location_or_meeting_info TEXT NOT NULL,
      interviewer TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notification_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      application_id TEXT REFERENCES applications(application_id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_apps_candidate ON applications(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_apps_job ON applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_apps_company ON applications(company_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_interview_cand ON interviews(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_interview_comp ON interviews(company_id);
  `);

  // Safe runtime migrations for existing databases
  try {
    db.exec(`ALTER TABLE candidates ADD COLUMN certifications TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE candidates ADD COLUMN github_url TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE candidates ADD COLUMN linkedin_url TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE applications ADD COLUMN fit_score REAL DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE applications ADD COLUMN fit_reasons TEXT;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE applications ADD COLUMN skills_matched_count INTEGER DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE applications ADD COLUMN skills_total_count INTEGER DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE applications ADD COLUMN experience_status TEXT DEFAULT 'Matched';`);
  } catch {}
  try {
    db.exec(`ALTER TABLE companies ADD COLUMN company_size TEXT DEFAULT '100-500 employees';`);
  } catch {}
  try {
    db.exec(`ALTER TABLE companies ADD COLUMN founded_year INTEGER DEFAULT 2018;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE companies ADD COLUMN is_company_id_public INTEGER DEFAULT 1;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN weight_skills INTEGER DEFAULT 40;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN weight_experience INTEGER DEFAULT 25;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN weight_education INTEGER DEFAULT 15;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN weight_location INTEGER DEFAULT 10;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN weight_certifications INTEGER DEFAULT 10;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN min_fit_score INTEGER DEFAULT 60;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN fit_score_enabled INTEGER DEFAULT 1;`);
  } catch {}
}
