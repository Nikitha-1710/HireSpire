import React, { useState, useEffect } from 'react';
import { Company, Job } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PublicJobDetailModal } from './PublicJobDetailModal';
import { formatExternalUrl } from '../../utils/url';
import {
  X,
  Building2,
  Globe,
  MapPin,
  Users,
  Calendar,
  Briefcase,
  ExternalLink,
  Shield,
  Copy,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  AlertCircle
} from 'lucide-react';

interface CompanyPublicDetailsModalProps {
  companyId: string;
  onClose: () => void;
  onSwitchToManage?: (companyId: string) => void;
}

export const CompanyPublicDetailsModal: React.FC<CompanyPublicDetailsModalProps> = ({
  companyId,
  onClose,
  onSwitchToManage,
}) => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPublicCompany = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getPublicCompany(companyId);
        if (isMounted) {
          setCompany(res.company);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load company profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPublicCompany();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isOwnCompany = user?.company_id === companyId;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-public-details-title"
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      >
        <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-6 border-b border-slate-800 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {loading ? (
              <div className="flex items-center gap-3 py-6">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-sm text-slate-400">Loading public company profile...</span>
              </div>
            ) : error ? (
              <div className="py-6 flex items-center gap-3 text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : company ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.company_name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-700/80 bg-slate-800 shadow-lg shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
                      {company.company_name ? company.company_name.substring(0, 2).toUpperCase() : 'CO'}
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {company.industry || 'Technology'}
                      </span>
                      {isOwnCompany && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Your Company Workspace
                        </span>
                      )}
                    </div>
                    <h2 id="company-public-details-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {company.company_name}
                    </h2>

                    {/* Company ID display if public or own company */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      {company.is_company_id_public || isOwnCompany ? (
                        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg">
                          <span className="text-slate-400">Company ID:</span>
                          <span className="font-mono text-indigo-300 font-medium">
                            {company.public_company_id || company.company_id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(company.public_company_id || company.company_id)}
                            className="text-slate-500 hover:text-white ml-1 p-0.5 transition-colors cursor-pointer"
                            title="Copy Company ID"
                          >
                            {copiedId ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/80 px-2.5 py-1 rounded-lg text-slate-400">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Company ID: Private</span>
                        </div>
                      )}

                      {company.location && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {company.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Website Link */}
                {company.website && (
                  <a
                    href={formatExternalUrl(company.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-white transition-all shadow-xs shrink-0"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    Visit Website
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>
            ) : null}
          </div>

          {/* Body Content */}
          {company && (
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
              {/* Public Stats & Information Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Industry Sector
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs sm:text-sm">
                    <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{company.industry || 'Not specified'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Company Size
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs sm:text-sm">
                    <Users className="w-4 h-4 text-violet-400 shrink-0" />
                    <span className="truncate">{company.company_size || '100-500 employees'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Founded Year
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs sm:text-sm">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{company.founded_year || 2018}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Active Job Posts
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs sm:text-sm">
                    <Briefcase className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{company.active_jobs_count || company.active_jobs?.length || 0} Openings</span>
                  </div>
                </div>
              </div>

              {/* About / Description */}
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide uppercase text-slate-400 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  About Company
                </h3>
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-sm leading-relaxed text-slate-300">
                  {company.description ||
                    `${company.company_name} is a verified registered company on the Hire Screen network.`}
                </div>
              </div>

              {/* Active Jobs Section inside Company Details */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white tracking-wide uppercase text-slate-400 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    Active Job Posts ({company.active_jobs?.length || 0})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Openings actively seeking talent
                  </span>
                </div>

                {!company.active_jobs || company.active_jobs.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-400 text-sm">
                    <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p>No active job posts currently open for {company.company_name}.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {company.active_jobs.map((job) => {
                      let skills: string[] = [];
                      try {
                        skills = Array.isArray(job.required_skills)
                          ? job.required_skills
                          : JSON.parse(job.required_skills);
                      } catch {
                        skills = typeof job.required_skills === 'string'
                          ? job.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
                          : [];
                      }

                      return (
                        <div
                          key={job.job_id}
                          className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {job.status}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                                {job.job_type || 'Full-time'}
                              </span>
                              {job.openings > 1 && (
                                <span className="text-[11px] text-slate-400">
                                  {job.openings} Openings
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                              {job.title}
                            </h4>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {job.location}
                              </span>
                              {job.salary_range && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-emerald-400 font-medium">
                                    {job.salary_range}
                                  </span>
                                </>
                              )}
                              {job.experience_required && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span>{job.experience_required}</span>
                                </>
                              )}
                            </div>

                            {/* Skills badges */}
                            {skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {skills.slice(0, 5).map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {skills.length > 5 && (
                                  <span className="text-[10px] text-slate-500 self-center">
                                    +{skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center sm:self-center">
                            <button
                              onClick={() =>
                                setSelectedJob({
                                  ...job,
                                  company_name: company.company_name,
                                  company_logo: company.logo,
                                  company_website: company.website,
                                })
                              }
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Job
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Privacy & Tenant Isolation Assurance */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300 block mb-0.5">
                    Data Privacy & Cross-Company Isolation
                  </span>
                  As an authenticated HR recruiter, you can browse public company credentials and active postings. Private recruiter accounts, HR passwords, internal recruiter IDs, applicant resumes, pipeline states, and interviews remain strictly quarantined and inaccessible.
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {isOwnCompany
                ? 'You are managing this organization'
                : 'Browsing public profile in Companies Directory'}
            </span>

            <div className="flex items-center gap-2.5">
              {isOwnCompany && onSwitchToManage && (
                <button
                  onClick={() => onSwitchToManage(companyId)}
                  className="px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Edit Company Profile
                </button>
              )}
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

      {/* Nested Public Job Detail Modal */}
      {selectedJob && (
        <PublicJobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </>
  );
};
