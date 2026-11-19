import React, { useState, useEffect } from 'react';
import { 
  PanelLeftClose, RefreshCw, LayoutDashboard, Search, FileText, 
  Image as ImageIcon, Video, Mic, ExternalLink, Download, Trash2, 
  ShieldAlert, ShieldCheck, AlertTriangle, Plus, ChevronRight, Filter
} from 'lucide-react';
import { InvestigationSummary } from '../types';
import { apiService } from '../services/api';

interface SlidingDashboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInvestigation: (id: string) => void;
  onNewInvestigation: () => void;
  onNavigateToFullDashboard: () => void;
}

export const SlidingDashboardDrawer: React.FC<SlidingDashboardDrawerProps> = ({
  isOpen,
  onClose,
  onOpenInvestigation,
  onNewInvestigation,
  onNavigateToFullDashboard
}) => {
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'text'>('all');

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const data = await apiService.getInvestigations();
      setInvestigations(data || []);
    } catch (err) {
      console.error('Failed to load investigations in drawer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInvestigations();
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this forensic case record?')) return;
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

  const detectModality = (name: string): 'image' | 'video' | 'audio' | 'text' => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio';
    if (['txt'].includes(ext)) return 'text';
    return 'image';
  };

  const filteredInvestigations = investigations.filter(inv => {
    // Search query filter
    const matchesSearch = 
      inv.image_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.assessment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.caption && inv.caption.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Modality filter
    if (selectedModalityFilter === 'all') return true;
    return detectModality(inv.image_name) === selectedModalityFilter;
  });

  // KPI Calculations
  const totalCases = investigations.length;
  const flaggedCases = investigations.filter(i => 
    i.assessment?.includes('Multiple suspicious') || i.assessment?.includes('Some indicators')
  ).length;
  const cleanCases = investigations.filter(i => 
    i.assessment?.includes('No significant')
  ).length;

  const getModalityIcon = (modality: 'image' | 'video' | 'audio' | 'text') => {
    switch (modality) {
      case 'video':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'audio':
        return <Mic className="w-4 h-4 text-amber-600" />;
      case 'text':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'image':
      default:
        return <ImageIcon className="w-4 h-4 text-blue-600" />;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score > 60) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          <span>{score} • Suspicious</span>
        </span>
      );
    }
    if (score > 25) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>{score} • Anomalies</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>{score} • Authentic</span>
      </span>
    );
  };

  return (
    <>
      {/* Translucent Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-full sm:w-[480px] md:w-[520px] bg-white border-r border-slate-200 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-label="Forensic Operations Sliding Dashboard"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Case Operations Dashboard</h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                  {totalCases} Cases
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Live evidence ledger & investigation registry</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={fetchInvestigations}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-xs"
              title="Refresh Registry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-xs"
              title="Close Sliding Dashboard"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-white border-b border-slate-200 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-medium text-slate-500 block uppercase">Total Audited</span>
            <span className="text-lg font-bold text-slate-900 font-mono">{totalCases}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-[10px] font-medium text-rose-600 block uppercase">Suspicious</span>
            <span className="text-lg font-bold text-rose-700 font-mono">{flaggedCases}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-medium text-emerald-600 block uppercase">Authentic</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">{cleanCases}</span>
          </div>
        </div>

        {/* Search & Modality Filters */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case by file name, SHA-256 or ID..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Modalities' },
              { id: 'image', label: 'Images' },
              { id: 'video', label: 'Videos' },
              { id: 'audio', label: 'Audio' },
              { id: 'text', label: 'Text' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedModalityFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedModalityFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Case List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && investigations.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading case records from registry...</p>
            </div>
          ) : filteredInvestigations.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">No matching investigation records</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {searchQuery ? 'Try adjusting your search query or modality filters.' : 'Run your first forensic examination to populate this dashboard.'}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNewInvestigation();
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start Investigation</span>
              </button>
            </div>
          ) : (
            filteredInvestigations.map((inv) => {
              const modality = detectModality(inv.image_name);
              return (
                <div
                  key={inv.id}
                  onClick={() => {
                    onOpenInvestigation(inv.id);
                    onClose();
                  }}
                  className="group p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition cursor-pointer space-y-2.5 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition flex-shrink-0 mt-0.5">
                        {getModalityIcon(modality)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition" title={inv.image_name}>
                          {inv.image_name}
                        </h4>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>ID: {inv.id.slice(0, 8)}</span>
                          <span>•</span>
                          <span>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {getScoreBadge(inv.indicator_score || 0)}
                    </div>
                  </div>

                  {inv.caption && (
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                      "{inv.caption}"
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      SHA: {inv.image_hash?.slice(0, 10)}...
                    </span>

                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDownload(inv.id, e)}
                        title="Download Forensic PDF Report"
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(inv.id, e)}
                        title="Delete Case Record"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onOpenInvestigation(inv.id);
                          onClose();
                        }}
                        className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-[10px] font-semibold flex items-center space-x-1 transition"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onNewInvestigation();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Investigation</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigateToFullDashboard();
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Full-Screen View</span>
          </button>
        </div>
      </aside>
    </>
  );
};
