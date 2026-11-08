import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Candidate, Resume } from '../../types';
import { formatExternalUrl } from '../../utils/url';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Upload,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  Trash2,
  RefreshCw,
  Globe,
  ExternalLink
} from 'lucide-react';

export const CandidateProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Candidate | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [completion, setCompletion] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [about, setAbout] = useState('');
  const [certifications, setCertifications] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Resume preview modal
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeUploadLoading, setResumeUploadLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getCandidateProfile();
      setProfile(res.candidate);
      setResume(res.resume);
      setCompletion(res.profileCompletion);

      if (res.candidate) {
        setName(res.candidate.name || '');
        setPhone(res.candidate.phone || '');
        setEducation(res.candidate.education || '');
        setLocation(res.candidate.location || '');
        setProfilePhoto(res.candidate.profile_photo || '');
        setExperience(res.candidate.experience || '');
        setAbout(res.candidate.about || '');
        setCertifications(res.candidate.certifications || '');
        setGithubUrl(res.candidate.github_url || '');
        setLinkedinUrl(res.candidate.linkedin_url || '');

        let parsedSkills = res.candidate.skills;
        try {
          const arr = JSON.parse(res.candidate.skills);
          if (Array.isArray(arr)) parsedSkills = arr.join(', ');
        } catch {}
        setSkills(parsedSkills || '');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setSaving(true);
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.updateCandidateProfile({
        name,
        phone,
        education,
        skills: skillsArray,
        experience,
        location,
        profile_photo: profilePhoto,
        about,
        certifications,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
      });
      setCompletion(res.profileCompletion);
      setSuccessMsg('Profile updated successfully! Real-time Job Fit Scores recomputed.');
      await refreshUser();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle Resume File Upload (file reader)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    setResumeUploadLoading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const textContent = (event.target?.result as string) || '';
        const res = await api.uploadResume({
          file_name: file.name,
          file_data: textContent,
          file_size: file.size,
        });
        setResume(res.resume);
        setSuccessMsg(`Resume "${file.name}" uploaded successfully!`);
        fetchProfile();
        await refreshUser();
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to upload resume');
      } finally {
        setResumeUploadLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read file.');
      setResumeUploadLoading(false);
    };

    // Read as text / base64
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800" />
        <div className="h-96 rounded-2xl bg-slate-900/60 border border-slate-800" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Banner with Completion Percentage */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center overflow-hidden shrink-0">
            {profilePhoto ? (
              <img src={profilePhoto} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{name || 'Your Profile'}</h1>
            <p className="text-xs sm:text-sm text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-indigo-300">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>{location || 'Location not specified'}</span>
            </div>

            {/* Clickable Social Profiles */}
            <div className="flex items-center gap-2 mt-2.5">
              {githubUrl ? (
                <a
                  href={formatExternalUrl(githubUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-indigo-400 text-xs text-slate-200 hover:text-white transition-colors"
                  title="Open GitHub Profile"
                >
                  <Globe className="w-3 h-3 text-indigo-400" />
                  <span>GitHub</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-500 italic">No GitHub URL added</span>
              )}

              {linkedinUrl ? (
                <a
                  href={formatExternalUrl(linkedinUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-blue-400 text-xs text-blue-200 hover:text-white transition-colors"
                  title="Open LinkedIn Profile"
                >
                  <Globe className="w-3 h-3 text-blue-400" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-500 italic">· No LinkedIn URL added</span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completion Circle / Bar */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 w-full sm:w-64">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-300">Profile Completion</span>
            <span className="text-indigo-400">{completion}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {completion < 100
              ? 'Complete education, skills, and resume for 100% profile score'
              : 'All profile sections fully populated!'}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Resume Management Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Resume & Portfolio Document
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Your active resume is automatically attached whenever you apply to any job posting.
            </p>
          </div>

          {/* Upload Button */}
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{resume ? 'Replace Resume' : 'Upload Resume'}</span>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={resumeUploadLoading}
            />
          </label>
        </div>

        {resumeUploadLoading && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center text-xs text-slate-300">
            Uploading and processing resume document...
          </div>
        )}

        {resume ? (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">{resume.file_name}</span>
                <span className="text-xs text-slate-400">
                  Uploaded {new Date(resume.uploaded_at).toLocaleDateString()} · {(resume.file_size ? (resume.file_size / 1024).toFixed(1) : '150')} KB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setResumeModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>View Resume</span>
              </button>
              <a
                href={resume.file_url}
                download={resume.file_name}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center">
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No resume uploaded yet. Click "Upload Resume" above to attach your credentials.</p>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleProfileSubmit} className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" />
          Personal & Professional Credentials
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Location (City, State / Country)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Profile Photo URL</label>
            <input
              type="url"
              value={profilePhoto}
              onChange={(e) => setProfilePhoto(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Education Requirement Alignment
          </label>
          <input
            type="text"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="e.g. Bachelor of Science in Computer Science & Engineering"
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Technical Skills (comma-separated for matching algorithm)
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, Node.js, Python, SQL, Docker, AWS"
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Our transparent matching engine uses these skills to calculate compatibility scores for every job.
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Work Experience & Seniority</label>
          <input
            type="text"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="e.g. 4 years of full-stack web and cloud systems experience"
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Relevant Professional Certifications (comma-separated)
          </label>
          <input
            type="text"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="e.g. AWS Certified Solutions Architect, Certified Kubernetes Administrator (CKA)"
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Relevant industry certifications provide additional bonus points in your objective Candidate Fit Score.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">GitHub Profile URL</label>
              {githubUrl && (
                <a
                  href={formatExternalUrl(githubUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 hover:underline"
                >
                  <span>Open Profile</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/your-username"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">LinkedIn Profile URL</label>
              {linkedinUrl && (
                <a
                  href={formatExternalUrl(linkedinUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 hover:underline"
                >
                  <span>Open Profile</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/your-profile"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">About Me / Professional Bio</label>
          <textarea
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Summarize your career highlights, architectural interests, and preferred roles..."
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Resume Viewer Modal */}
      {resumeModalOpen && resume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  {resume.file_name}
                </h3>
                <span className="text-xs text-slate-400">Attached Candidate Resume</span>
              </div>
              <button
                onClick={() => setResumeModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-[60vh] overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {resume.file_data || 'Resume Content'}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={resume.file_url}
                download={resume.file_name}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </a>
              <button
                onClick={() => setResumeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
