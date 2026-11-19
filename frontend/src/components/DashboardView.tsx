import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShieldAlert, ShieldCheck, AlertTriangle, FileText, 
  Download, Trash2, Eye, Plus, RefreshCw, Clock, Lock, ExternalLink 
} from 'lucide-react';
import { InvestigationSummary } from '../types';
import { apiService } from '../services/api';

interface DashboardViewProps {
  onOpenInvestigation: (id: string) => void;
  onNewInvestigation: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenInvestigation,
  onNewInvestigation
}) => {
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await apiService.getInvestigations();
      setInvestigations(data);
    } catch (err) {
      console.warn('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently purge this forensic case record?')) return;
    try {
      await apiService.deleteInvestigation(id);
      setInvestigations(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      alert('Failed to delete investigation record.');
    }
  };

  const handleDownload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(apiService.getReportDownloadUrl(id), '_blank');
  };

  const totalCases = investigations.length;
  const flaggedCases = investigations.filter(i => 
    i.assessment.includes('Multiple suspicious') || i.assessment.includes('Some indicators')
  ).length;
  const cleanCases = investigations.filter(i => 
    i.assessment.includes('No significant')
  ).length;
  const avgScore = totalCases > 0 
    ? Math.round(investigations.reduce((acc, curr) => acc + (curr.indicator_score || 0), 0) / totalCases)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 mb-1 flex items-center gap-2">
            <span className="bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded font-bold">REGISTRY V4.8</span>
            <span>// CHAIN-OF-CUSTODY ARCHIVE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Forensic Dossier Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Certified investigative records, cryptographic hashes, and consensus anomaly telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchHistory}
            className="p-2.5 rounded-xl border border-white/10 bg-[#101B2D] text-slate-300 hover:text-white transition"
            title="Refresh Registry"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          
          <button
            onClick={onNewInvestigation}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Open New Case</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Ingestions */}
        <div className="bg-[#101B2D] border border-white/10 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Total Ingestions</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{totalCases}</p>
          <p className="text-[11px] text-slate-400">Cryptographically hashed cases</p>
        </div>

        {/* Flagged Cases */}
        <div className="bg-[#101B2D] border border-white/10 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Flagged Dossiers</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400 font-mono">{flaggedCases}</p>
          <p className="text-[11px] text-slate-400">Suspicious markers detected</p>
        </div>

        {/* Coherent Cases */}
        <div className="bg-[#101B2D] border border-white/10 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Coherent Specimens</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">{cleanCases}</p>
          <p className="text-[11px] text-slate-400">Passed optical & frequency checks</p>
        </div>

        {/* Mean Indicator Index */}
        <div className="bg-[#101B2D] border border-white/10 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Mean Anomaly Index</span>
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-cyan-300 font-mono">
            {avgScore} <span className="text-sm text-slate-500 font-normal">/100</span>
          </p>
          <p className="text-[11px] text-slate-400">Aggregate cross-vector score</p>
        </div>

      </div>

      {/* Registry Table */}
      <div className="bg-[#101B2D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-mono uppercase tracking-wider">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Evidentiary Chain-of-Custody Log</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {investigations.length} recorded dossiers in vault
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            <p>Decrypting vault registry...</p>
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-semibold text-slate-300">No Forensic Dossiers Recorded Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Open a new case intake to analyze suspect media, inspect the Evidence Scorecard, and register chain-of-custody files.
            </p>
            <button
              onClick={onNewInvestigation}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              Start First Investigation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c1323] border-b border-white/10 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Dossier / Target File</th>
                  <th className="py-3.5 px-4">SHA-256 Checksum</th>
                  <th className="py-3.5 px-4">Consensus Assessment</th>
                  <th className="py-3.5 px-4 text-center">Anomaly Index</th>
                  <th className="py-3.5 px-4">Timestamp (UTC)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {investigations.map((inv) => {
                  const isSuspicious = inv.assessment.includes('Multiple suspicious');
                  const isModerate = inv.assessment.includes('Some indicators');

                  return (
                    <tr 
                      key={inv.id}
                      onClick={() => onOpenInvestigation(inv.id)}
                      className="hover:bg-white/5 transition-all cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-sans font-semibold text-white">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-2 h-2 rounded-full ${isSuspicious ? 'bg-rose-400' : isModerate ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                          <span className="truncate max-w-[200px]" title={inv.image_name}>{inv.image_name}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-400">
                        <code className="text-cyan-400 text-[11px]">
                          {inv.image_hash ? `${inv.image_hash.slice(0, 12)}...` : 'N/A'}
                        </code>
                      </td>

                      <td className="py-4 px-4 font-sans">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isSuspicious 
                            ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' 
                            : isModerate
                            ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                            : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        }`}>
                          {inv.assessment}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-bold">
                        <span className={isSuspicious ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-cyan-300'}>
                          {inv.indicator_score}
                        </span>
                        <span className="text-slate-500 text-[10px]"> /100</span>
                      </td>

                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenInvestigation(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition"
                            title="Inspect Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleDownload(inv.id, e)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-emerald-300 transition"
                            title="Export PDF Report"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleDelete(inv.id, e)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                            title="Purge Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
