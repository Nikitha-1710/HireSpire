import React, { useState } from 'react';
import { Application } from '../../types';
import { formatExternalUrl } from '../../utils/url';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  FileText,
  Download,
  Eye,
  Sparkles,
  CheckCircle2,
  Calendar,
  X,
  ExternalLink,
  Award,
  Globe
} from 'lucide-react';

interface CandidateDetailModalProps {
  application: Application | null;
  onClose: () => void;
  onScheduleInterview: (app: Application) => void;
  onUpdateStatus: (appId: string, status: string) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  application,
  onClose,
  onScheduleInterview,
  onUpdateStatus,
}) => {
  const [viewResumeText, setViewResumeText] = useState(false);

  if (!application) return null;

  let skillsList: string[] = [];
  try {
    const p = JSON.parse(application.candidate_skills || '[]');
    if (Array.isArray(p)) skillsList = p;
    else skillsList = (application.candidate_skills || '').split(',').map((s) => s.trim());
  } catch {
    skillsList = (application.candidate_skills || '').split(',').map((s) => s.trim());
  }

  const fitScore = application.fit_score ?? application.match_score ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Profile Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 pr-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center overflow-hidden shrink-0">
              {application.candidate_photo ? (
                <img
                  src={application.candidate_photo}
                  alt={application.candidate_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-indigo-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Applied for {application.job_title}
                </span>
                {application.rank && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Rank #{application.rank}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {application.candidate_name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {application.candidate_email}
                </span>
                {application.candidate_phone && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {application.candidate_phone}
                    </span>
                  </>
                )}
                {application.candidate_location && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {application.candidate_location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Current Status Pill */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                application.status === 'Selected'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : application.status === 'Interview Scheduled'
                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                  : application.status === 'Shortlisted'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : application.status === 'Not Selected'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Application Status: {application.status}
            </span>
          </div>
        </div>

        {/* Candidate Social & Code Profiles (GitHub, LinkedIn, Resume) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {application.candidate_github && (
            <a
              href={formatExternalUrl(application.candidate_github)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white hover:border-indigo-500/50 hover:bg-slate-900 transition-colors shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>GitHub Profile</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}

          {application.candidate_linkedin && (
            <a
              href={formatExternalUrl(application.candidate_linkedin)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-blue-200 hover:text-white hover:border-blue-500/50 hover:bg-slate-900 transition-colors shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>LinkedIn Profile</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}

          {application.resume_url && (
            <a
              href={application.resume_url}
              download={application.resume_name || 'resume.txt'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Resume ({application.resume_name || 'Document'})</span>
            </a>
          )}
        </div>

        {/* Objective Candidate Fit Score & Algorithmic Breakdown */}
        <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Objective Candidate Fit Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">{fitScore}% Fit</span>
                <span className="text-xs text-indigo-300 font-medium">
                  {fitScore >= 85 ? 'Strong Candidate Fit' : fitScore >= 70 ? 'Good Candidate Fit' : 'Moderate Candidate Fit'}
                </span>
              </div>
            </div>

            {/* Score progress bar */}
            <div className="w-full sm:w-48 space-y-1">
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    fitScore >= 85
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : fitScore >= 70
                      ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                      : 'bg-gradient-to-r from-amber-500 to-orange-400'
                  }`}
                  style={{ width: `${fitScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span>Threshold: 70%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Metric factors cards: Skills, Experience, Education, Location, Certs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                Skills Match
              </span>
              <span className="font-bold text-white">
                {application.skills_match_ratio || `${application.skills_matched_count ?? 4}/${application.skills_total_count ?? 5}`}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                Experience
              </span>
              <span className={`font-bold ${
                application.experience_status === 'Matched' || application.experience_status === 'Exceeds'
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}>
                {application.experience_status || 'Matched'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                Education
              </span>
              <span className="font-bold text-indigo-300 truncate block">
                Matched Degree
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                Location Match
              </span>
              <span className="font-bold text-slate-200 truncate block">
                {application.candidate_location || 'Matched'}
              </span>
            </div>
          </div>

          {/* Clear Match Explanations */}
          {application.match_reasons && application.match_reasons.length > 0 && (
            <div className="pt-2 border-t border-indigo-500/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Fit Score Explanations & Matched Factors:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {application.match_reasons.map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-900/90 border border-indigo-500/30 text-indigo-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{r}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Education, Experience, & Certifications Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
              Education Background
            </span>
            <div className="flex items-start gap-2 text-white font-medium">
              <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>{application.candidate_education || 'Not specified'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
              Years of Experience
            </span>
            <div className="flex items-start gap-2 text-white font-medium">
              <Briefcase className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>{application.candidate_experience || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Certifications if present */}
        {application.candidate_certifications && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Verified Industry Certifications
            </span>
            <p className="text-xs text-slate-200 font-medium">{application.candidate_certifications}</p>
          </div>
        )}

        {/* Candidate Skills */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Reported Technical Skills
          </span>
          <div className="flex flex-wrap gap-2">
            {skillsList.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Bio / About */}
        {application.candidate_about && (
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              About Candidate
            </span>
            <p className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {application.candidate_about}
            </p>
          </div>
        )}

        {/* Resume Preview & Actions */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-xs font-semibold text-white block">
                  {application.resume_name || 'Candidate Resume'}
                </span>
                <span className="text-[11px] text-slate-400">Attached document submitted with this application</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewResumeText(!viewResumeText)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{viewResumeText ? 'Hide Text' : 'View Text'}</span>
              </button>
              {application.resume_url && (
                <a
                  href={application.resume_url}
                  download={application.resume_name || 'resume.txt'}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>
          </div>

          {viewResumeText && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 max-h-52 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
              {application.resume_data || 'No preview text stored for this resume document.'}
            </div>
          )}
        </div>

        {/* HR Action Toolbar */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Application ID: <span className="font-mono text-slate-300">{application.application_id}</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onUpdateStatus(application.application_id, 'Under Review')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Mark Under Review
            </button>
            <button
              onClick={() => onUpdateStatus(application.application_id, 'Shortlisted')}
              className="px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Shortlist
            </button>
            <button
              onClick={() => {
                onClose();
                onScheduleInterview(application);
              }}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Interview</span>
            </button>
            <button
              onClick={() => onUpdateStatus(application.application_id, 'Selected')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            >
              Select Candidate
            </button>
            <button
              onClick={() => onUpdateStatus(application.application_id, 'Not Selected')}
              className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
