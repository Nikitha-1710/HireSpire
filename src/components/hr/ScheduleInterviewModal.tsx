import React, { useState } from 'react';
import { Application } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  Video,
  User,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

interface ScheduleInterviewModalProps {
  application: Application | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  application,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('14:00 EST');
  const [interviewType, setInterviewType] = useState('Technical Round');
  const [locationOrMeeting, setLocationOrMeeting] = useState(
    'https://meet.google.com/abc-defg-hij (Google Meet Room)'
  );
  const [interviewer, setInterviewer] = useState(user?.name || 'Lead Engineering Interviewer');
  const [notes, setNotes] = useState(
    'Review candidate system architecture experience and discuss project portfolio.'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!application) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewDate || !interviewTime || !locationOrMeeting || !interviewer) {
      setError('Please provide date, time, meeting info, and interviewer name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.scheduleInterview({
        application_id: application.application_id,
        interview_date: interviewDate,
        interview_time: interviewTime,
        interview_type: interviewType,
        location_or_meeting_info: locationOrMeeting,
        interviewer,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Interview Management
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Schedule Interview with {application.candidate_name}
          </h2>
          <p className="text-xs text-slate-400">
            Role: <span className="text-slate-200 font-medium">{application.job_title}</span>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Interview Date *</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Interview Time *</label>
              <input
                type="text"
                required
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                placeholder="e.g. 14:00 EST or 10:30 AM"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Interview Format *</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
              >
                <option value="Technical Round">Technical Round</option>
                <option value="HR Round">HR Round</option>
                <option value="Managerial">Managerial</option>
                <option value="Video Call">Video Call</option>
                <option value="In-Person">In-Person</option>
                <option value="Coding Assessment">Coding Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Interviewer Name *</label>
              <input
                type="text"
                required
                value={interviewer}
                onChange={(e) => setInterviewer(e.target.value)}
                placeholder="e.g. Alex Rivera, Senior Engineering Lead"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Meeting Location / Video Conference Link *
            </label>
            <input
              type="text"
              required
              value={locationOrMeeting}
              onChange={(e) => setLocationOrMeeting(e.target.value)}
              placeholder="e.g. https://meet.google.com/xyz-qwer-zxc or Office Room 402"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Preparation Notes / Focus Areas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add agenda, technical problem areas, or briefing notes..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 text-[11px] text-violet-300">
            Scheduling this interview will automatically update application status to <strong>Interview Scheduled</strong> and dispatch an instant notification with meeting links to {application.candidate_name}.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{loading ? 'Confirming...' : 'Confirm & Notify Candidate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
