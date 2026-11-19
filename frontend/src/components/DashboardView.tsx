import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShieldAlert, ShieldCheck, AlertTriangle, FileText, 
  Download, Trash2, Eye, Plus, RefreshCw, Clock, ExternalLink 
} from 'lucide-react';
import { InvestigationSummary, FullAnalysisResponse } from '../types';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiService.getInvestigations();
      setInvestigations(data);
    } catch (err: any) {
      setErrorMsg('Failed to fetch investigation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this forensic case record?')) return;
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

  // Metrics computation
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <LayoutDashboard className="w-6 h-6 text-cyan-400" />
            <span>Forensic Operations Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400">
            Case history, evidentiary registry, and suspicious indicator metrics
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchHistory}
            className="p-2 rounded-lg border border-slate-700 bg-cyber-900 text-slate-300 hover:text-white transition"
            title="Refresh Registry"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={onNewInvestigation}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Investigations */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-mono">
            <span>Total Cases</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{totalCases}</p>
          <p className="text-[11px] text-slate-400">Registered media investigations</p>
        </div>

        {/* Flagged Cases */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-mono">
            <span>Flagged Indicators</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400 font-mono">{flaggedCases}</p>
          <p className="text-[11px] text-slate-400">Requiring human corroboration</p>
        </div>

        {/* Clean Cases */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-mono">
            <span>No Major Flags</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">{cleanCases}</p>
          <p className="text-[11px] text-slate-400">Adhered to natural metrics</p>
        </div>

        {/* Average Indicator Score */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-mono">
            <span>Avg Risk Score</span>
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-cyan-300 font-mono">{avgScore} <span className="text-sm text-slate-500 font-normal">/100</span></p>
          <p className="text-[11px] text-slate-400">Mean suspicious indicator index</p>
        </div>

      </div>

      {/* Investigation Records Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Investigation Registry & Chain-of-Custody</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Showing {investigations.length} recorded cases
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            <p className="text-xs">Loading case records from database...</p>
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-semibold text-slate-300">No Investigations Recorded Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Commence an investigation in the Investigate tab to register evidence, generate reports, and track cases.
            </p>
            <button
              onClick={onNewInvestigation}
              className="mt-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
            >
              Start First Investigation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cyber-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case / Media</th>
                  <th className="py-3 px-4">Cryptographic Hash</th>
                  <th className="py-3 px-4">Assessment Category</th>
                  <th className="py-3 px-4 text-center">Indicator Score</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {investigations.map((inv) => {
                  const isSuspicious = inv.assessment.includes('Multiple suspicious');
                  const isModerate = inv.assessment.includes('Some indicators');

                  return (
                    <tr 
                      key={inv.id}
                      onClick={() => onOpenInvestigation(inv.id)}
                      className="hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-sans font-semibold text-white">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="truncate max-w-[200px]" title={inv.image_name}>{inv.image_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <code className="text-cyan-400/90 text-[11px]">
                          {inv.image_hash ? `${inv.image_hash.slice(0, 12)}...` : 'N/A'}
                        </code>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          isSuspicious 
                            ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' 
                            : isModerate
                            ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                            : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                        }`}>
                          {inv.assessment}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={isSuspicious ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-cyan-300'}>
                          {inv.indicator_score}
                        </span>
                        <span className="text-slate-500 text-[10px]"> /100</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenInvestigation(inv.id)}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition"
                            title="Inspect Scorecard"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleDownload(inv.id, e)}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-emerald-300 transition"
                            title="Download PDF Report"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleDelete(inv.id, e)}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
                            title="Delete Record"
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
