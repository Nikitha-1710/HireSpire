export type UserRole = 'candidate' | 'hr';

export interface User {
  user_id: string;
  email: string;
  role: UserRole;
  name: string;
  candidate_id?: string;
  hr_id?: string;
  company_id?: string;
  profile?: any;
  company?: Company;
  resume?: Resume;
  profileCompletion?: number;
}

export interface Candidate {
  candidate_id: string;
  user_id: string;
  name: string;
  phone: string;
  education: string;
  skills: string; // JSON array string
  experience: string;
  location: string;
  profile_photo?: string;
  about?: string;
  certifications?: string;
  github_url?: string;
  linkedin_url?: string;
  created_at?: string;
}

export interface Company {
  company_id: string;
  company_name: string;
  logo?: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  contact_information?: string;
  company_size?: string;
  founded_year?: number;
  is_company_id_public?: boolean | number;
  public_company_id?: string | null;
  active_jobs_count?: number;
  active_jobs?: Job[];
  is_own_company?: boolean;
  created_at?: string;
}

export interface Resume {
  resume_id: string;
  candidate_id: string;
  file_name: string;
  file_url: string;
  file_data?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface MatchFactor {
  name: string;
  matched: boolean;
  scoreContribution: number;
  maxScore: number;
  reason: string;
}

export interface Job {
  job_id: string;
  company_id: string;
  hr_id: string;
  title: string;
  description: string;
  required_skills: string; // JSON array or comma separated
  experience_required: string;
  education_requirement: string;
  location: string;
  salary_range: string;
  job_type: string;
  openings: number;
  deadline: string;
  status: 'Draft' | 'Active' | 'Closed';
  posted_at: string;
  company_name: string;
  company_logo?: string;
  company_industry?: string;
  company_location?: string;
  company_description?: string;
  company_website?: string;
  company_contact?: string;
  already_applied?: boolean;
  match_score?: number | null;
  match_reasons?: string[];
  match_factors?: MatchFactor[];
  recommendation_level?: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match' | null;
  application?: Application;
  weight_skills?: number;
  weight_experience?: number;
  weight_education?: number;
  weight_location?: number;
  weight_certifications?: number;
  min_fit_score?: number;
  fit_score_enabled?: boolean | number;
}

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Not Selected';

export interface Application {
  application_id: string;
  candidate_id: string;
  company_id: string;
  job_id: string;
  resume_id: string;
  applied_at: string;
  status: ApplicationStatus;
  job_title?: string;
  job_location?: string;
  salary_range?: string;
  job_type?: string;
  company_name?: string;
  company_logo?: string;
  company_industry?: string;
  candidate_name?: string;
  candidate_phone?: string;
  candidate_email?: string;
  candidate_education?: string;
  candidate_skills?: string;
  candidate_experience?: string;
  candidate_location?: string;
  candidate_photo?: string;
  candidate_about?: string;
  resume_name?: string;
  resume_url?: string;
  resume_data?: string;
  interview_id?: string;
  interview_date?: string;
  interview_time?: string;
  interview_type?: string;
  location_or_meeting_info?: string;
  interviewer?: string;
  interview_status?: string;
  interview_notes?: string;
  fit_score?: number;
  match_score?: number;
  match_factors?: MatchFactor[];
  match_reasons?: string[];
  rank?: number;
  skills_matched_count?: number;
  skills_total_count?: number;
  skills_match_ratio?: string;
  experience_status?: 'Matched' | 'Exceeds' | 'Partial' | 'Below';
  candidate_certifications?: string;
  candidate_github?: string;
  candidate_linkedin?: string;
}

export interface Interview {
  interview_id: string;
  application_id: string;
  candidate_id: string;
  company_id: string;
  job_id: string;
  interview_date: string;
  interview_time: string;
  interview_type: string;
  location_or_meeting_info: string;
  interviewer: string;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  created_at?: string;
  job_title?: string;
  company_name?: string;
  company_logo?: string;
  candidate_name?: string;
  candidate_phone?: string;
  candidate_email?: string;
}

export interface NotificationItem {
  notification_id: string;
  user_id: string;
  application_id?: string;
  message: string;
  notification_type: string;
  is_read: number;
  created_at: string;
}
