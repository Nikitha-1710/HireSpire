import React, { useState, useEffect } from 'react';
import { Job } from '../../types';
import { api } from '../../services/api';
import {
  Briefcase,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  Users,
  AlertCircle,
  X,
  Save,
  CheckCircle2,
  Sliders,
  Target,
  Sparkles,
  Award,
  GraduationCap,
  Clock,
  RotateCcw,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PostJobModalProps {
  jobToEdit?: Job | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface WeightPreset {
  name: string;
  badge: string;
  description: string;
  skills: number;
  experience: number;
  education: number;
  location: number;
  certifications: number;
  minScore: number;
}

const PRESETS: WeightPreset[] = [
  {
    name: 'Balanced Standard',
    badge: 'Recommended',
    description: 'Even distribution across technical proficiency and background',
    skills: 40,
    experience: 25,
    education: 15,
    location: 10,
    certifications: 10,
    minScore: 60,
  },
  {
    name: 'Skills & Tech Heavy',
    badge: 'Code Focused',
    description: 'Prioritizes raw coding ability and required tool stack',
    skills: 55,
    experience: 20,
    education: 10,
    location: 10,
    certifications: 5,
    minScore: 65,
  },
  {
    name: 'Senior Leadership',
    badge: 'Tenure Focused',
    description: 'Deep industry years, track record, and execution history',
    skills: 30,
    experience: 45,
    education: 10,
    location: 10,
    certifications: 5,
    minScore: 70,
  },
  {
    name: 'Remote First',
    badge: 'Zero Commute',
    description: 'Location weight set to 0 to accept global remote talent',
    skills: 45,
    experience: 30,
    education: 15,
    location: 0,
    certifications: 10,
    minScore: 60,
  },
  {
    name: 'Credentials & Domain',
    badge: 'High Compliance',
    description: 'Strict requirements on university degrees and certified credentials',
    skills: 30,
    experience: 20,
    education: 25,
    location: 10,
    certifications: 15,
    minScore: 65,
  },
];

export const PostJobModal: React.FC<PostJobModalProps> = ({ jobToEdit, onClose, onSuccess }) => {
  const isEditing = !!jobToEdit;

  const [title, setTitle] = useState(jobToEdit?.title || '');
  const [description, setDescription] = useState(jobToEdit?.description || '');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState(jobToEdit?.experience_required || '2-4 years');
  const [education, setEducation] = useState(
    jobToEdit?.education_requirement || "Bachelor's in Computer Science or equivalent"
  );
  const [location, setLocation] = useState(jobToEdit?.location || 'San Francisco, CA');
  const [salaryRange, setSalaryRange] = useState(jobToEdit?.salary_range || '$130,000 - $160,000');
  const [jobType, setJobType] = useState(jobToEdit?.job_type || 'Full-time');
  const [openings, setOpenings] = useState(jobToEdit?.openings || 2);
  const [deadline, setDeadline] = useState(jobToEdit?.deadline || '2026-12-31');
  const [status, setStatus] = useState<'Draft' | 'Active' | 'Closed'>(jobToEdit?.status || 'Active');

  // Dynamic Fit Score & Weight Configuration
  const [fitScoreEnabled, setFitScoreEnabled] = useState<boolean>(
    jobToEdit?.fit_score_enabled !== undefined ? Boolean(jobToEdit.fit_score_enabled) : true
  );
  const [weightSkills, setWeightSkills] = useState<number>(jobToEdit?.weight_skills ?? 40);
  const [weightExperience, setWeightExperience] = useState<number>(jobToEdit?.weight_experience ?? 25);
  const [weightEducation, setWeightEducation] = useState<number>(jobToEdit?.weight_education ?? 15);
  const [weightLocation, setWeightLocation] = useState<number>(jobToEdit?.weight_location ?? 10);
  const [weightCertifications, setWeightCertifications] = useState<number>(
    jobToEdit?.weight_certifications ?? 10
  );
  const [minFitScore, setMinFitScore] = useState<number>(jobToEdit?.min_fit_score ?? 60);

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvancedWeights, setShowAdvancedWeights] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobToEdit) {
      try {
        const p = JSON.parse(jobToEdit.required_skills);
        if (Array.isArray(p)) setSkills(p.join(', '));
        else setSkills(jobToEdit.required_skills);
      } catch {
        setSkills(jobToEdit.required_skills);
      }
      setWeightSkills(jobToEdit.weight_skills ?? 40);
      setWeightExperience(jobToEdit.weight_experience ?? 25);
      setWeightEducation(jobToEdit.weight_education ?? 15);
      setWeightLocation(jobToEdit.weight_location ?? 10);
      setWeightCertifications(jobToEdit.weight_certifications ?? 10);
      setMinFitScore(jobToEdit.min_fit_score ?? 60);
      setFitScoreEnabled(jobToEdit.fit_score_enabled !== undefined ? Boolean(jobToEdit.fit_score_enabled) : true);
    } else {
      setSkills('React, TypeScript, Node.js, SQL, REST APIs');
    }
  }, [jobToEdit]);

  const totalWeight = weightSkills + weightExperience + weightEducation + weightLocation + weightCertifications;

  const handleApplyPreset = (preset: WeightPreset) => {
    setActivePreset(preset.name);
    setWeightSkills(preset.skills);
    setWeightExperience(preset.experience);
    setWeightEducation(preset.education);
    setWeightLocation(preset.location);
    setWeightCertifications(preset.certifications);
    setMinFitScore(preset.minScore);
  };

  const handleNormalizeWeights = () => {
    if (totalWeight <= 0) {
      setWeightSkills(40);
      setWeightExperience(25);
      setWeightEducation(15);
      setWeightLocation(10);
      setWeightCertifications(10);
      return;
    }
    const ratio = 100 / totalWeight;
    const nSkills = Math.round(weightSkills * ratio);
    const nExp = Math.round(weightExperience * ratio);
    const nEdu = Math.round(weightEducation * ratio);
    const nLoc = Math.round(weightLocation * ratio);
    const remaining = 100 - (nSkills + nExp + nEdu + nLoc);
    setWeightSkills(nSkills);
    setWeightExperience(nExp);
    setWeightEducation(nEdu);
    setWeightLocation(nLoc);
    setWeightCertifications(Math.max(0, remaining));
  };

  // Live simulation with a sample candidate
  const sampleCandidate = {
    skillRatio: 0.8, // 4 out of 5 skills
    expRatio: 1.0,   // Meets required years
    eduRatio: 1.0,   // Satisfies Bachelor CS degree
    locRatio: 1.0,   // Matches location
    certRatio: 0.6,  // Has 1 relevant cert
  };

  const simSkills = Math.round(sampleCandidate.skillRatio * weightSkills);
  const simExp = Math.round(sampleCandidate.expRatio * weightExperience);
  const simEdu = Math.round(sampleCandidate.eduRatio * weightEducation);
  const simLoc = Math.round(sampleCandidate.locRatio * weightLocation);
  const simCerts = Math.round(sampleCandidate.certRatio * weightCertifications);
  const simTotal = simSkills + simExp + simEdu + simLoc + simCerts;
  const simNormalized = totalWeight > 0 ? Math.min(100, Math.round((simTotal / totalWeight) * 100)) : 0;
  const simPassed = simNormalized >= minFitScore;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location || !salaryRange || !deadline) {
      setError('Please provide title, description, location, salary range, and deadline.');
      return;
    }

    setLoading(true);
    setError(null);

    const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      title,
      description,
      required_skills: skillsArray,
      experience_required: experience,
      education_requirement: education,
      location,
      salary_range: salaryRange,
      job_type: jobType,
      openings: Number(openings),
      deadline,
      status,
      weight_skills: weightSkills,
      weight_experience: weightExperience,
      weight_education: weightEducation,
      weight_location: weightLocation,
      weight_certifications: weightCertifications,
      min_fit_score: minFitScore,
      fit_score_enabled: fitScoreEnabled ? 1 : 0,
    };

    try {
      if (isEditing) {
        await api.updateJob(jobToEdit.job_id, payload);
      } else {
        await api.createJob(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto my-auto relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {isEditing ? 'Update Requisition' : 'Job Opening Creator'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Fit Score Engine Integrated
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
            {isEditing ? `Edit Job: ${jobToEdit.title}` : 'Post a New Job Opening'}
          </h2>
          <p className="text-xs text-slate-400">
            Configure job specifications along with custom candidate match weights & scoring criteria.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Job Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Publication Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="Active">Active (Accepting Applications)</option>
                <option value="Draft">Draft (Hidden)</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Salary Range *</label>
              <input
                type="text"
                required
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. $140,000 - $175,000"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Arrangement</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="Full-time">Full-time</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Experience Required *</label>
              <input
                type="text"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 3-5 years"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Open Positions</label>
              <input
                type="number"
                min="1"
                required
                value={openings}
                onChange={(e) => setOpenings(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Application Deadline *</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Education Requirement</label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. Bachelor's in Computer Science or relevant discipline"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Required Technical Skills (comma-separated for matching engine) *
            </label>
            <input
              type="text"
              required
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, TypeScript, Node.js, SQL, Docker, AWS"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Candidate applications will be automatically scored against these skills using your configured weights.
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Job Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe role responsibilities, team impact, technical stack, and perks..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* ============================================================== */}
          {/* DYNAMIC JOB FIT-SCORE WEIGHTS & CRITERIA SECTION */}
          {/* ============================================================== */}
          <div className="pt-2 border-t border-slate-800/80 space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900/90 border border-indigo-500/20 p-4 sm:p-5 space-y-4 shadow-lg">
              {/* Header and Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Dynamic Candidate Fit–Score Weights</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Smart AI Matcher
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Customize how candidate profiles are ranked against skills, experience, and credentials.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFitScoreEnabled(!fitScoreEnabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                      fitScoreEnabled
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${fitScoreEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>{fitScoreEnabled ? 'Fit Score: ON' : 'Fit Score: OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedWeights(!showAdvancedWeights)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showAdvancedWeights ? 'Collapse settings' : 'Expand settings'}
                  >
                    {showAdvancedWeights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {fitScoreEnabled && showAdvancedWeights && (
                <div className="space-y-4 pt-1">
                  {/* Quick Preset Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Role Presets (Instant Weight Templates)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {PRESETS.map((preset) => {
                        const isSelected = activePreset === preset.name;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleApplyPreset(preset)}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-[10px] font-bold truncate text-indigo-300">{preset.badge}</div>
                            <div className="text-xs font-semibold truncate text-white">{preset.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5 Interactive Weight Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Skills Weight */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Technical Skills Weight</span>
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs">
                          {weightSkills}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="5"
                        value={weightSkills}
                        onChange={(e) => {
                          setWeightSkills(Number(e.target.value));
                          setActivePreset(null);
                        }}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <p className="text-[10px] text-slate-400">
                        Points awarded for matching declared skills vs required tech stack.
                      </p>
                    </div>

                    {/* Experience Weight */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Experience Alignment Weight</span>
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs">
                          {weightExperience}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="5"
                        value={weightExperience}
                        onChange={(e) => {
                          setWeightExperience(Number(e.target.value));
                          setActivePreset(null);
                        }}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <p className="text-[10px] text-slate-400">
                        Evaluates candidate years in industry relative to {experience}.
                      </p>
                    </div>

                    {/* Education Weight */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Education Credential Weight</span>
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs">
                          {weightEducation}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={weightEducation}
                        onChange={(e) => {
                          setWeightEducation(Number(e.target.value));
                          setActivePreset(null);
                        }}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <p className="text-[10px] text-slate-400">
                        Degree levels (Bachelors, Masters, PhD, Computer Science).
                      </p>
                    </div>

                    {/* Location Weight */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Location & Remote Flexibility</span>
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs">
                          {weightLocation}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="5"
                        value={weightLocation}
                        onChange={(e) => {
                          setWeightLocation(Number(e.target.value));
                          setActivePreset(null);
                        }}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <p className="text-[10px] text-slate-400">
                        Proximity to {location} or remote work capability. Set 0 for open location.
                      </p>
                    </div>

                    {/* Certifications Weight */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Relevant Certifications & Domain Badges Weight</span>
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs">
                          {weightCertifications}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="5"
                        value={weightCertifications}
                        onChange={(e) => {
                          setWeightCertifications(Number(e.target.value));
                          setActivePreset(null);
                        }}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <p className="text-[10px] text-slate-400">
                        Verified industry certifications (AWS, GCP, CKA, PMP, Scrum Master).
                      </p>
                    </div>
                  </div>

                  {/* Weight Balance Status & Quick Normalization */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          totalWeight === 100 ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                        }`}
                      />
                      <div className="text-xs">
                        <span className="text-slate-300 font-semibold">Total Weight Sum: </span>
                        <span
                          className={`font-bold ${
                            totalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {totalWeight}% / 100%
                        </span>
                        {totalWeight !== 100 && (
                          <span className="text-[10px] text-slate-400 block sm:inline sm:ml-2">
                            (Will be automatically normalized proportionally)
                          </span>
                        )}
                      </div>
                    </div>

                    {totalWeight !== 100 && (
                      <button
                        type="button"
                        onClick={handleNormalizeWeights}
                        className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Auto-Balance to 100%</span>
                      </button>
                    )}
                  </div>

                  {/* Minimum Fit Score Threshold */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Minimum Fit Score Quality Threshold</span>
                      </span>
                      <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs">
                        {minFitScore}% Passing
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="85"
                      step="5"
                      value={minFitScore}
                      onChange={(e) => setMinFitScore(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <p className="text-[10px] text-slate-400">
                      Applicants achieving {minFitScore}% or higher are marked as "Qualified Match" and prioritized in the HR pipeline.
                    </p>
                  </div>

                  {/* Live Simulation Preview Card */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Live Simulation: Sample Candidate Scoring</span>
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          simPassed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        Simulated: {simNormalized}% Fit Score ({simPassed ? 'Meets Threshold' : 'Below Threshold'})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                      <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="text-slate-400">Skills (4/5)</div>
                        <div className="font-bold text-white">+{simSkills} pts</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="text-slate-400">Exp ({experience})</div>
                        <div className="font-bold text-white">+{simExp} pts</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="text-slate-400">Education (BS CS)</div>
                        <div className="font-bold text-white">+{simEdu} pts</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="text-slate-400">Location</div>
                        <div className="font-bold text-white">+{simLoc} pts</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="text-slate-400">Certifications</div>
                        <div className="font-bold text-white">+{simCerts} pts</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving Requisition...' : isEditing ? 'Update Job Posting' : 'Publish Job Posting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

