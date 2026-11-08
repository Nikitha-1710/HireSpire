import React, { useState } from 'react';
import { Job } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  GraduationCap,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface JobDetailsModalProps {
  job: Job | null;
  onClose: () => void;
  onAppliedSuccess?: (jobId: string) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose, onAppliedSuccess }) => {
  const { user, refreshNotificationsCount } = useAuth();
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(job?.already_applied || false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!job) return null;

  const isCandidate = user?.role === 'candidate';

  let skillsList: string[] = [];
  try {
    const parsed = JSON.parse(job.required_skills);
    if (Array.isArray(parsed)) skillsList = parsed;
    else skillsList = job.required_skills.split(',').map((s) => s.trim());
  } catch {
    skillsList = job.required_skills.split(',').map((s) => s.trim());
  }

  const handleApply = async () => {
    if (!isCandidate) {
      setErrorMessage('Only candidate accounts can submit job applications.');
      return;
    }

    setApplying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.applyToJob(job.job_id);
      setAlreadyApplied(true);
      setSuccessMessage('Application submitted successfully! Your active resume has been attached.');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      refreshNotificationsCount();
      if (onAppliedSuccess) onAppliedSuccess(job.job_id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit application.');
      if (err.message && err.message.toLowerCase().includes('already applied')) {
        setAlreadyApplied(true);
      }
    } finally {
      setApplying(false);
    }
  };

  const match = job.match_score ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 pr-8">
          <div className="flex items-center gap-4">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company_name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {job.company_name.charAt(0)}
              </div>
            )}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block">
                {job.company_name} {job.company_industry && `· ${job.company_industry}`}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.location}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  {job.salary_range}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {job.job_type}
                </span>
              </div>
            </div>
          </div>

          {/* Match Score Display */}
          {match !== null && isCandidate && (
            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <div
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                  match >= 80
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : match >= 60
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-sm font-bold">{match}% Match</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {job.recommendation_level || 'Compatibility Score'}
              </span>
            </div>
          )}
        </div>

        {/* Feedback banners */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Transparent Matching Factors Breakdown */}
        {isCandidate && job.match_factors && job.match_factors.length > 0 && (
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Transparent Match Analysis (Why you match this role)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.match_factors.map((factor, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200">{factor.name}</span>
                    <span className="text-[11px] font-bold text-indigo-400">
                      {factor.scoreContribution} / {factor.maxScore} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    {factor.matched ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="truncate">{factor.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job Details Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Experience Required</span>
            <span className="text-xs font-semibold text-white">{job.experience_required}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Education Level</span>
            <span className="text-xs font-semibold text-white">{job.education_requirement}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Open Positions</span>
            <span className="text-xs font-semibold text-white">{job.openings} Openings</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Application Deadline</span>
            <span className="text-xs font-semibold text-white">{job.deadline}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-bold text-white mb-2">Job Description</h3>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 whitespace-pre-line">
            {job.description}
          </div>
        </div>

        {/* Required Skills */}
        <div>
          <h3 className="text-sm font-bold text-white mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skillsList.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Company Info */}
        {job.company_description && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              About {job.company_name}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">{job.company_description}</p>
            {job.company_website && (
              <a
                href={job.company_website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-2"
              >
                <span>Visit Company Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Posted on {new Date(job.posted_at).toLocaleDateString()}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Close
            </button>

            {isCandidate && (
              <button
                type="button"
                onClick={handleApply}
                disabled={alreadyApplied || applying}
                className={`px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg transition-all ${
                  alreadyApplied
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
                }`}
              >
                {applying ? (
                  <span>Submitting Application...</span>
                ) : alreadyApplied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Already Applied</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Apply Now (Attach Resume)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
