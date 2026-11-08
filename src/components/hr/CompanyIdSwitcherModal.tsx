import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Company } from '../../types';
import {
  Building2,
  CheckCircle2,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  MapPin,
  Briefcase
} from 'lucide-react';

interface CompanyIdSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CompanyIdSwitcherModal: React.FC<CompanyIdSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, switchCompany } = useAuth();
  const [inputCompanyId, setInputCompanyId] = useState(user?.company_id || '');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputCompanyId(user?.company_id || '');
      setError(null);
      setSuccess(null);
      loadCompanies();
    }
  }, [isOpen, user?.company_id]);

  const loadCompanies = async () => {
    try {
      setLoadingList(true);
      const res = await api.getCompaniesList();
      setCompanies(res.companies);
    } catch {
      // Non-blocking
    } finally {
      setLoadingList(false);
    }
  };

  if (!isOpen) return null;

  const handleSwitchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCompanyId.trim()) {
      setError('Please enter a Company ID.');
      return;
    }

    setSwitching(true);
    setError(null);
    try {
      await switchCompany(inputCompanyId.trim());
      setSuccess(`Company dashboard loaded successfully!`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to switch company. Please check the Company ID.');
    } finally {
      setSwitching(false);
    }
  };

  const handleSelectCompany = (id: string) => {
    setInputCompanyId(id);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-violet-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Access Company Dashboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your Company ID to load that specific company's requisitions, applicants, and pipeline.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSwitchSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Company ID
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                required
                value={inputCompanyId}
                onChange={(e) => setInputCompanyId(e.target.value)}
                placeholder="e.g. comp_mycompany, etc."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Current active Company ID: <strong className="text-violet-400 font-mono">{user?.company_id || 'None'}</strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={switching || !inputCompanyId.trim()}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {switching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Loading Company Portal...</span>
              </>
            ) : (
              <>
                <span>Open Company Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick 1-Click Available Corporate Portals */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Or Choose Registered Corporate Entity:</span>
            {loadingList && <span className="text-[10px] text-slate-500">Loading...</span>}
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {companies.map((c) => {
              const isCurrent = c.company_id === user?.company_id;
              const isSelected = c.company_id === inputCompanyId;

              return (
                <div
                  key={c.company_id}
                  onClick={() => handleSelectCompany(c.company_id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-violet-950/60 border-violet-500/60 ring-1 ring-violet-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-400/20 flex items-center justify-center text-violet-300 font-bold text-xs shrink-0 overflow-hidden">
                      {c.logo ? (
                        <img src={c.logo} alt={c.company_name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-4 h-4 text-violet-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate block">
                          {c.company_name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono text-violet-400">{c.company_id}</span>
                        {c.location && (
                          <>
                            <span>·</span>
                            <span className="truncate">{c.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-violet-400 font-medium shrink-0 hover:underline">
                    Select
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
