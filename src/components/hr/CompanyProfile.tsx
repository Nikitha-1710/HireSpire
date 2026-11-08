import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Company } from '../../types';
import { CompanyPublicDetailsModal } from './CompanyPublicDetailsModal';
import {
  Building2,
  Globe,
  MapPin,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Users,
  Calendar,
  Lock,
  Eye,
  ShieldCheck
} from 'lucide-react';

export const CompanyProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publicPreviewOpen, setPublicPreviewOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [companySize, setCompanySize] = useState('100-500 employees');
  const [foundedYear, setFoundedYear] = useState<number | string>(2018);
  const [isCompanyIdPublic, setIsCompanyIdPublic] = useState(true);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCompany();
      setCompany(res.company);
      if (res.company) {
        setCompanyName(res.company.company_name || '');
        setLogo(res.company.logo || '');
        setDescription(res.company.description || '');
        setWebsite(res.company.website || '');
        setLocation(res.company.location || '');
        setIndustry(res.company.industry || '');
        setContactInfo(res.company.contact_information || '');
        setCompanySize(res.company.company_size || '100-500 employees');
        setFoundedYear(res.company.founded_year || 2018);
        setIsCompanyIdPublic(
          res.company.is_company_id_public !== undefined
            ? Boolean(res.company.is_company_id_public)
            : true
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch company profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      setError('Company name is required.');
      return;
    }

    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await api.updateCompany({
        company_name: companyName,
        logo,
        description,
        website,
        location,
        industry,
        contact_information: contactInfo,
        company_size: companySize,
        founded_year: Number(foundedYear) || 2018,
        is_company_id_public: isCompanyIdPublic,
      });
      setCompany(res.company);
      setSuccess('Company profile updated successfully! Changes are visible in the Companies Directory.');
      await refreshUser();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800" />
        <div className="h-96 rounded-2xl bg-slate-900/60 border border-slate-800" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-violet-950 via-slate-900 to-slate-900 border border-violet-500/20 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/30 border border-violet-400/30 flex items-center justify-center overflow-hidden shrink-0">
            {logo ? (
              <img src={logo} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-violet-400" />
            )}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              Corporate Entity
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {companyName || 'Your Company Profile'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
              <span>{industry || 'Industry not specified'}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                {location || 'Location not specified'}
              </span>
            </div>
            {company?.company_id && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-950 border border-violet-700/60 text-violet-300">
                  Company ID: {company.company_id}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(company.company_id);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Company ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPublicPreviewOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Preview Public Card</span>
          </button>

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <span>Visit Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
            </a>
          )}
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-violet-400" />
          Company Information & Employer Branding
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Company Legal Name *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Company Logo URL</label>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Industry / Sector</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Enterprise Software & Cloud Infrastructure"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Headquarters Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Official Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Contact Email / Phone</label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="careers@company.com"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Company Size (Employees)</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
            >
              <option value="1-10 employees">1-10 employees (Early Startup)</option>
              <option value="10-50 employees">10-50 employees (Growing Venture)</option>
              <option value="50-200 employees">50-200 employees (Mid-Stage)</option>
              <option value="200-500 employees">200-500 employees (Scale-up)</option>
              <option value="500-1,000 employees">500-1,000 employees (Established)</option>
              <option value="1,000-5,000 employees">1,000-5,000 employees (Enterprise)</option>
              <option value="5,000+ employees">5,000+ employees (Global Mega-Corp)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Founded Year</label>
            <input
              type="number"
              min="1800"
              max="2099"
              value={foundedYear}
              onChange={(e) => setFoundedYear(e.target.value)}
              placeholder="e.g. 2018"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>

        {/* Public Directory Visibility Toggle for Company ID */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Public Company ID Visibility in Directory
            </span>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              When checked, your registered Company ID ({company?.company_id}) will be displayed and copyable on your public profile card in the Companies Directory so other recruiters or candidates can connect. When unchecked, your ID remains private.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={isCompanyIdPublic}
              onChange={(e) => setIsCompanyIdPublic(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Company Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share your mission, products, market scale, and why candidates should join your team..."
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-violet-500 outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Company Profile</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Public Card Preview Modal */}
      {publicPreviewOpen && company?.company_id && (
        <CompanyPublicDetailsModal
          companyId={company.company_id}
          onClose={() => setPublicPreviewOpen(false)}
        />
      )}
    </div>
  );
};
