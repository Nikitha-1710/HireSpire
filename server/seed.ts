import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { calculateCandidateJobMatch } from './matching.js';

/**
 * seedDatabase:
 * All pre-seeded dummy companies (TechCorp, NextWave, BioHealth, CyberShield, InnovaTech, etc.)
 * have been removed as requested. The system starts clean so the user can register and manage
 * their own companies freshly.
 */
export function seedDatabase() {
  try {
    // 1. Remove all legacy dummy companies and their cascading records
    // Only delete the specific legacy hardcoded dummy companies if they still linger
    const dummyCompanyIds = [
      'comp_techcorp',
      'comp_nextwave',
      'comp_biohealth',
      'comp_cybershield',
      'comp_innovatech',
    ];

    for (const compId of dummyCompanyIds) {
      db.prepare('DELETE FROM companies WHERE company_id = ?').run(compId);
      db.prepare('DELETE FROM jobs WHERE company_id = ?').run(compId);
    }

    // Flush SQLite WAL changes to disk permanently so data persists across days
    db.exec('PRAGMA wal_checkpoint(FULL);');
  } catch (err) {
    console.error('Error during seedDatabase check:', err);
  }
}

export function recomputeAllApplicationFitScores() {
  try {
    const apps = db.prepare(`
      SELECT a.application_id, a.candidate_id, a.job_id
      FROM applications a
      JOIN jobs j ON a.job_id = j.job_id
      JOIN candidates c ON a.candidate_id = c.candidate_id
    `).all() as any[];

    for (const app of apps) {
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
          app.application_id
        );
      }
    }
    db.exec('PRAGMA wal_checkpoint(FULL);');
  } catch (e) {
    console.error('Error recomputing fit scores:', e);
  }
}
