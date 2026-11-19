import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Image as ImageIcon, Video, Mic, FileText, ShieldCheck, 
  Database, Globe, BarChart3, Search, User, Download, Trash2, 
  RefreshCw, Plus, ArrowRight, CheckCircle2, AlertTriangle, 
  ShieldAlert, Sparkles, FolderOpen, ChevronRight, Layers,
  UploadCloud, Play, Square, Radio, ExternalLink, Zap
} from 'lucide-react';
import { InvestigationSummary, FullAnalysisResponse, MediaModality, UserProfile } from '../types';
import { apiService } from '../services/api';

export type ExplorerOptionId = 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'text' 
  | 'audit' 
  | 'storage' 
  | 'mcp' 
  | 'analytics';

interface PageExplorerLayoutProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenInvestigation: (id: string) => void;
  onInspectResult: (result: FullAnalysisResponse) => void;
  apiStatus: { healthy: boolean; supabase: boolean; gemini: boolean };
}

export const PageExplorerLayout: React.FC<PageExplorerLayoutProps> = ({
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenInvestigation,
  onInspectResult,
  apiStatus
}) => {
  const [activeOption, setActiveOption] = useState<ExplorerOptionId>('image');
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileView, setMobileView] = useState<'dial' | 'workspace'>('dial');

  // Modality file upload / analysis states for the right pane
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [directText, setDirectText] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [sourceContext, setSourceContext] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Audio live recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage stats
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

  // MCP search test state
  const [mcpQuery, setMcpQuery] = useState<string>('viral deepfake video politician statement');
  const [mcpTargetPlatform, setMcpTargetPlatform] = useState<string>('all');
  const [mcpLoading, setMcpLoading] = useState<boolean>(false);
  const [mcpResults, setMcpResults] = useState<any | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await apiService.getInvestigations();
      setInvestigations(data || []);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorage = async () => {
    try {
      const stats = await apiService.getStorageStats();
      setStorageStats(stats);
    } catch (e) {
      console.error('Failed to fetch storage stats:', e);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchStorage();
  }, []);

  const detectModality = (name: string): MediaModality => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio';
    if (['txt'].includes(ext)) return 'text';
    return 'image';
  };

  const counts = {
    image: investigations.filter(i => detectModality(i.image_name) === 'image').length,
    video: investigations.filter(i => detectModality(i.image_name) === 'video').length,
    audio: investigations.filter(i => detectModality(i.image_name) === 'audio').length,
    text: investigations.filter(i => detectModality(i.image_name) === 'text').length,
    all: investigations.length
  };

  const handleOptionChange = (id: ExplorerOptionId) => {
    setActiveOption(id);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDirectText('');
    setCaption('');
    setSourceContext('');
    setAnalysisError(null);
    if (isRecording) {
      stopRecording();
    }
    setMobileView('workspace');
  };

  const handleFileChange = (file: File) => {
    setAnalysisError(null);
    if (file.size > 50 * 1024 * 1024) {
      setAnalysisError('File exceeds 50MB maximum size limit.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const startRecording = async () => {
    try {
      setAnalysisError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const ext = mimeType.includes('webm') ? 'webm' : 'wav';
        const file = new File([audioBlob], `recorded_speech_${Date.now()}.${ext}`, { type: audioBlob.type });
        handleFileChange(file);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      setAnalysisError('Microphone access denied: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRunAnalysis = async (mod: MediaModality) => {
    if (!selectedFile && !directText.trim()) {
      setAnalysisError('Please upload a media file or provide text before commencing examination.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await apiService.analyzeMedia({
        file: selectedFile,
        textContent: directText,
        caption,
        sourceContext,
        userId: currentUser?.id,
        modality: mod
      });
      fetchHistory();
      fetchStorage();
      onInspectResult(res);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Forensic examination failed';
      setAnalysisError(detail);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(apiService.getReportDownloadUrl(id), '_blank');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this forensic case permanently?')) return;
    try {
      await apiService.deleteInvestigation(id);
      setInvestigations(prev => prev.filter(inv => inv.id !== id));
      fetchStorage();
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
      alert('MCP Reverse lookup failed: ' + err.message);
    } finally {
      setMcpLoading(false);
    }
  };

  // 6 Primary Circular Menu Items matching the user screenshot layout
  const arcMenuItems = [
    { id: 'image' as ExplorerOptionId, label: 'Image', fullName: 'Image Forensics', icon: ImageIcon, badge: counts.image },
    { id: 'video' as ExplorerOptionId, label: 'Video', fullName: 'Video Deepfake', icon: Video, badge: counts.video },
    { id: 'audio' as ExplorerOptionId, label: 'Audio', fullName: 'Voice / Audio', icon: Mic, badge: counts.audio },
    { id: 'text' as ExplorerOptionId, label: 'Text', fullName: 'Text & Narrative', icon: FileText, badge: counts.text },
    { id: 'audit' as ExplorerOptionId, label: 'Audit Logs', fullName: 'Audit Logs & Ledger', icon: ShieldCheck, badge: counts.all },
    { id: 'storage' as ExplorerOptionId, label: 'Storage', fullName: 'Data Storage Vault', icon: Database, badge: storageStats ? `${(storageStats.total_size_bytes / (1024 * 1024)).toFixed(1)}MB` : 'Sync' },
  ];

  // Secondary Options
  const secondaryMenuItems = [
    { id: 'mcp' as ExplorerOptionId, label: 'MCP Search', fullName: 'Web & Social Grounding', icon: Globe },
    { id: 'analytics' as ExplorerOptionId, label: 'Analytics', fullName: 'Forensic KPI Analytics', icon: BarChart3 },
  ];

  const getScoreBadge = (score: number) => {
    if (score > 60) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span>{score} • Suspicious</span>
        </span>
      );
    }
    if (score > 25) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>{score} • Anomalies</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span>{score} • Authentic</span>
      </span>
    );
  };

  return (
    <div className="h-screen max-h-screen h-[100dvh] bg-[#070314] text-white relative overflow-hidden font-sans select-none flex flex-col lg:flex-row items-stretch">
      
      {/* Ambient Neon Glow Gradients */}
      <div className="absolute top-0 left-0 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* ======================================================== */}
      {/* LEFT COLUMN: FULL HEIGHT SEMI-CIRCULAR GLOWING ARC DIAL */}
      {/* FLUSH TO TOP END, LOWER END, AND LEFT SCREEN EDGE */}
      {/* ======================================================== */}
      <div className={`${mobileView === 'workspace' ? 'hidden lg:flex' : 'flex'} w-full lg:w-[380px] xl:w-[420px] h-full flex-shrink-0 flex-col justify-between relative z-20 select-none pl-6 sm:pl-8 pr-6 sm:pr-8 pt-5 sm:pt-6 pb-5 sm:pb-6 rounded-l-none rounded-t-none rounded-b-none rounded-r-[220px] sm:rounded-r-[280px] lg:rounded-r-[320px] bg-slate-950/85 border-y-0 border-l-0 border-r-2 border-r-purple-400/90 shadow-[0_0_50px_rgba(168,85,247,0.35)] backdrop-blur-2xl`}>
        
        {/* Glowing Neon Dot on the Arc Perimeter Apex */}
        <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_16px_#c084fc] ring-4 ring-purple-500/50 animate-pulse" />

        {/* 1. TOP BRAND LOGO (Flush to top end of screen) */}
        <div className="flex items-center space-x-3.5 border-b border-purple-500/20 pb-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/40 ring-1 ring-purple-400/30 flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">
              Truth<span className="text-purple-400">Lens</span>
            </span>
            <p className="text-[11px] text-purple-300/70">
              Multimodal AI Forensics
            </p>
          </div>
        </div>

        {/* 2. MIDDLE CAPABILITY SELECTOR (Vertically Centered) */}
        <div className="my-auto py-3 space-y-4">
          
          {/* Dial Header */}
          <div className="border-b border-purple-500/20 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Select Capability
            </span>
          </div>

          {/* 2-Column Curved Grid of Circular Glowing Buttons (Matches Screenshot!) */}
          <div className="grid grid-cols-2 gap-y-5 sm:gap-y-6 gap-x-4 place-items-center py-1">
                {arcMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeOption === item.id;

                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleOptionChange(item.id)}
                      className="flex flex-col items-center group cursor-pointer transition-all duration-300"
                    >
                      {/* Circular Button */}
                      <div className={`relative transition-all duration-300 flex items-center justify-center rounded-full cursor-pointer ${
                        isActive
                          ? 'w-16 h-16 sm:w-18 sm:h-18 bg-purple-900/60 border-2 border-purple-300 text-white ring-4 ring-purple-500/50 shadow-[0_0_32px_rgba(192,132,252,0.8)] scale-105'
                          : 'w-14 h-14 sm:w-16 sm:h-16 bg-slate-900/70 border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 hover:bg-purple-900/40 hover:scale-105 shadow-md'
                      }`}>
                        <IconComponent className={`transition-transform duration-300 ${
                          isActive ? 'w-7 h-7 scale-110 text-white' : 'w-6 h-6 text-purple-300 group-hover:scale-110'
                        }`} />

                        {/* Subtle Badge Count */}
                        {item.badge !== undefined && (
                          <span className={`absolute -top-1 -right-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border shadow-xs ${
                            isActive
                              ? 'bg-purple-500 text-white border-purple-300'
                              : 'bg-slate-800 text-purple-300 border-purple-500/40'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Label Underneath */}
                      <span className={`text-xs mt-2 font-medium tracking-wide transition-colors ${
                        isActive 
                          ? 'font-bold text-white drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]' 
                          : 'text-purple-300/80 group-hover:text-purple-200'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

          {/* Secondary Options Pills (MCP Search & Analytics) */}
          <div className="pt-2 border-t border-purple-500/20 flex items-center justify-center gap-2">
            {secondaryMenuItems.map(sec => {
              const SecIcon = sec.icon;
              const isSecActive = activeOption === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleOptionChange(sec.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center space-x-1.5 transition cursor-pointer border ${
                    isSecActive 
                      ? 'bg-purple-600/80 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                      : 'bg-slate-900/50 text-purple-300/70 border-purple-500/30 hover:border-purple-400 hover:text-white'
                  }`}
                >
                  <SecIcon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

        </div>


      </div>


      {/* ======================================================== */}
      {/* RIGHT COLUMN: SEARCH HEADER + EXPANDED WORKSPACE GLASS PANEL */}
      {/* ======================================================== */}
      <div className={`${mobileView === 'dial' ? 'hidden lg:flex' : 'flex'} flex-1 h-full min-h-0 flex-col p-4 sm:p-6 lg:p-7 pr-4 sm:pr-8 gap-3.5 overflow-hidden relative z-10`}>
        
        {/* Top Control Bar: Search Bar + Mobile Back Button + User Profile Avatar */}
        <div className="flex items-center justify-between flex-shrink-0 gap-3">
          
          <div className="flex items-center space-x-2 flex-1 max-w-lg">
            {/* Mobile Back to Dial Button */}
            <button
              onClick={() => setMobileView('dial')}
              className="lg:hidden px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center space-x-1 hover:text-white transition cursor-pointer shadow-md"
            >
              <span>← Dial</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search forensic registry..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-purple-500/30 rounded-full text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser ? (
              <button 
                onClick={onSignOut}
                title="Sign Out"
                className="w-9 h-9 rounded-full bg-purple-900/40 border border-purple-500/50 flex items-center justify-center text-purple-300 hover:text-white hover:border-purple-400 transition cursor-pointer shadow-md"
              >
                <User className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-full bg-purple-600/80 hover:bg-purple-600 border border-purple-400/40 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Glass Workspace Panel */}
        <div className="flex-1 bg-slate-950/50 border border-purple-500/30 rounded-3xl shadow-[0_0_40px_rgba(147,51,234,0.18)] backdrop-blur-2xl p-5 lg:p-7 flex flex-col justify-between relative overflow-hidden min-h-0">
          
          {/* Subtle Ambient Scenic Background (Matching image) */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-slate-950/30 to-indigo-950/20 pointer-events-none" />

          {/* Workspace Content */}
          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            
            {/* Header of Active Page */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-purple-500/20 gap-3 flex-shrink-0">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs uppercase font-mono font-bold text-purple-400 tracking-wider">
                    TruthLens Interactive Workspace
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
                    ACTIVE
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  {arcMenuItems.find(i => i.id === activeOption)?.fullName ||
                   secondaryMenuItems.find(i => i.id === activeOption)?.fullName}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    fetchHistory();
                    fetchStorage();
                  }}
                  className="p-2 rounded-xl border border-purple-500/30 bg-slate-900/60 hover:bg-purple-900/40 text-purple-300 hover:text-white transition shadow-sm cursor-pointer"
                  title="Refresh Workspace"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* DYNAMIC CONTENT AREA - ONLY THIS SCROLLS! */}
            <div className="flex-1 pt-4 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              
              {/* =================================================== */}
              {/* 1. IMAGE FORENSICS WORKSPACE */}
              {/* =================================================== */}
              {activeOption === 'image' && (
                <div className="space-y-6">
                  
                  {/* Uploader Card */}
                  <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center space-x-2">
                          <ImageIcon className="w-5 h-5 text-purple-400" />
                          <span>Suspect Image Examination</span>
                        </h3>
                        <p className="text-xs text-purple-300/80 mt-1">
                          Evaluates Error Level Analysis (ELA 90%), spatial noise variance, EXIF header provenance, and Gemini multimodal vision.
                        </p>
                      </div>

                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.tiff,.jfif,.jfi,.bmp"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      />

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition cursor-pointer flex-shrink-0"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Select Image File</span>
                      </button>
                    </div>

                    {selectedFile && (
                      <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="font-semibold text-white">{selectedFile.name}</span>
                          <span className="text-purple-300 font-mono">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="text-purple-400 hover:text-rose-400 transition"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {previewUrl && (
                      <div className="relative rounded-xl overflow-hidden max-h-48 bg-black/40 border border-purple-500/20 flex items-center justify-center">
                        <img src={previewUrl} alt="Preview" className="max-h-48 object-contain" />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-purple-200">
                        Context Caption or Claim (Optional):
                      </label>
                      <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="e.g. 'Viral photo claiming leaked secret meeting in Washington'..."
                        className="w-full px-3.5 py-2 bg-slate-900/80 border border-purple-500/30 rounded-xl text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    {analysisError && (
                      <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                        {analysisError}
                      </div>
                    )}

                    <button
                      onClick={() => handleRunAnalysis('image')}
                      disabled={isAnalyzing || !selectedFile}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/40 transition cursor-pointer disabled:opacity-40"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Executing Image Forensic Pipeline...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-yellow-300" />
                          <span>Commence Forensic Examination</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Registered Image Cases */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Recent Image Investigations ({counts.image})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {investigations.filter(i => detectModality(i.image_name) === 'image').slice(0, 4).map(item => (
                        <div
                          key={item.id}
                          onClick={() => onOpenInvestigation(item.id)}
                          className="p-3.5 rounded-xl border border-purple-500/20 bg-slate-900/50 hover:border-purple-400 hover:bg-slate-900/80 transition cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition" title={item.image_name}>
                                {item.image_name}
                              </h5>
                              <p className="text-[10px] text-purple-400/60 font-mono mt-0.5">
                                ID: {item.id.slice(0, 8)} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                              </p>
                            </div>
                            {getScoreBadge(item.indicator_score || 0)}
                          </div>
                          <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-xs">
                            <span className="text-[10px] font-mono text-purple-400/60">
                              SHA: {item.image_hash?.slice(0, 10)}...
                            </span>
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleDownload(item.id, e)}
                                className="p-1 rounded text-purple-400 hover:text-white transition"
                                title="Download PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-1 rounded text-purple-400 hover:text-rose-400 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* =================================================== */}
              {/* 2. VIDEO DEEPFAKE WORKSPACE */}
              {/* =================================================== */}
              {activeOption === 'video' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center space-x-2">
                          <Video className="w-5 h-5 text-purple-400" />
                          <span>Video Deepfake Inspection</span>
                        </h3>
                        <p className="text-xs text-purple-300/80 mt-1">
                          Temporal keyframe sampling, Haar facial perimeter boundary gradients, optical motion jitter, and Gemini video reasoning.
                        </p>
                      </div>

                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,.mp4,.mov,.webm,.avi"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      />

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition cursor-pointer flex-shrink-0"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Select Video File</span>
                      </button>
                    </div>

                    {selectedFile && (
                      <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate max-w-sm">{selectedFile.name}</span>
                        <span className="text-purple-300 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-purple-200">
                        Context Claim / Social Caption:
                      </label>
                      <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="e.g. 'Viral video showing leaked press conference speech'..."
                        className="w-full px-3.5 py-2 bg-slate-900/80 border border-purple-500/30 rounded-xl text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <button
                      onClick={() => handleRunAnalysis('video')}
                      disabled={isAnalyzing || !selectedFile}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/40 transition cursor-pointer disabled:opacity-40"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Extracting Keyframes & Analyzing Motion Flow...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-yellow-300" />
                          <span>Commence Video Deepfake Examination</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Registered Video Cases */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Recent Video Cases ({counts.video})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {investigations.filter(i => detectModality(i.image_name) === 'video').slice(0, 4).map(item => (
                        <div
                          key={item.id}
                          onClick={() => onOpenInvestigation(item.id)}
                          className="p-3.5 rounded-xl border border-purple-500/20 bg-slate-900/50 hover:border-purple-400 transition cursor-pointer space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-bold text-white truncate" title={item.image_name}>{item.image_name}</h5>
                            {getScoreBadge(item.indicator_score || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* 3. VOICE / AUDIO WORKSPACE */}
              {/* =================================================== */}
              {activeOption === 'audio' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center space-x-2">
                          <Mic className="w-5 h-5 text-purple-400" />
                          <span>Voice & Acoustic Speech Forensics</span>
                        </h3>
                        <p className="text-xs text-purple-300/80 mt-1">
                          Fast Fourier Transform (FFT) spectral cutoff, prosody cadence, unnatural silence ratios, and synthetic voice clone timbres.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {isRecording ? (
                          <button
                            onClick={stopRecording}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-600/30 animate-pulse transition cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5 fill-white" />
                            <span>Stop Recording</span>
                          </button>
                        ) : (
                          <button
                            onClick={startRecording}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 transition cursor-pointer"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>Live Mic Record</span>
                          </button>
                        )}
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl border border-purple-500/40 bg-slate-900/60 hover:bg-purple-900/40 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Browse Audio
                        </button>
                      </div>
                    </div>

                    {selectedFile && (
                      <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{selectedFile.name}</span>
                        <span className="text-purple-300 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleRunAnalysis('audio')}
                      disabled={isAnalyzing || !selectedFile}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/40 transition cursor-pointer disabled:opacity-40"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Computing FFT & Acoustic Spectrogram...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-yellow-300" />
                          <span>Commence Audio Forensic Examination</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* 4. TEXT & NARRATIVE WORKSPACE */}
              {/* =================================================== */}
              {activeOption === 'text' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <span>Text Stylometry & LLM Disinformation Analysis</span>
                    </h3>
                    <p className="text-xs text-purple-300/80">
                      Calculates Type-Token Ratio (TTR), syntactic burstiness (σ), Large Language Model idiom markers, and factual consistency.
                    </p>

                    <textarea
                      rows={6}
                      value={directText}
                      onChange={(e) => setDirectText(e.target.value)}
                      placeholder="Paste suspect statement, news claim, press release, or speech transcript here..."
                      className="w-full p-4 bg-slate-900/80 border border-purple-500/30 rounded-xl text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-purple-400 resize-y"
                    />

                    <button
                      onClick={() => handleRunAnalysis('text')}
                      disabled={isAnalyzing || !directText.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/40 transition cursor-pointer disabled:opacity-40"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Analyzing Lexical Diversity & Burstiness...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-yellow-300" />
                          <span>Commence Text Stylometric Examination</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* 5. AUDIT LOGS WORKSPACE */}
              {/* =================================================== */}
              {activeOption === 'audit' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Forensic Audit Trail & Chain of Custody</h3>
                      <p className="text-xs text-purple-300/80">ISO 27037 digital evidence custody registry with SHA-256 validation.</p>
                    </div>
                    <span className="text-xs font-mono text-purple-400">
                      {investigations.length} Cases Recorded
                    </span>
                  </div>

                  <div className="border border-purple-500/30 rounded-2xl overflow-hidden bg-slate-950/60 shadow-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-purple-950/40 border-b border-purple-500/20 text-purple-300 uppercase font-mono text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Case Media</th>
                          <th className="py-3 px-4">Modality</th>
                          <th className="py-3 px-4">SHA-256 Hash</th>
                          <th className="py-3 px-4 text-center">Risk Score</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/10 font-mono">
                        {investigations
                          .filter(i => !searchQuery || i.image_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((inv) => (
                            <tr
                              key={inv.id}
                              onClick={() => onOpenInvestigation(inv.id)}
                              className="hover:bg-purple-900/20 transition cursor-pointer"
                            >
                              <td className="py-3 px-4 font-sans font-semibold text-white truncate max-w-[180px]">
                                {inv.image_name}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                                  {detectModality(inv.image_name)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-purple-400/80">
                                {inv.image_hash?.slice(0, 12)}...
                              </td>
                              <td className="py-3 px-4 text-center">
                                {getScoreBadge(inv.indicator_score || 0)}
                              </td>
                              <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={(e) => handleDownload(inv.id, e)}
                                    className="p-1 rounded text-purple-400 hover:text-white transition"
                                    title="Download PDF"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(inv.id, e)}
                                    className="p-1 rounded text-purple-400 hover:text-rose-400 transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* 6. DATA STORAGE WORKSPACE */}
              {/* =================================================== */}
              {activeOption === 'storage' && (
                <div className="space-y-6">
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-purple-400">Total Storage</span>
                      <p className="text-2xl font-bold text-white font-mono">
                        {storageStats ? (storageStats.total_size_bytes / (1024 * 1024)).toFixed(2) : '0.00'} <span className="text-xs font-normal text-purple-300">MB</span>
                      </p>
                      <p className="text-[11px] text-purple-300/70">{storageStats?.total_files_count || 0} media & report assets</p>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-purple-400">Uploads Repository</span>
                      <p className="text-2xl font-bold text-white font-mono">
                        {storageStats ? (storageStats.uploads_size_bytes / (1024 * 1024)).toFixed(2) : '0.00'} <span className="text-xs font-normal text-purple-300">MB</span>
                      </p>
                      <p className="text-[11px] text-purple-300/70">{storageStats?.uploads_count || 0} original files</p>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-purple-400">Cloud Sync Status</span>
                      <p className="text-base font-bold text-emerald-400 flex items-center space-x-1.5 pt-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{storageStats?.supabase_connected ? 'Supabase Synced' : 'Local Fallback'}</span>
                      </p>
                      <p className="text-[11px] text-purple-300/70">ISO 27037 compliance enabled</p>
                    </div>
                  </div>

                  {/* Stored Files Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                        Files in Forensic Storage Vault
                      </h4>
                      <button
                        onClick={fetchStorage}
                        className="text-xs font-semibold text-purple-400 hover:text-white transition flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh Vault</span>
                      </button>
                    </div>

                    <div className="border border-purple-500/30 rounded-xl overflow-hidden text-xs max-h-64 overflow-y-auto divide-y divide-purple-500/10 font-mono bg-slate-950/60">
                      {storageStats?.files && storageStats.files.length > 0 ? (
                        storageStats.files.map((file, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between hover:bg-purple-900/20 transition">
                            <div className="flex items-center space-x-2.5 truncate">
                              <FolderOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <span className="font-sans text-white truncate">{file.filename}</span>
                            </div>
                            <div className="flex items-center space-x-3 flex-shrink-0">
                              <span className="text-purple-300">{(file.size_bytes / 1024).toFixed(1)} KB</span>
                              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                                {file.category}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-purple-400 font-sans text-xs">
                          No files stored yet.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* =================================================== */}
              {/* 7. WEB & SOCIAL MCP WORKSPACE */}
              {/* =================================================== */}
              {activeOption === 'mcp' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-xs text-white">
                        Model Context Protocol (MCP) Reverse Web Grounding
                      </span>
                    </div>
                    <p className="text-xs text-purple-300/80">
                      Searches whether media files, viral claims, or captions have prior public footprint on Instagram, Twitter/X, Reddit, or TikTok.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-purple-200">
                      Search Query / Headline:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mcpQuery}
                        onChange={(e) => setMcpQuery(e.target.value)}
                        placeholder="Enter claim or image context..."
                        className="flex-1 px-3.5 py-2 bg-slate-900/80 border border-purple-500/30 rounded-xl text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-purple-400"
                      />
                      <button
                        onClick={handleRunMcpSearch}
                        disabled={mcpLoading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
                      >
                        {mcpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>Execute Search</span>
                      </button>
                    </div>
                  </div>

                  {mcpResults && (
                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                      <span className="text-xs font-bold text-emerald-300">
                        Verdict: {mcpResults.provenance_verdict}
                      </span>
                      <p className="text-xs text-purple-200 italic">"{mcpResults.summary}"</p>
                      <div className="space-y-2 pt-2 border-t border-purple-500/20">
                        {mcpResults.matches?.map((m: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-purple-500/20 text-xs space-y-1">
                            <span className="font-bold text-purple-300">{m.platform}</span>
                            <p className="text-white">{m.title}</p>
                            <a href={m.url} target="_blank" rel="noreferrer" className="text-[11px] text-purple-400 hover:underline truncate block">
                              {m.url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================== */}
              {/* 8. ANALYTICS WORKSPACE */}
              {/* =================================================== */}
              {activeOption === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-purple-400">Total Cases</span>
                      <p className="text-2xl font-bold text-white font-mono">{investigations.length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/30 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-rose-300">Suspicious</span>
                      <p className="text-2xl font-bold text-rose-300 font-mono">
                        {investigations.filter(i => i.assessment.includes('Multiple suspicious') || i.assessment.includes('Some indicators')).length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-emerald-300">Authentic</span>
                      <p className="text-2xl font-bold text-emerald-300 font-mono">
                        {investigations.filter(i => i.assessment.includes('No significant')).length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-purple-400">Modalities</span>
                      <p className="text-2xl font-bold text-white font-mono">4 / 4</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Modality Distribution
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Image Forensics', count: counts.image, color: 'bg-purple-500' },
                        { label: 'Video Deepfake', count: counts.video, color: 'bg-indigo-500' },
                        { label: 'Voice / Audio', count: counts.audio, color: 'bg-pink-500' },
                        { label: 'Text & Narrative', count: counts.text, color: 'bg-amber-500' },
                      ].map((m, idx) => {
                        const pct = investigations.length > 0 ? Math.round((m.count / investigations.length) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between text-purple-200">
                              <span>{m.label}</span>
                              <span className="font-mono text-purple-400">{m.count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                              <div className={`h-full ${m.color}`} style={{ width: `${pct}%` }} />
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

      </div>

    </div>
  );
};
