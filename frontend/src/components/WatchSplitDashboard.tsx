import React, { useState, useEffect } from 'react';
import { 
  Camera, Image as ImageIcon, Video, Mic, FileText, ShieldCheck, 
  Database, Globe, BarChart3, Clock, Download, Trash2, RefreshCw, 
  Plus, Search, ChevronRight, X, ExternalLink, HardDrive, Cpu, 
  Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, FolderOpen,
  Wifi, Battery, Play, ArrowRight, Layers
} from 'lucide-react';
import { InvestigationSummary, MediaModality } from '../types';
import { apiService } from '../services/api';

export type WatchAppId = 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'text' 
  | 'audit_logs' 
  | 'data_storage' 
  | 'mcp_search' 
  | 'analytics';

interface WatchSplitDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenInvestigation: (id: string) => void;
  onNewInvestigation: (modality: MediaModality) => void;
  initialApp?: WatchAppId;
  isOverlay?: boolean;
}

export const WatchSplitDashboard: React.FC<WatchSplitDashboardProps> = ({
  isOpen = true,
  onClose,
  onOpenInvestigation,
  onNewInvestigation,
  initialApp = 'image',
  isOverlay = false
}) => {
  const [activeApp, setActiveApp] = useState<WatchAppId>(initialApp);
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Storage stats state
  const [storageStats, setStorageStats] = useState<{
    total_size_bytes: number;
    total_files_count: number;
    uploads_size_bytes: number;
    uploads_count: number;
    reports_size_bytes: number;
    reports_count: number;
    supabase_connected: boolean;
    files: Array<{
      filename: string;
      size_bytes: number;
      created_at: string;
      category: string;
      type: string;
    }>;
  } | null>(null);
  const [storageLoading, setStorageLoading] = useState<boolean>(false);

  // MCP search test state
  const [mcpQuery, setMcpQuery] = useState<string>('viral deepfake video politician statement');
  const [mcpTargetPlatform, setMcpTargetPlatform] = useState<string>('all');
  const [mcpLoading, setMcpLoading] = useState<boolean>(false);
  const [mcpResults, setMcpResults] = useState<any | null>(null);

  // Live watch clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const invs = await apiService.getInvestigations();
      setInvestigations(invs || []);
    } catch (e) {
      console.error('Failed to load investigations in watch dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadStorage = async () => {
    setStorageLoading(true);
    try {
      const stats = await apiService.getStorageStats();
      setStorageStats(stats);
    } catch (e) {
      console.error('Failed to load storage stats:', e);
    } finally {
      setStorageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadStorage();
  }, []);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const detectModality = (name: string): MediaModality => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio';
    if (['txt'].includes(ext)) return 'text';
    return 'image';
  };

  const counts = {
    all: investigations.length,
    image: investigations.filter(i => detectModality(i.image_name) === 'image').length,
    video: investigations.filter(i => detectModality(i.image_name) === 'video').length,
    audio: investigations.filter(i => detectModality(i.image_name) === 'audio').length,
    text: investigations.filter(i => detectModality(i.image_name) === 'text').length,
  };

  const handleDownload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(apiService.getReportDownloadUrl(id), '_blank');
  };

  const [isExportingAuditPdf, setIsExportingAuditPdf] = useState(false);

  const handleExportAuditLogs = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExportingAuditPdf(true);
    try {
      const blob = await apiService.exportAuditLogsPdf(
        investigations,
        'Lead Forensic Examiner'
      );
      const filename = `TruthLens_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`;
      apiService.downloadBlob(blob, filename);
    } catch (err) {
      console.error('Failed to export audit logs PDF:', err);
      window.open(apiService.getAuditLogsPdfUrl(), '_blank');
    } finally {
      setIsExportingAuditPdf(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this forensic case record?')) return;
    try {
      await apiService.deleteInvestigation(id);
      setInvestigations(prev => prev.filter(inv => inv.id !== id));
      loadStorage();
    } catch (err) {
      alert('Failed to delete investigation record.');
    }
  };

  const handleRunMcpSearch = async () => {
    if (!mcpQuery.trim()) return;
    setMcpLoading(true);
    try {
      const res = await apiService.searchMcpWebPresence(mcpQuery, mcpTargetPlatform);
      setMcpResults(res);
    } catch (err: any) {
      alert('MCP Search failed: ' + (err.message || 'Unknown error'));
    } finally {
      setMcpLoading(false);
    }
  };

  // Watch Apps Configuration matching user watch photo
  const watchApps = [
    {
      id: 'image' as WatchAppId,
      name: 'Image Forensics',
      badge: `${counts.image}`,
      icon: ImageIcon,
      bg: 'bg-blue-600',
      gradient: 'from-blue-600 to-sky-500',
      glow: 'shadow-blue-500/40',
      description: 'EXIF metadata, ELA 90% error level analysis, noise variance & Gemini visual physics'
    },
    {
      id: 'video' as WatchAppId,
      name: 'Video Deepfake',
      badge: `${counts.video}`,
      icon: Video,
      bg: 'bg-purple-600',
      gradient: 'from-purple-600 to-indigo-500',
      glow: 'shadow-purple-500/40',
      description: 'Temporal keyframe sampling, Haar facial boundary blur & optical motion jitter'
    },
    {
      id: 'audio' as WatchAppId,
      name: 'Voice / Audio',
      badge: `${counts.audio}`,
      icon: Mic,
      bg: 'bg-pink-600',
      gradient: 'from-pink-600 to-rose-500',
      glow: 'shadow-pink-500/40',
      description: 'Fast Fourier Transform (FFT) spectrum, synthetic prosody cadence & vocoder cutoffs'
    },
    {
      id: 'text' as WatchAppId,
      name: 'Text & Narrative',
      badge: `${counts.text}`,
      icon: FileText,
      bg: 'bg-amber-600',
      gradient: 'from-amber-600 to-orange-500',
      glow: 'shadow-amber-500/40',
      description: 'Type-Token Ratio (TTR), syntactic burstiness (σ) & LLM stylometric detection'
    },
    {
      id: 'audit_logs' as WatchAppId,
      name: 'Audit Logs',
      badge: `${counts.all} cases`,
      icon: ShieldCheck,
      bg: 'bg-emerald-600',
      gradient: 'from-emerald-600 to-teal-500',
      glow: 'shadow-emerald-500/40',
      description: 'ISO 27037 forensic chain-of-custody, SHA-256 evidence registry & PDF reports'
    },
    {
      id: 'data_storage' as WatchAppId,
      name: 'Data Storage',
      badge: storageStats ? `${(storageStats.total_size_bytes / (1024 * 1024)).toFixed(1)} MB` : 'Cloud & Local',
      icon: Database,
      bg: 'bg-cyan-600',
      gradient: 'from-cyan-600 to-blue-500',
      glow: 'shadow-cyan-500/40',
      description: 'Storage telemetry, uploads folder, generated forensic PDF archive & Supabase sync'
    },
    {
      id: 'mcp_search' as WatchAppId,
      name: 'Web & Social MCP',
      badge: 'Reverse Search',
      icon: Globe,
      bg: 'bg-indigo-600',
      gradient: 'from-indigo-600 to-violet-500',
      glow: 'shadow-indigo-500/40',
      description: 'Model Context Protocol tool runner: check Instagram, Twitter/X, Reddit & public web'
    },
    {
      id: 'analytics' as WatchAppId,
      name: 'Forensic Analytics',
      badge: 'Telemetry',
      icon: BarChart3,
      bg: 'bg-rose-600',
      gradient: 'from-rose-600 to-orange-500',
      glow: 'shadow-rose-500/40',
      description: 'Overall risk index, suspicious vs authentic ratios & platform diagnostics'
    }
  ];

  // Helper for filtered investigations on modality tabs
  const getModalityInvestigations = (mod: MediaModality) => {
    return investigations.filter(i => {
      const matchesMod = detectModality(i.image_name) === mod;
      if (!matchesMod) return false;
      if (!searchQuery) return true;
      return (
        i.image_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.assessment?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
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

  const containerContent = (
    <div className="bg-slate-100 rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col lg:flex-row h-full min-h-[640px] max-h-[88vh]">
      
      {/* ========================================================= */}
      {/* LEFT HALF: ANDROID SMARTWATCH MOVABLE APPS DOCK */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-slate-900 p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative select-none">
        
        {/* Watch Dial Bezel Container */}
        <div className="flex-1 flex flex-col">
          
          {/* Watch Status Bar */}
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono pb-3 border-b border-slate-800 mb-4 px-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white tracking-widest">{currentTime || '12:00'}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
              Forensic Watch OS
            </span>
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <Battery className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] text-white">99%</span>
            </div>
          </div>

          {/* Watch Instruction Callout */}
          <div className="px-2 pb-3">
            <p className="text-[11px] text-slate-400">
              Touch an app on the left dial to open its workspace on the right:
            </p>
          </div>

          {/* Movable Scrollable Watch Apps Wheel */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {watchApps.map((app) => {
              const IconComp = app.icon;
              const isActive = activeApp === app.id;

              return (
                <button
                  key={app.id}
                  onClick={() => setActiveApp(app.id)}
                  className={`w-full p-2.5 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer text-left group ${
                    isActive 
                      ? 'bg-slate-800 border-2 border-blue-500 shadow-lg shadow-blue-500/20 translate-x-1' 
                      : 'bg-slate-900/80 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    
                    {/* Circular Watch Icon Badge (Matching Watch User Photo) */}
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${app.gradient} flex items-center justify-center text-white shadow-md ${app.glow} group-hover:scale-105 transition-transform flex-shrink-0 ring-2 ring-white/10`}>
                      <IconComp className="w-5 h-5 text-white" />
                    </div>

                    {/* App Label & Badge */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                          {app.name}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        {app.badge}
                      </span>
                    </div>

                  </div>

                  {/* Active Indicator Arrow */}
                  <div className="flex items-center space-x-1 flex-shrink-0 pl-2">
                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-blue-400 translate-x-1' : 'text-slate-600 group-hover:text-slate-400'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Watch Bottom Bezel Bar */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-2 mt-2">
          <span>TruthLens Core v2.4</span>
          <div className="w-8 h-1 rounded-full bg-slate-700 mx-auto" />
          <span className="text-emerald-400 font-mono">Synced</span>
        </div>

      </div>


      {/* ========================================================= */}
      {/* RIGHT HALF: DYNAMIC WORKSPACE PAGE (OPENS ON TOUCH) */}
      {/* ========================================================= */}
      <div className="flex-1 bg-white p-5 lg:p-6 flex flex-col overflow-y-auto">
        
        {/* Workspace Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
              watchApps.find(a => a.id === activeApp)?.gradient || 'from-blue-600 to-sky-500'
            } flex items-center justify-center text-white shadow-sm`}>
              {React.createElement(watchApps.find(a => a.id === activeApp)?.icon || ImageIcon, { className: 'w-5 h-5' })}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {watchApps.find(a => a.id === activeApp)?.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                {watchApps.find(a => a.id === activeApp)?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                loadData();
                loadStorage();
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading || storageLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-rose-600 transition shadow-2xs cursor-pointer"
                title="Close Split Dashboard"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content Switching */}
        <div className="flex-1 pt-5">
          
          {/* ======================================================= */}
          {/* 1-4. MODALITY WORKSPACES (Image, Video, Audio, Text) */}
          {/* ======================================================= */}
          {['image', 'video', 'audio', 'text'].includes(activeApp) && (() => {
            const mod = activeApp as MediaModality;
            const modCases = getModalityInvestigations(mod);

            return (
              <div className="space-y-6">
                
                {/* Launch Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Ready to examine new {mod.toUpperCase()} media?
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {modCases.length} Registered Cases
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Upload suspect {mod} files to run mathematical signal tests, provenance checks, and Gemini AI reasoning.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (onClose) onClose();
                      onNewInvestigation(mod);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm shadow-blue-500/20 transition cursor-pointer flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Launch {mod.toUpperCase()} Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Modality Specific Registry */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {mod.toUpperCase()} Investigation Registry
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {modCases.length} cases found
                    </span>
                  </div>

                  {modCases.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">No {mod} investigations recorded yet</p>
                      <p className="text-[11px] text-slate-500">Click Launch above to test your first {mod} file.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {modCases.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (onClose) onClose();
                            onOpenInvestigation(item.id);
                          }}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition" title={item.image_name}>
                                {item.image_name}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ID: {item.id.slice(0, 8)} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                              </p>
                            </div>
                            {getScoreBadge(item.indicator_score || 0)}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[10px] font-mono text-slate-400">
                              SHA: {item.image_hash?.slice(0, 10)}...
                            </span>
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleDownload(item.id, e)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Download PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })()}

          {/* ======================================================= */}
          {/* 5. AUDIT LOGS WORKSPACE */}
          {/* ======================================================= */}
          {activeApp === 'audit_logs' && (
            <div className="space-y-4">
              
              {/* Search & Modality Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search audit trail by file name, SHA-256 or ID..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
                  />
                </div>

                <div className="flex items-center space-x-2.5 text-xs font-mono text-slate-500">
                  <span>Total Records: <strong className="text-slate-900">{investigations.length}</strong></span>
                  <button
                    type="button"
                    onClick={handleExportAuditLogs}
                    disabled={isExportingAuditPdf}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans font-semibold text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingAuditPdf ? 'Exporting...' : 'Export Audit Logs (PDF)'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Audit Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Media File</th>
                      <th className="py-3 px-4">Modality</th>
                      <th className="py-3 px-4">Cryptographic SHA-256</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {investigations
                      .filter(i => 
                        !searchQuery || 
                        i.image_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        i.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        i.image_hash?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((inv) => {
                        const mod = detectModality(inv.image_name);
                        return (
                          <tr 
                            key={inv.id}
                            onClick={() => {
                              if (onClose) onClose();
                              onOpenInvestigation(inv.id);
                            }}
                            className="hover:bg-slate-50 transition cursor-pointer group"
                          >
                            <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                              <span className="truncate max-w-[180px] block" title={inv.image_name}>{inv.image_name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                {mod}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              <code className="text-blue-600 text-[11px]">
                                {inv.image_hash?.slice(0, 12)}...
                              </code>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getScoreBadge(inv.indicator_score || 0)}
                            </td>
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={(e) => handleDownload(inv.id, e)}
                                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                  title="Download Report"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(inv.id, e)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ======================================================= */}
          {/* 6. DATA STORAGE WORKSPACE */}
          {/* ======================================================= */}
          {activeApp === 'data_storage' && (
            <div className="space-y-6">
              
              {/* Storage KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Total Disk Usage</span>
                  <p className="text-2xl font-bold text-slate-900 font-mono">
                    {storageStats ? (storageStats.total_size_bytes / (1024 * 1024)).toFixed(2) : '0.00'} <span className="text-xs font-normal text-slate-500">MB</span>
                  </p>
                  <p className="text-[11px] text-slate-500">{storageStats?.total_files_count || 0} stored assets</p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">Uploads Archive</span>
                  <p className="text-2xl font-bold text-blue-700 font-mono">
                    {storageStats ? (storageStats.uploads_size_bytes / (1024 * 1024)).toFixed(2) : '0.00'} <span className="text-xs font-normal text-blue-600">MB</span>
                  </p>
                  <p className="text-[11px] text-blue-600">{storageStats?.uploads_count || 0} media files</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">Cloud Sync</span>
                  <p className="text-base font-bold text-emerald-700 flex items-center space-x-1.5 pt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{storageStats?.supabase_connected ? 'Supabase Synced' : 'Local Fallback'}</span>
                  </p>
                  <p className="text-[11px] text-emerald-600">ISO 27037 compliance enabled</p>
                </div>
              </div>

              {/* Stored Files Registry */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recent Files in Forensic Storage
                  </h4>
                  <button
                    onClick={loadStorage}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 font-mono">
                    {storageStats?.files && storageStats.files.length > 0 ? (
                      storageStats.files.map((file, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-sans font-semibold text-slate-900 truncate block">{file.filename}</span>
                              <span className="text-[10px] text-slate-400">
                                {file.created_at ? new Date(file.created_at).toLocaleString() : 'Recent'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <span className="text-[11px] font-mono text-slate-500">
                              {(file.size_bytes / 1024).toFixed(1)} KB
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              {file.category}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 font-sans text-xs">
                        No files in storage directory.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================= */}
          {/* 7. WEB & SOCIAL MCP WORKSPACE */}
          {/* ======================================================= */}
          {activeApp === 'mcp_search' && (
            <div className="space-y-5">
              
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs text-indigo-900">
                    Model Context Protocol (MCP) Reverse Media Grounding
                  </span>
                </div>
                <p className="text-xs text-indigo-700">
                  Directly interrogates public web and social platforms (Instagram, Twitter/X, Reddit, TikTok) to discover whether suspect media or claims circulate online.
                </p>
              </div>

              {/* Query Runner */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700">
                  Search Query / Headline / Context
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mcpQuery}
                    onChange={(e) => setMcpQuery(e.target.value)}
                    placeholder="Enter image caption, claim, or viral phrase..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleRunMcpSearch}
                    disabled={mcpLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {mcpLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Run MCP Search</span>
                  </button>
                </div>
              </div>

              {/* MCP Results Box */}
              {mcpResults && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Provenance Verdict: {mcpResults.provenance_verdict}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {mcpResults.matches?.length || 0} Matches
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    "{mcpResults.summary}"
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    {mcpResults.matches?.map((m: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-blue-600">{m.platform}</strong>
                          <span className="text-[10px] font-mono text-slate-400">{m.first_seen_date || 'Unknown Date'}</span>
                        </div>
                        <p className="text-slate-700">{m.title}</p>
                        <a href={m.url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 hover:underline truncate block">
                          {m.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================= */}
          {/* 8. KPI ANALYTICS WORKSPACE */}
          {/* ======================================================= */}
          {activeApp === 'analytics' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Total Cases</span>
                  <p className="text-2xl font-bold text-slate-900 font-mono">{investigations.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-rose-600">Suspicious</span>
                  <p className="text-2xl font-bold text-rose-700 font-mono">
                    {investigations.filter(i => i.assessment.includes('Multiple suspicious') || i.assessment.includes('Some indicators')).length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-emerald-600">Authentic</span>
                  <p className="text-2xl font-bold text-emerald-700 font-mono">
                    {investigations.filter(i => i.assessment.includes('No significant')).length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-blue-600">Modality Diversity</span>
                  <p className="text-2xl font-bold text-blue-700 font-mono">4 / 4</p>
                </div>
              </div>

              {/* Modality Ratio Breakdown */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Modality Distribution Breakdown
                </h4>

                <div className="space-y-3">
                  {[
                    { label: 'Image Forensics', count: counts.image, color: 'bg-blue-600' },
                    { label: 'Video Deepfake', count: counts.video, color: 'bg-purple-600' },
                    { label: 'Voice / Audio', count: counts.audio, color: 'bg-pink-600' },
                    { label: 'Text & Narrative', count: counts.text, color: 'bg-amber-600' },
                  ].map((m, idx) => {
                    const pct = investigations.length > 0 ? Math.round((m.count / investigations.length) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">{m.label}</span>
                          <span className="font-mono text-slate-500">{m.count} cases ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${m.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );

  // If rendered as full overlay modal
  if (isOverlay) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md transition-opacity">
        <div className="w-full max-w-6xl h-[90vh]">
          {containerContent}
        </div>
      </div>
    );
  }

  // If rendered as embedded view
  return containerContent;
};
