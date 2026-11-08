export interface MatchFactor {
  name: string;
  matched: boolean;
  scoreContribution: number;
  maxScore: number;
  reason: string;
}

export interface MatchResult {
  score: number; // 0 to 100
  factors: MatchFactor[];
  reasons: string[];
  skillsMatchedCount: number;
  skillsTotalCount: number;
  skillsMatchRatio: string; // e.g. "5/5"
  experienceStatus: 'Matched' | 'Exceeds' | 'Partial' | 'Below';
  recommendationLevel: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match';
}

export function calculateCandidateJobMatch(
  candidate: {
    skills?: string | string[];
    experience?: string;
    education?: string;
    location?: string;
    certifications?: string | string[];
  } | null | undefined,
  job: {
    required_skills?: string | string[];
    experience_required?: string;
    education_requirement?: string;
    location?: string;
    job_type?: string;
    weight_skills?: number;
    weight_experience?: number;
    weight_education?: number;
    weight_location?: number;
    weight_certifications?: number;
    min_fit_score?: number;
    fit_score_enabled?: boolean | number;
  }
): MatchResult {
  const factors: MatchFactor[] = [];
  const reasons: string[] = [];

  const safeCand = candidate || {};
  const rawSkillWeight = job.weight_skills !== undefined ? Number(job.weight_skills) : 40;
  const rawExpWeight = job.weight_experience !== undefined ? Number(job.weight_experience) : 25;
  const rawEduWeight = job.weight_education !== undefined ? Number(job.weight_education) : 15;
  const rawLocWeight = job.weight_location !== undefined ? Number(job.weight_location) : 10;
  const rawCertWeight = job.weight_certifications !== undefined ? Number(job.weight_certifications) : 10;
  const minThreshold = job.min_fit_score !== undefined ? Number(job.min_fit_score) : 60;

  // -------------------------------------------------------------
  // 1. SKILLS MATCH
  // -------------------------------------------------------------
  let candSkills: string[] = [];
  if (Array.isArray(safeCand.skills)) {
    candSkills = safeCand.skills;
  } else if (typeof safeCand.skills === 'string') {
    try {
      const parsed = JSON.parse(safeCand.skills);
      if (Array.isArray(parsed)) candSkills = parsed;
      else candSkills = safeCand.skills.split(',').map((s) => s.trim());
    } catch {
      candSkills = safeCand.skills.split(',').map((s) => s.trim());
    }
  }
  const normalizedCandSkills = candSkills.map((s) => s.toLowerCase().trim());

  let jobSkills: string[] = [];
  if (Array.isArray(job.required_skills)) {
    jobSkills = job.required_skills;
  } else if (typeof job.required_skills === 'string') {
    try {
      const parsed = JSON.parse(job.required_skills);
      if (Array.isArray(parsed)) jobSkills = parsed;
      else jobSkills = job.required_skills.split(',').map((s) => s.trim());
    } catch {
      jobSkills = job.required_skills.split(',').map((s) => s.trim());
    }
  }

  const maxSkillScore = Math.max(0, rawSkillWeight);
  let skillsMatchedCount = 0;
  const skillsTotalCount = jobSkills.length || 1;
  const matchedSkillNames: string[] = [];

  if (jobSkills.length > 0) {
    for (const jSkill of jobSkills) {
      const lower = jSkill.toLowerCase().trim();
      const isMatch = normalizedCandSkills.some(
        (cSkill) => cSkill === lower || cSkill.includes(lower) || lower.includes(cSkill)
      );
      if (isMatch) {
        skillsMatchedCount++;
        matchedSkillNames.push(jSkill);
        reasons.push(`${jSkill} skill matched`);
      }
    }

    const skillRatio = skillsMatchedCount / jobSkills.length;
    const skillScore = Math.round(skillRatio * maxSkillScore);

    if (maxSkillScore > 0) {
      factors.push({
        name: 'Required Skills Match',
        matched: skillRatio >= 0.6,
        scoreContribution: skillScore,
        maxScore: maxSkillScore,
        reason: `${skillsMatchedCount}/${jobSkills.length} required skills matched (${matchedSkillNames.join(', ') || 'None'})`,
      });
    }
  } else {
    skillsMatchedCount = 1;
    if (maxSkillScore > 0) {
      factors.push({
        name: 'Required Skills Match',
        matched: true,
        scoreContribution: maxSkillScore,
        maxScore: maxSkillScore,
        reason: 'General technical competency aligned',
      });
    }
  }

  const skillsMatchRatio = `${skillsMatchedCount}/${skillsTotalCount}`;

  // -------------------------------------------------------------
  // 2. EXPERIENCE MATCH
  // -------------------------------------------------------------
  const maxExpScore = Math.max(0, rawExpWeight);
  const candExpStr = (safeCand.experience || '').toLowerCase();
  const jobExpStr = (job.experience_required || '').toLowerCase();

  let candYears = 0;
  const candMatch = candExpStr.match(/(\d+)\+?\s*year/);
  if (candMatch) {
    candYears = parseInt(candMatch[1], 10);
  } else if (candExpStr.includes('senior') || candExpStr.includes('lead') || candExpStr.includes('architect')) {
    candYears = 5;
  } else if (candExpStr.includes('mid') || candExpStr.includes('intermediate')) {
    candYears = 3;
  } else if (candExpStr.includes('entry') || candExpStr.includes('junior') || candExpStr.includes('intern')) {
    candYears = 1;
  } else {
    candYears = 2;
  }

  let reqYears = 0;
  const jobMatch = jobExpStr.match(/(\d+)/);
  if (jobMatch) {
    reqYears = parseInt(jobMatch[1], 10);
  }

  let expScore = maxExpScore;
  let experienceStatus: 'Matched' | 'Exceeds' | 'Partial' | 'Below' = 'Matched';
  let expReasonText = '';

  if (candYears > reqYears + 2 && reqYears > 0) {
    expScore = maxExpScore;
    experienceStatus = 'Exceeds';
    expReasonText = `${candYears}+ years experience exceeds minimum (${job.experience_required || 'role requirement'})`;
    reasons.push(`${candYears}+ years experience matched (exceeds requirement)`);
  } else if (candYears >= reqYears) {
    expScore = maxExpScore;
    experienceStatus = 'Matched';
    expReasonText = `${candYears}+ years experience satisfies requirement (${job.experience_required || 'role requirement'})`;
    reasons.push(`${candYears}+ years experience matched`);
  } else if (candYears === reqYears - 1 || candYears >= reqYears * 0.7) {
    expScore = Math.round(maxExpScore * 0.7);
    experienceStatus = 'Partial';
    expReasonText = `${candYears} years experience partially meets requirement (${job.experience_required || 'role requirement'})`;
    reasons.push(`${candYears} years experience partially matched`);
  } else {
    expScore = Math.round(maxExpScore * 0.35);
    experienceStatus = 'Below';
    expReasonText = `${candYears} years experience below requirement (${job.experience_required || 'role requirement'})`;
  }

  if (maxExpScore > 0) {
    factors.push({
      name: 'Experience Alignment',
      matched: experienceStatus === 'Matched' || experienceStatus === 'Exceeds',
      scoreContribution: expScore,
      maxScore: maxExpScore,
      reason: expReasonText,
    });
  }

  // -------------------------------------------------------------
  // 3. EDUCATION REQUIREMENT MATCH
  // -------------------------------------------------------------
  const maxEduScore = Math.max(0, rawEduWeight);
  const candEdu = (safeCand.education || '').toLowerCase();
  const jobEdu = (job.education_requirement || '').toLowerCase();

  let eduScore = Math.round(maxEduScore * 0.5);
  let eduMatched = false;
  let eduReasonText = 'Educational background reviewed';

  const hasMaster = candEdu.includes('master') || candEdu.includes('ms') || candEdu.includes('m.tech') || candEdu.includes('phd');
  const hasBachelor = candEdu.includes('bachelor') || candEdu.includes('bs') || candEdu.includes('b.tech') || candEdu.includes('b.e') || candEdu.includes('degree');
  const isCsOrEng = candEdu.includes('computer') || candEdu.includes('software') || candEdu.includes('engineering') || candEdu.includes('technology');

  if (jobEdu.includes('any') || !job.education_requirement) {
    eduScore = maxEduScore;
    eduMatched = true;
    eduReasonText = 'Education requirement matched (open degree policy)';
    reasons.push('Education matched');
  } else if (jobEdu.includes('master') && hasMaster) {
    eduScore = maxEduScore;
    eduMatched = true;
    eduReasonText = "Master's degree requirement satisfied";
    reasons.push('Education matched (Master’s degree)');
  } else if ((hasBachelor || hasMaster) && isCsOrEng) {
    eduScore = maxEduScore;
    eduMatched = true;
    eduReasonText = 'Bachelor/Master CS degree satisfies requirements';
    reasons.push('Education matched');
  } else if (hasBachelor || candEdu.length > 5) {
    eduScore = Math.round(maxEduScore * 0.8);
    eduMatched = true;
    eduReasonText = 'Degree credentials provided';
    reasons.push('Education matched');
  } else {
    eduScore = Math.round(maxEduScore * 0.4);
    eduMatched = false;
    eduReasonText = 'Education requirement partially fulfilled';
  }

  if (maxEduScore > 0) {
    factors.push({
      name: 'Education Credential',
      matched: eduMatched,
      scoreContribution: eduScore,
      maxScore: maxEduScore,
      reason: eduReasonText,
    });
  }

  // -------------------------------------------------------------
  // 4. LOCATION MATCH
  // -------------------------------------------------------------
  const maxLocScore = Math.max(0, rawLocWeight);
  const candLoc = (safeCand.location || '').toLowerCase();
  const jobLoc = (job.location || '').toLowerCase();
  const jobType = (job.job_type || '').toLowerCase();

  let locScore = 0;
  let locMatched = false;
  let locReasonText = '';

  if (
    jobLoc.includes('remote') ||
    jobType.includes('remote') ||
    candLoc.includes('remote')
  ) {
    locScore = maxLocScore;
    locMatched = true;
    locReasonText = 'Location matched (Remote flexibility)';
    reasons.push('Location matched (Remote)');
  } else if (
    candLoc && jobLoc &&
    (jobLoc.includes(candLoc) || candLoc.includes(jobLoc) ||
     (candLoc.includes('san francisco') && jobLoc.includes('san francisco')) ||
     (candLoc.includes('new york') && jobLoc.includes('new york')) ||
     (candLoc.includes('austin') && jobLoc.includes('austin')) ||
     (candLoc.includes('boston') && jobLoc.includes('boston')))
  ) {
    locScore = maxLocScore;
    locMatched = true;
    locReasonText = `Location matched (${job.location})`;
    reasons.push('Location matched');
  } else {
    locScore = Math.round(maxLocScore * 0.4);
    locMatched = false;
    locReasonText = `Candidate location (${safeCand.location || 'N/A'}) differs from role (${job.location})`;
  }

  if (maxLocScore > 0) {
    factors.push({
      name: 'Location Match',
      matched: locMatched,
      scoreContribution: locScore,
      maxScore: maxLocScore,
      reason: locReasonText,
    });
  }

  // -------------------------------------------------------------
  // 5. RELEVANT CERTIFICATIONS & DOMAIN REQUIREMENTS
  // -------------------------------------------------------------
  const maxCertScore = Math.max(0, rawCertWeight);
  let certScore = Math.round(maxCertScore * 0.5);
  let certMatched = false;
  let certReasonText = 'General qualifications reviewed';

  let certList: string[] = [];
  if (Array.isArray(safeCand.certifications)) {
    certList = safeCand.certifications;
  } else if (typeof safeCand.certifications === 'string') {
    try {
      const parsed = JSON.parse(safeCand.certifications);
      if (Array.isArray(parsed)) certList = parsed;
      else certList = safeCand.certifications.split(',').map((s) => s.trim());
    } catch {
      certList = safeCand.certifications.split(',').map((s) => s.trim());
    }
  }

  if (certList.length > 0 && certList.some((c) => c.length > 2)) {
    certScore = maxCertScore;
    certMatched = true;
    const certPreview = certList.slice(0, 2).join(', ');
    certReasonText = `Relevant certifications verified (${certPreview})`;
    reasons.push(`Relevant certifications matched (${certPreview})`);
  } else {
    certScore = Math.round(maxCertScore * 0.5);
    certMatched = false;
    certReasonText = 'Standard professional profile without industry certifications';
  }

  if (maxCertScore > 0) {
    factors.push({
      name: 'Relevant Certifications',
      matched: certMatched,
      scoreContribution: certScore,
      maxScore: maxCertScore,
      reason: certReasonText,
    });
  }

  // -------------------------------------------------------------
  // TOTAL FIT SCORE (0 - 100%)
  // -------------------------------------------------------------
  const totalMaxScore = factors.reduce((sum, f) => sum + f.maxScore, 0);
  const totalScore = factors.reduce((sum, f) => sum + f.scoreContribution, 0);
  const normalizedScore = totalMaxScore > 0
    ? Math.min(100, Math.max(0, Math.round((totalScore / totalMaxScore) * 100)))
    : 0;

  let recommendationLevel: MatchResult['recommendationLevel'] = 'Low Match';
  if (normalizedScore >= Math.min(92, minThreshold + 15)) recommendationLevel = 'Strong Match';
  else if (normalizedScore >= minThreshold) recommendationLevel = 'Good Match';
  else if (normalizedScore >= Math.max(40, minThreshold - 15)) recommendationLevel = 'Moderate Match';

  return {
    score: normalizedScore,
    factors,
    reasons,
    skillsMatchedCount,
    skillsTotalCount,
    skillsMatchRatio,
    experienceStatus,
    recommendationLevel,
  };
}
