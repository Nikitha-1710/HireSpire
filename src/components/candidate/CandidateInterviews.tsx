import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Interview } from '../../types';
import {
  Calendar,
  Clock,
  Video,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Star,
  Search
} from 'lucide-react';

export const CandidateInterviews: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleJoinCall = (urlOrInfo: string) => {
    let target = urlOrInfo?.trim();
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

  const filteredInterviews = interviews.filter((item) => {
    if (filter !== 'All' && item.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRole = item.job_title?.toLowerCase().includes(q);
      const matchCompany = item.company_name?.toLowerCase().includes(q);
      const matchInterviewer = item.interviewer?.toLowerCase().includes(q);
      const matchType = item.interview_type?.toLowerCase().includes(q);
      return matchRole || matchCompany || matchInterviewer || matchType;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Interview Management & Schedules</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your confirmed interview rounds, video conference links, and debrief feedback
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search role, company, interviewer..."
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-60"
            />
          </div>

          <button
            onClick={fetchInterviews}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium w-fit">
        {(['All', 'Scheduled', 'Completed', 'Cancelled'] as const).map((tab) => {
          const count =
            tab === 'All'
              ? interviews.length
              : interviews.filter((i) => i.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === tab ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Cards Grid */}
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
      ) : filteredInterviews.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No interviews scheduled yet.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When employers review your application and schedule an interview round, it will appear here with instructions and video meeting links.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInterviews.map((item, index) => {
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

                  {/* Company & Role */}
                  <h3 className="text-xl font-bold text-white tracking-tight mt-3">
                    {item.job_title}
                  </h3>
                  <p className="text-sm font-medium text-blue-400 mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>{item.company_name}</span>
                  </p>

                  {/* Key-Value Details */}
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
                      <span className="font-semibold text-white truncate max-w-[190px]" title={item.interviewer}>
                        {item.interviewer}
                      </span>
                    </div>
                  </div>

                  {/* Join Google Meet Call Button */}
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

                  {/* Debrief Feedback / Recruiter Notes */}
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
                      “{item.notes || 'Please prepare your environment with your preferred IDE and GitHub repositories for architectural review.'}”
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
