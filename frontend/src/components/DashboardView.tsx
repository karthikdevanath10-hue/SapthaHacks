import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShieldAlert, ShieldCheck, AlertTriangle, FileText, 
  Download, Trash2, Eye, Plus, RefreshCw, Clock, ExternalLink,
  Image as ImageIcon, Video, Mic
} from 'lucide-react';
import { InvestigationSummary, FullAnalysisResponse, MediaModality } from '../types';
import { apiService } from '../services/api';

interface DashboardViewProps {
  onOpenInvestigation: (id: string) => void;
  onNewInvestigation: (modality?: MediaModality) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenInvestigation,
  onNewInvestigation
}) => {
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedModality, setSelectedModality] = useState<'all' | MediaModality>('all');

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

  const detectModality = (name: string): MediaModality => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio';
    if (['txt'].includes(ext)) return 'text';
    return 'image';
  };

  const filteredInvestigations = investigations.filter(inv => {
    if (selectedModality === 'all') return true;
    return detectModality(inv.image_name) === selectedModality;
  });

  // Metrics computation
  const totalCases = filteredInvestigations.length;
  const flaggedCases = filteredInvestigations.filter(i => 
    i.assessment.includes('Multiple suspicious') || i.assessment.includes('Some indicators')
  ).length;
  const cleanCases = filteredInvestigations.filter(i => 
    i.assessment.includes('No significant')
  ).length;
  const avgScore = totalCases > 0 
    ? Math.round(filteredInvestigations.reduce((acc, curr) => acc + (curr.indicator_score || 0), 0) / totalCases)
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <span>Forensic Operations Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Case history, evidentiary registry, and suspicious indicator metrics
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchHistory}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          <button
            onClick={() => onNewInvestigation(selectedModality === 'all' ? 'image' : selectedModality)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {/* Primary Modality Options (Matching User Specification) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-800">Forensic Modality Options:</span>
          <span className="text-[11px] text-slate-500 font-mono">({filteredInvestigations.length} matching)</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setSelectedModality('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              selectedModality === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            All Modalities
          </button>
          {[
            { id: 'image', label: 'Image Forensics', icon: <ImageIcon className="w-3.5 h-3.5" /> },
            { id: 'video', label: 'Video Deepfake', icon: <Video className="w-3.5 h-3.5" /> },
            { id: 'audio', label: 'Voice / Audio', icon: <Mic className="w-3.5 h-3.5" /> },
            { id: 'text', label: 'Text & Narrative', icon: <FileText className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedModality(tab.id as MediaModality)}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-2 transition cursor-pointer ${
                selectedModality === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Investigations */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-mono">
            <span>Total Cases</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">{totalCases}</p>
          <p className="text-[11px] text-slate-500">Registered media investigations</p>
        </div>

        {/* Flagged Cases */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-mono">
            <span>Flagged Indicators</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-3xl font-extrabold text-rose-600 font-mono">{flaggedCases}</p>
          <p className="text-[11px] text-slate-500">Requiring human corroboration</p>
        </div>

        {/* Clean Cases */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-mono">
            <span>No Major Flags</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 font-mono">{cleanCases}</p>
          <p className="text-[11px] text-slate-500">Adhered to natural metrics</p>
        </div>

        {/* Average Indicator Score */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-mono">
            <span>Avg Risk Score</span>
            <AlertTriangle className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-600 font-mono">{avgScore} <span className="text-sm text-slate-400 font-normal">/100</span></p>
          <p className="text-[11px] text-slate-500">Mean suspicious indicator index</p>
        </div>

      </div>

      {/* Investigation Records Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Investigation Registry & Chain-of-Custody</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Showing {investigations.length} recorded cases
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs">Loading case records from database...</p>
          </div>
        ) : investigations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-semibold text-slate-800">No Investigations Recorded Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Commence an investigation in the Investigate tab to register evidence, generate reports, and track cases.
            </p>
            <button
              onClick={() => onNewInvestigation()}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              Start First Investigation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case / Media</th>
                  <th className="py-3 px-4">Cryptographic Hash</th>
                  <th className="py-3 px-4">Assessment Category</th>
                  <th className="py-3 px-4 text-center">Indicator Score</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredInvestigations.map((inv) => {
                  const isSuspicious = inv.assessment.includes('Multiple suspicious');
                  const isModerate = inv.assessment.includes('Some indicators');

                  return (
                    <tr 
                      key={inv.id}
                      onClick={() => onOpenInvestigation(inv.id)}
                      className="hover:bg-slate-50 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span className="truncate max-w-[200px]" title={inv.image_name}>{inv.image_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        <code className="text-blue-600 text-[11px] font-semibold">
                          {inv.image_hash ? `${inv.image_hash.slice(0, 12)}...` : 'N/A'}
                        </code>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          isSuspicious 
                            ? 'bg-rose-50 border-rose-200 text-rose-700' 
                            : isModerate
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          {inv.assessment}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={isSuspicious ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'}>
                          {inv.indicator_score}
                        </span>
                        <span className="text-slate-400 text-[10px]"> /100</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenInvestigation(inv.id)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                            title="Inspect Scorecard"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleDownload(inv.id, e)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition cursor-pointer"
                            title="Download PDF Report"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleDelete(inv.id, e)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition cursor-pointer"
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
