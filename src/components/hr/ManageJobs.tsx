import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import { PostJobModal } from './PostJobModal';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Power,
  Building2,
  ShieldCheck,
  Target,
  Sliders,
  Sparkles
} from 'lucide-react';

interface ManageJobsProps {
  onViewJobApplications: (jobId: string) => void;
}

export const ManageJobs: React.FC<ManageJobsProps> = ({ onViewJobApplications }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const fetchCompanyJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Strictly fetch only this authenticated HR recruiter's company jobs
      const res = await api.getHrJobs();
      setJobs(res.jobs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyJobs();
  }, []);

  const handleToggleStatus = async (job: Job) => {
    const newStatus = job.status === 'Active' ? 'Closed' : 'Active';
    try {
      await api.updateJob(job.job_id, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j.job_id === job.job_id ? { ...j, status: newStatus } : j))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job requisition? All related applications will be removed.')) {
      return;
    }
    try {
      await api.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete job');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Post Job Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            Manage Job Openings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, publish, update, and review applications for your corporate requisitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCompanyJobs}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
          </button>
          <button
            onClick={() => {
              setEditingJob(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-red-400 text-sm">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No jobs posted yet for {user?.company?.company_name || 'your company'}.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Your corporate workspace has an isolated job dashboard. Jobs from other companies are not shown here. Create your first job opening to start attracting talent!
          </p>
          <button
            onClick={() => {
              setEditingJob(null);
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer inline-flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post a Job Opening</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white">{job.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      job.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : job.status === 'Draft'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {job.location}
                  </span>
                  <span>·</span>
                  <span>{job.job_type}</span>
                  <span>·</span>
                  <span>{job.salary_range}</span>
                  <span>·</span>
                  <span>{job.openings} Openings</span>
                  <span>·</span>
                  <span>Deadline: {job.deadline}</span>
                </div>

                {/* Configured Fit Score Criteria Badge */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                    <Target className="w-3 h-3 text-indigo-400" />
                    <span>Fit Score: {job.fit_score_enabled !== 0 ? 'Active' : 'Disabled'}</span>
                  </span>
                  <span className="text-slate-400">
                    Weights: Skills {job.weight_skills ?? 40}% · Exp {job.weight_experience ?? 25}% · Edu {job.weight_education ?? 15}% · Loc {job.weight_location ?? 10}% · Certs {job.weight_certifications ?? 10}%
                  </span>
                  <span className="text-emerald-400 font-medium">
                    (Min: {job.min_fit_score ?? 60}%)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => onViewJobApplications(job.job_id)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View Applicants</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(job)}
                  title={job.status === 'Active' ? 'Deactivate / Close job' : 'Activate job'}
                  className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    job.status === 'Active'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setEditingJob(job);
                    setModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit Job"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(job.job_id)}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors cursor-pointer"
                  title="Delete Job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post/Edit Modal */}
      {modalOpen && (
        <PostJobModal
          jobToEdit={editingJob}
          onClose={() => {
            setModalOpen(false);
            setEditingJob(null);
          }}
          onSuccess={fetchCompanyJobs}
        />
      )}
    </div>
  );
};
