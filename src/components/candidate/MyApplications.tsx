import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Application } from '../../types';
import {
  FileText,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye,
  Download,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface MyApplicationsProps {
  initialSelectedApp?: Application | null;
  onBrowseJobs: () => void;
}

export const MyApplications: React.FC<MyApplicationsProps> = ({ initialSelectedApp, onBrowseJobs }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(initialSelectedApp || null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCandidateApplications();
      setApplications(res.applications);
      if (initialSelectedApp) {
        const found = res.applications.find((a) => a.application_id === initialSelectedApp.application_id);
        if (found) setSelectedApp(found);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const timelineSteps = [
    { key: 'Applied', label: 'Applied' },
    { key: 'Under Review', label: 'Under Review' },
    { key: 'Shortlisted', label: 'Shortlisted' },
    { key: 'Interview Scheduled', label: 'Interview' },
    { key: 'Selected', label: 'Decision' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const order = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected'];
    const currentIndex = order.indexOf(currentStatus);

    if (currentStatus === 'Not Selected') {
      if (stepKey === 'Selected') return 'rejected';
      const stepIndex = order.indexOf(stepKey);
      return stepIndex <= 1 ? 'completed' : 'inactive';
    }

    const stepIndex = order.indexOf(stepKey);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" />
          My Submitted Applications
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor your recruitment journey with full visibility into status progressions and scheduled interviews.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">You haven't applied to any jobs yet.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Explore active openings, check compatibility match scores, and submit your resume directly to hiring teams.
          </p>
          <button
            onClick={onBrowseJobs}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            Browse Available Jobs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.application_id}
              className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-5 shadow-sm"
            >
              {/* Row 1: Company & Job + Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  {app.company_logo ? (
                    <img
                      src={app.company_logo}
                      alt={app.company_name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-800"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-indigo-950 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                      {app.company_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{app.job_title}</h3>
                    <span className="text-xs text-slate-400">
                      {app.company_name} · Applied on {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      app.status === 'Selected'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : app.status === 'Interview Scheduled'
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                        : app.status === 'Shortlisted'
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : app.status === 'Not Selected'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {app.status}
                  </span>

                  <button
                    onClick={() => setSelectedApp(app)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Visual Recruitment Progression Timeline */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Application Timeline
                </div>
                <div className="flex items-center justify-between relative">
                  {/* Background line */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0" />

                  {timelineSteps.map((step, idx) => {
                    const status = getStepStatus(step.key, app.status);
                    const isRejected = status === 'rejected';
                    const isCompleted = status === 'completed';
                    const isActive = status === 'active';

                    return (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isActive
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                              : isRejected
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isRejected ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                            isActive
                              ? 'text-indigo-400 font-bold'
                              : isCompleted
                              ? 'text-emerald-400'
                              : isRejected
                              ? 'text-red-400 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.key === 'Selected' && app.status === 'Not Selected'
                            ? 'Not Selected'
                            : step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Upcoming Interview notification banner if applicable */}
              {app.interview_date && app.interview_status === 'Scheduled' && (
                <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-violet-200">
                    <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>
                      Interview Scheduled on <strong className="text-white">{app.interview_date}</strong> at{' '}
                      <strong className="text-white">{app.interview_time}</strong> ({app.interview_type})
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="text-violet-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                  >
                    Meeting Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Application Detail View Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Application Overview
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{selectedApp.job_title}</h2>
              <span className="text-sm text-slate-300">{selectedApp.company_name}</span>
            </div>

            {/* Application Details Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Application ID</span>
                <span className="font-mono text-white text-[11px]">{selectedApp.application_id}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Current Status</span>
                <span className="font-semibold text-indigo-300">{selectedApp.status}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Applied Date</span>
                <span className="text-white">{new Date(selectedApp.applied_at).toLocaleString()}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Resume Attached</span>
                <span className="text-white truncate block">{selectedApp.resume_name || 'Standard Profile Resume'}</span>
              </div>
            </div>

            {/* Resume actions */}
            {selectedApp.resume_url && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-xs font-semibold text-white block">{selectedApp.resume_name}</span>
                    <span className="text-[11px] text-slate-400">Resume submitted with this application</span>
                  </div>
                </div>
                <a
                  href={selectedApp.resume_url}
                  download={selectedApp.resume_name || 'resume.txt'}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {/* Interview Information if scheduled */}
            {selectedApp.interview_date && (
              <div className="p-5 rounded-2xl bg-violet-950/30 border border-violet-500/30 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  Scheduled Interview Details
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Date & Time</span>
                    <span className="text-white font-semibold">
                      {selectedApp.interview_date} at {selectedApp.interview_time}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Interview Format</span>
                    <span className="text-white font-semibold">{selectedApp.interview_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Interviewer</span>
                    <span className="text-white font-semibold">{selectedApp.interviewer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Interview Status</span>
                    <span className="text-violet-300 font-semibold">{selectedApp.interview_status}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-1">Meeting Location / Info</span>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 break-all select-all font-mono">
                    {selectedApp.location_or_meeting_info}
                  </div>
                </div>

                {selectedApp.interview_notes && (
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Preparation Notes</span>
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      {selectedApp.interview_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
