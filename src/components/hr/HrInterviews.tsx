import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Interview } from '../../types';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Search,
  Plus,
  FileText,
  MessageSquare,
  Star,
  Sparkles
} from 'lucide-react';

interface HrInterviewsProps {
  onPostJob?: () => void;
  onNavigate?: (tab: string) => void;
}

export const HrInterviews: React.FC<HrInterviewsProps> = ({
  onPostJob,
  onNavigate,
}) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit / Debrief Modal State
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [editStatus, setEditStatus] = useState<'Scheduled' | 'Completed' | 'Cancelled'>('Scheduled');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editRoundType, setEditRoundType] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editInterviewer, setEditInterviewer] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState<number>(5);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getInterviews();
      setInterviews(res.interviews || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const openEditModal = (int: Interview) => {
    setEditingInterview(int);
    setEditStatus(int.status);
    setEditDate(int.interview_date || '');
    setEditTime(int.interview_time || '');
    setEditRoundType(int.interview_type || 'Coding & Architecture');
    setEditLocation(int.location_or_meeting_info || 'https://meet.google.com/new');
    setEditInterviewer(int.interviewer || '');
    setEditNotes(int.notes || '');
    setEditRating(5);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInterview) return;

    setSaveLoading(true);
    try {
      await api.updateInterview(editingInterview.interview_id, {
        status: editStatus,
        interview_date: editDate,
        interview_time: editTime,
        interview_type: editRoundType,
        location_or_meeting_info: editLocation,
        interviewer: editInterviewer,
        notes: editNotes,
      });

      setEditingInterview(null);
      await fetchInterviews();
    } catch (err: any) {
      alert(err.message || 'Failed to update interview');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleQuickComplete = async (int: Interview) => {
    try {
      await api.updateInterview(int.interview_id, { status: 'Completed' });
      await fetchInterviews();
    } catch (err: any) {
      alert(err.message || 'Failed to complete interview');
    }
  };

  const handleQuickCancel = async (int: Interview) => {
    if (!window.confirm(`Are you sure you want to cancel the interview for ${int.candidate_name}?`)) {
      return;
    }
    try {
      await api.updateInterview(int.interview_id, { status: 'Cancelled' });
      await fetchInterviews();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel interview');
    }
  };

  const handleJoinCall = (urlOrInfo: string) => {
    let target = urlOrInfo.trim();
    if (!target || !target.startsWith('http')) {
      target = 'https://meet.google.com/new';
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const formatInterviewId = (id: string, index: number) => {
    if (!id) return `INT-${301 + index * 2}`;
    const clean = id.toUpperCase();
    if (clean.startsWith('INT-')) return clean;
    if (/^\d+$/.test(clean)) return `INT-${clean}`;
    return `INT-${301 + index * 2}`;
  };

  const filtered = interviews.filter((item) => {
    if (statusFilter !== 'All' && item.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCandidate = item.candidate_name?.toLowerCase().includes(q);
      const matchRole = item.job_title?.toLowerCase().includes(q);
      const matchInterviewer = item.interviewer?.toLowerCase().includes(q);
      const matchType = item.interview_type?.toLowerCase().includes(q);
      const matchId = String(item.interview_id).toLowerCase().includes(q);
      return matchCandidate || matchRole || matchInterviewer || matchType || matchId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Action Controls matching screenshot model */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Interview Management & Evaluations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Scheduled assessments, technical rounds, candidate feedback
          </p>
        </div>

        {/* Action Controls Right Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, role, ID..."
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-60"
            />
          </div>

          {/* Screen Resume Action */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('applications')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Screen Resume</span>
            </button>
          )}

          {/* Post Job Action */}
          {onPostJob && (
            <button
              onClick={onPostJob}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/40 text-teal-300 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span>Post Job</span>
            </button>
          )}

          {/* Refresh Action */}
          <button
            onClick={fetchInterviews}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh interview schedules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filter Pills Tabs */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium w-fit">
        {(['All', 'Scheduled', 'Completed', 'Cancelled'] as const).map((tab) => {
          const count =
            tab === 'All'
              ? interviews.length
              : interviews.filter((i) => i.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Cards Grid Layout */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-red-400 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No interviews found.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No interviews match your search keyword. Try clearing the search query.'
              : 'When candidates are scheduled for technical rounds or debrief evaluations, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, index) => {
            const isScheduled = item.status === 'Scheduled';
            const isCompleted = item.status === 'Completed';

            return (
              <div
                key={item.interview_id}
                className="p-6 rounded-3xl bg-[#0b1325]/90 border border-slate-800/80 shadow-2xl flex flex-col justify-between hover:border-slate-700/80 transition-all relative overflow-hidden group"
              >
                <div>
                  {/* Top Row: ID Badge & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/70 font-mono text-[11px] font-bold text-slate-300">
                      {formatInterviewId(item.interview_id, index)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${
                        isScheduled
                          ? 'bg-blue-950/90 text-blue-400 border-blue-700/60'
                          : isCompleted
                          ? 'bg-emerald-950/90 text-emerald-400 border-emerald-700/60'
                          : 'bg-rose-950/90 text-rose-400 border-rose-700/60'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Candidate Name & Title */}
                  <h3 className="text-xl font-bold text-white tracking-tight mt-3">
                    {item.candidate_name || 'Candidate Name'}
                  </h3>
                  <p className="text-sm font-medium text-blue-400 mt-0.5">
                    {item.job_title || 'Engineering Candidate'}
                  </p>

                  {/* Key-Value Details Box */}
                  <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Round Type:</span>
                      <span className="font-semibold text-white font-mono">
                        {item.interview_type || 'Technical Screening'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Date & Time:</span>
                      <span className="font-semibold text-white">
                        {item.interview_date} • {item.interview_time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Interviewer:</span>
                      <span
                        className="font-semibold text-white truncate max-w-[190px]"
                        title={item.interviewer}
                      >
                        {item.interviewer}
                      </span>
                    </div>
                  </div>

                  {/* Join Google Meet Call Button with Live indicator */}
                  <button
                    type="button"
                    onClick={() => handleJoinCall(item.location_or_meeting_info)}
                    className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#092b2f]/90 hover:bg-[#0c393f] border border-[#146360]/70 text-[#2dd4bf] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm relative group"
                  >
                    <Video className="w-4 h-4 text-[#2dd4bf]" />
                    <span>Join Google Meet Call</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#2dd4bf]" />
                    {isScheduled && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0b1325]" />
                    )}
                  </button>

                  {/* Debrief Feedback Section */}
                  <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Debrief Feedback:</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      “{item.notes || 'Pre-screening notes: Exceptional portfolio background, verified skills, and positive round assessment.'}”
                    </p>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/70 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Edit Debrief</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickComplete(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                    <button
                      onClick={() => handleQuickCancel(item)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Sleek Edit Debrief & Interview Modal */}
      {editingInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setEditingInterview(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Evaluation & Debrief
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {editingInterview.candidate_name} · {editingInterview.job_title}
              </h2>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="e.g. 10:00 AM PST"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Round Type</label>
                  <input
                    type="text"
                    required
                    value={editRoundType}
                    onChange={(e) => setEditRoundType(e.target.value)}
                    placeholder="e.g. Coding & Architecture"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Interviewer</label>
                  <input
                    type="text"
                    required
                    value={editInterviewer}
                    onChange={(e) => setEditInterviewer(e.target.value)}
                    placeholder="e.g. Dr. Sarah Connor (Head of Engineering)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Google Meet URL / Room Link</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">Debrief Evaluation Notes</label>
                  <div className="flex items-center gap-1 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => setEditRating(star)}
                        className={`w-4 h-4 transition-colors ${
                          star <= editRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Enter debrief notes, strengths, architectural feedback, and hiring recommendation..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInterview(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-60"
                >
                  {saveLoading ? 'Saving...' : 'Save Debrief & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
