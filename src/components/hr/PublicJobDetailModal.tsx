import React from 'react';
import { Job } from '../../types';
import {
  X,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  GraduationCap,
  Users,
  CheckCircle2,
  ShieldCheck,
  Building2,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import { formatExternalUrl } from '../../utils/url';

interface PublicJobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onViewCompany?: (companyId: string) => void;
}

export const PublicJobDetailModal: React.FC<PublicJobDetailModalProps> = ({
  job,
  onClose,
  onViewCompany,
}) => {
  if (!job) return null;

  let skillsList: string[] = [];
  try {
    if (Array.isArray(job.required_skills)) {
      skillsList = job.required_skills;
    } else if (typeof job.required_skills === 'string') {
      skillsList = JSON.parse(job.required_skills);
    }
  } catch {
    if (typeof job.required_skills === 'string') {
      skillsList = job.required_skills.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  const formatDeadline = (dateStr?: string) => {
    if (!dateStr) return 'Rolling basis';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatPostedAt = (dateStr?: string) => {
    if (!dateStr) return 'Recently posted';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-job-detail-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company_name}
                className="w-14 h-14 rounded-xl object-cover border border-slate-700/80 shrink-0 bg-slate-800"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-lg shrink-0">
                {job.company_name ? job.company_name.substring(0, 2).toUpperCase() : 'CO'}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Job Post
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {job.job_type || 'Full-time'}
                </span>
              </div>
              <h2 id="public-job-detail-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {job.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400 mt-1">
                {onViewCompany ? (
                  <button
                    onClick={() => onViewCompany(job.company_id)}
                    className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {job.company_name}
                  </button>
                ) : (
                  <span className="font-medium text-slate-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {job.company_name}
                  </span>
                )}
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {job.location}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Posted {formatPostedAt(job.posted_at)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Compensation
              </span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
                <DollarSign className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="truncate">{job.salary_range || 'Competitive'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Experience
              </span>
              <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-sm">
                <Briefcase className="w-4 h-4 shrink-0 text-indigo-400" />
                <span className="truncate">{job.experience_required || 'Not specified'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Openings
              </span>
              <div className="flex items-center gap-1.5 text-violet-300 font-semibold text-sm">
                <Users className="w-4 h-4 shrink-0 text-violet-400" />
                <span>{job.openings ? `${job.openings} Openings` : '1 Opening'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Deadline
              </span>
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-sm">
                <Calendar className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="truncate">{formatDeadline(job.deadline)}</span>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase text-slate-400 mb-2">
              Role Overview & Description
            </h3>
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 text-sm leading-relaxed text-slate-300 whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Skills Required */}
          {skillsList.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase text-slate-400 mb-2.5">
                Required Technical & Domain Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education Requirement */}
          {job.education_requirement && (
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase text-slate-400 mb-2">
                Education & Credentials
              </h3>
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/70 text-sm text-slate-300">
                <GraduationCap className="w-4 h-4 text-violet-400 shrink-0" />
                <span>{job.education_requirement}</span>
              </div>
            </div>
          )}

          {/* Candidate Evaluation & Fit Score Criteria */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>Automated Fit–Score Evaluation Weights</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Min Benchmark: {job.min_fit_score ?? 60}%
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Applications are automatically analyzed and matched using the custom criteria configured by the hiring team:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Skills Stack</div>
                <div className="font-bold text-indigo-300 mt-0.5">{job.weight_skills ?? 40}% Weight</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Experience</div>
                <div className="font-bold text-indigo-300 mt-0.5">{job.weight_experience ?? 25}% Weight</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Education</div>
                <div className="font-bold text-indigo-300 mt-0.5">{job.weight_education ?? 15}% Weight</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Location</div>
                <div className="font-bold text-indigo-300 mt-0.5">{job.weight_location ?? 10}% Weight</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Certifications</div>
                <div className="font-bold text-indigo-300 mt-0.5">{job.weight_certifications ?? 10}% Weight</div>
              </div>
            </div>
          </div>

          {/* Company Privacy Notice */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300 block mb-0.5">
                Public Cross-Company View
              </span>
              You are viewing this active job posting as a registered HR user. Candidate applications, applicant resumes, interview notes, and internal hiring workflows for this position are strictly isolated to <strong className="text-slate-300">{job.company_name}</strong> recruiters.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          {job.company_website ? (
            <a
              href={formatExternalUrl(job.company_website)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              Visit Company Website
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-xs text-slate-500">Public Job ID: {job.job_id}</span>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
