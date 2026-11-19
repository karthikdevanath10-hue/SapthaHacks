import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, Image as ImageIcon, Video, Mic, FileText, ShieldCheck,
  Database, Globe, BarChart3, Search, User, Download, Trash2,
  RefreshCw, Plus, ArrowRight, CheckCircle2, AlertTriangle,
  ShieldAlert, Sparkles, FolderOpen, ChevronRight, Layers,
  UploadCloud, Play, Square, Radio, ExternalLink, Zap, X, Circle,
  Maximize2, Minimize2
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
  onInspectResult: (result: FullAnalysisResponse, previewUrl?: string) => void;
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
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isDialCollapsed, setIsDialCollapsed] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Camera live capture states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isFloatingCameraPiP, setIsFloatingCameraPiP] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Video live capture & recording states
  const [isVideoRecordingActive, setIsVideoRecordingActive] = useState<boolean>(false);
  const [isFloatingVideoPiP, setIsFloatingVideoPiP] = useState<boolean>(false);
  const [isVideoRecording, setIsVideoRecording] = useState<boolean>(false);
  const [videoRecordingSeconds, setVideoRecordingSeconds] = useState<number>(0);
  const [videoCameraError, setVideoCameraError] = useState<string | null>(null);
  const [videoCameraStream, setVideoCameraStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const videoMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<any>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const detectModality = (name: string): MediaModality => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio';
    if (['txt'].includes(ext)) return 'text';
    return 'image';
  };

  const searchResults = searchQuery.trim()
    ? investigations.filter(inv => {
      const q = searchQuery.toLowerCase().trim();
      const name = (inv.image_name || '').toLowerCase();
      const id = (inv.id || '').toLowerCase();
      const hash = (inv.image_hash || '').toLowerCase();
      const caption = (inv.caption || '').toLowerCase();
      const modality = detectModality(inv.image_name);
      const assessment = (inv.assessment || '').toLowerCase();
      return (
        name.includes(q) ||
        id.includes(q) ||
        hash.includes(q) ||
        caption.includes(q) ||
        modality.includes(q) ||
        assessment.includes(q)
      );
    })
    : [];

  const matchingStorageFiles = (searchQuery.trim() && storageStats?.files)
    ? storageStats.files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : [];

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

  // Live Camera Lifecycle & Stream Handlers
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.warn('Camera video play error:', e));
    }
  }, [isCameraActive, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Could not access optical sensor. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureLiveImage = (autoTest: boolean = false) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally to mirror user perspective naturally
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `live_capture_${timestamp}.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });

      // Stop camera hardware stream
      stopCamera();

      // Update state
      setSelectedFile(file);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      if (autoTest) {
        handleRunAnalysis('image', file);
      }
    }, 'image/jpeg', 0.95);
  };

  // Live Video Recorder Lifecycle & Stream Handlers
  useEffect(() => {
    if (isVideoRecordingActive && videoCameraStream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = videoCameraStream;
      videoPreviewRef.current.play().catch(e => console.warn('Video preview play error:', e));
    }
  }, [isVideoRecordingActive, videoCameraStream]);

  useEffect(() => {
    return () => {
      if (videoCameraStream) {
        videoCameraStream.getTracks().forEach(t => t.stop());
      }
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
      }
    };
  }, [videoCameraStream]);

  const startVideoCamera = async () => {
    setVideoCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera/Video capture is not supported by this browser.');
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (audioErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      }
      setVideoCameraStream(stream);
      setIsVideoRecordingActive(true);
    } catch (err: any) {
      console.error('Video camera error:', err);
      setVideoCameraError(err.message || 'Could not access optical sensor. Please ensure camera permissions are granted.');
    }
  };

  const stopVideoCamera = () => {
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    if (videoMediaRecorderRef.current && isVideoRecording) {
      try {
        videoMediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (videoCameraStream) {
      videoCameraStream.getTracks().forEach(track => track.stop());
      setVideoCameraStream(null);
    }
    setIsVideoRecording(false);
    setIsVideoRecordingActive(false);
    setVideoRecordingSeconds(0);
  };

  const startActualVideoRecording = () => {
    if (!videoCameraStream) return;
    videoChunksRef.current = [];
    let mimeType = '';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      mimeType = 'video/webm;codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    }

    try {
      const recorder = new MediaRecorder(videoCameraStream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      videoMediaRecorderRef.current = recorder;
      setIsVideoRecording(true);
      setVideoRecordingSeconds(0);
      videoTimerRef.current = setInterval(() => {
        setVideoRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (e: any) {
      setVideoCameraError('Failed to start video recorder: ' + e.message);
    }
  };

  const stopVideoRecordingAndSave = (autoTest: boolean = false) => {
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    const recorder = videoMediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      stopVideoCamera();
      return;
    }

    recorder.onstop = () => {
      const mime = recorder.mimeType || 'video/webm';
      const videoBlob = new Blob(videoChunksRef.current, { type: mime });
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `live_video_${timestamp}.${ext}`;
      const file = new File([videoBlob], filename, { type: mime });

      if (videoCameraStream) {
        videoCameraStream.getTracks().forEach(t => t.stop());
        setVideoCameraStream(null);
      }
      setIsVideoRecording(false);
      setIsVideoRecordingActive(false);
      setVideoRecordingSeconds(0);

      setSelectedFile(file);
      const url = URL.createObjectURL(videoBlob);
      setPreviewUrl(url);

      if (autoTest) {
        handleRunAnalysis('video', file);
      }
    };

    recorder.stop();
  };

  const formatVideoTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRunAnalysis = async (mod: MediaModality, overrideFile?: File) => {
    const targetFile = overrideFile || selectedFile;
    if (!targetFile && !directText.trim()) {
      setAnalysisError('Please upload a media file, capture a photo, or provide text before commencing examination.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await apiService.analyzeMedia({
        file: targetFile,
        textContent: directText,
        caption,
        sourceContext,
        userId: currentUser?.id,
        modality: mod
      });
      fetchHistory();
      fetchStorage();
      let localBlobUrl: string | undefined;
      if (targetFile) {
        try {
          localBlobUrl = URL.createObjectURL(targetFile);
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const b64 = reader.result as string;
              sessionStorage.setItem(`media_${res.investigation_id}`, b64);
              if (res.image_hash) {
                sessionStorage.setItem(`media_hash_${res.image_hash}`, b64);
              }
            } catch (e) {}
          };
          reader.readAsDataURL(targetFile);
        } catch (e) {
          console.error(e);
        }
      }
      onInspectResult(res, res.media_preview || localBlobUrl);
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
      {/* COLLAPSIBLE VIA GLOWING APEX DOT */}
      {/* ======================================================== */}
      <div
        className={`w-[320px] sm:w-[380px] xl:w-[420px] h-full flex-shrink-0 flex flex-col justify-between relative z-30 select-none pl-6 sm:pl-8 pr-6 sm:pr-8 pt-5 sm:pt-6 pb-6 sm:pb-8 rounded-l-none rounded-t-none rounded-b-none rounded-r-[220px] sm:rounded-r-[280px] lg:rounded-r-[320px] bg-slate-950/90 border-y-0 border-l-0 border-r-2 border-r-purple-400/90 shadow-[0_0_50px_rgba(168,85,247,0.35)] backdrop-blur-2xl transition-[margin] duration-500 ease-in-out ${isDialCollapsed
            ? '-ml-[302px] sm:-ml-[362px] xl:-ml-[402px]'
            : 'ml-0'
          }`}
      >

        {/* Interactive Glowing Neon Apex Dot - Collapse & Expand Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDialCollapsed(prev => !prev);
          }}
          title={isDialCollapsed ? "Tap to open capability dial" : "Tap to collapse dial"}
          aria-label={isDialCollapsed ? "Open Page Explorer dial" : "Collapse Page Explorer dial"}
          className="absolute -right-3.5 sm:-right-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-[0_0_20px_#c084fc,0_0_40px_rgba(168,85,247,0.8)] ring-4 ring-purple-500/70 hover:ring-purple-300 hover:scale-125 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer z-40 group"
        >
          {isDialCollapsed ? (
            <ChevronRight className="w-4 h-4 text-purple-950 font-extrabold animate-pulse" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-purple-700/50 group-hover:bg-purple-900 transition-colors" />
          )}
        </button>

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
                  <div className={`relative transition-all duration-300 flex items-center justify-center rounded-full cursor-pointer ${isActive
                      ? 'w-16 h-16 sm:w-18 sm:h-18 bg-purple-900/60 border-2 border-purple-300 text-white ring-4 ring-purple-500/50 shadow-[0_0_32px_rgba(192,132,252,0.8)] scale-105'
                      : 'w-14 h-14 sm:w-16 sm:h-16 bg-slate-900/70 border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 hover:bg-purple-900/40 hover:scale-105 shadow-md'
                    }`}>
                    <IconComponent className={`transition-transform duration-300 ${isActive ? 'w-7 h-7 scale-110 text-white' : 'w-6 h-6 text-purple-300 group-hover:scale-110'
                      }`} />

                    {/* Subtle Badge Count */}
                    {item.badge !== undefined && (
                      <span className={`absolute -top-1 -right-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border shadow-xs ${isActive
                          ? 'bg-purple-500 text-white border-purple-300'
                          : 'bg-slate-800 text-purple-300 border-purple-500/40'
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Label Underneath */}
                  <span className={`text-xs mt-2 font-medium tracking-wide transition-colors ${isActive
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
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center space-x-1.5 transition cursor-pointer border ${isSecActive
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
      <div className={`flex-1 h-full min-h-0 flex flex-col p-4 sm:p-6 lg:p-7 pr-4 sm:pr-8 gap-3.5 overflow-hidden relative z-10 transition-all duration-500 ${isDialCollapsed ? 'pl-8 sm:pl-10' : 'pl-4 sm:pl-6'
        }`}>

        {/* Top Control Bar: Search Bar + Capabilities Trigger + User Profile Avatar */}
        <div className="flex items-center justify-between flex-shrink-0 gap-3">

          <div className="flex items-center space-x-2 flex-1 max-w-lg">
            {/* Quick Toggle Button when dial is collapsed */}
            {isDialCollapsed && (
              <button
                type="button"
                onClick={() => setIsDialCollapsed(false)}
                className="px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center space-x-1 hover:text-white transition cursor-pointer shadow-md"
              >
                <span>← Capabilities</span>
              </button>
            )}

            {/* Search Input Container with Live Instant Dropdown */}
            <div ref={searchContainerRef} className="relative flex-1">
              <Search className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                  } else if (e.key === 'Enter' && searchResults.length > 0) {
                    onOpenInvestigation(searchResults[0].id);
                    setIsSearchOpen(false);
                  }
                }}
                placeholder="Search forensic registry by file, SHA, ID..."
                className="w-full pl-10 pr-9 py-2 bg-slate-900/80 border border-purple-500/30 rounded-full text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition shadow-inner"
              />

              {/* Clear search button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 top-2 text-purple-400/70 hover:text-white transition p-0.5 cursor-pointer"
                  title="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Live Instant Search Results Flyout */}
              {isSearchOpen && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-950/95 border border-purple-500/40 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(168,85,247,0.3)] backdrop-blur-2xl p-3 max-h-[420px] overflow-y-auto custom-scrollbar">

                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-purple-500/20 text-[11px] font-mono text-purple-300/80">
                    <span>Forensic Registry Matches ({searchResults.length})</span>
                    <span className="text-[10px] text-purple-400/60">Press Enter ↵ to inspect top case</span>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="space-y-1.5 pt-2">
                      {searchResults.slice(0, 8).map((item) => {
                        const modality = detectModality(item.image_name);
                        const ModalityIcon = modality === 'video' ? Video : modality === 'audio' ? Mic : modality === 'text' ? FileText : ImageIcon;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              onOpenInvestigation(item.id);
                              setIsSearchOpen(false);
                            }}
                            className="p-2.5 rounded-xl border border-purple-500/10 hover:border-purple-400/60 bg-slate-900/60 hover:bg-purple-900/30 transition flex items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-300 group-hover:text-white group-hover:border-purple-400 transition">
                                <ModalityIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="text-xs font-bold text-white group-hover:text-purple-300 transition truncate">
                                    {item.image_name}
                                  </h5>
                                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                                    {modality}
                                  </span>
                                </div>
                                <p className="text-[10px] font-mono text-purple-400/70 truncate mt-0.5">
                                  Case #{item.id.slice(0, 8)} • SHA: {item.image_hash?.slice(0, 10)}... • {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {getScoreBadge(item.indicator_score || 0)}
                              <ChevronRight className="w-4 h-4 text-purple-400/50 group-hover:text-purple-300 group-hover:translate-x-0.5 transition" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 px-4 text-center space-y-2">
                      <p className="text-xs text-purple-200 font-semibold">
                        No forensic cases found for "{searchQuery}"
                      </p>
                      <p className="text-[11px] text-purple-400/60 font-mono">
                        Try searching by exact file name, SHA-256 hash prefix, or Case ID.
                      </p>
                    </div>
                  )}

                  {/* Matching Files in Storage Vault */}
                  {matchingStorageFiles.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-purple-500/20 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-purple-400/80 px-2">Storage Vault Matches:</span>
                      {matchingStorageFiles.slice(0, 3).map((f, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setActiveOption('storage');
                            setIsSearchOpen(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900/40 hover:bg-purple-900/20 text-xs flex items-center justify-between text-purple-200 transition cursor-pointer"
                        >
                          <span className="truncate">{f.filename}</span>
                          <span className="text-[10px] font-mono text-purple-400/70">{(f.size_bytes / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Action: Search MCP Web Intelligence */}
                  <div className="mt-2 pt-2 border-t border-purple-500/20">
                    <button
                      type="button"
                      onClick={() => {
                        setMcpQuery(searchQuery);
                        setActiveOption('mcp');
                        setIsSearchOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-900/80 border border-purple-500/30 text-[11px] text-purple-200 hover:text-white flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center space-x-2">
                        <Globe className="w-3.5 h-3.5 text-purple-400" />
                        <span>Query MCP Web & OSINT Registry for "<strong>{searchQuery}</strong>"</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                    </button>
                  </div>

                </div>
              )}
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
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              title="Lead Examiner Profile & Credentials"
              className="w-10 h-10 rounded-full bg-purple-950/70 border border-purple-500/50 hover:border-purple-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-purple-200 hover:text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-2 ring-purple-500/30 cursor-pointer"
            >
              <User className="w-5 h-5 text-purple-200" />
            </button>
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

                      <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Select Image File</span>
                        </button>
                        <button
                          onClick={() => {
                            if (isCameraActive) {
                              stopCamera();
                            } else {
                              startCamera();
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center space-x-2 transition cursor-pointer ${
                            isCameraActive
                              ? 'border-rose-500/50 bg-rose-950/60 text-rose-300 hover:bg-rose-900 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                              : 'border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          }`}
                        >
                          <Camera className="w-4 h-4 text-cyan-400" />
                          <span>{isCameraActive ? 'Close Floating Camera' : 'Capture Live Image'}</span>
                        </button>
                      </div>
                    </div>

                    {cameraError && (
                      <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{cameraError}</span>
                      </div>
                    )}

                    {isCameraActive && (
                      <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-300 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                          <span className="font-semibold">Floating Camera Window is active on screen</span>
                        </div>
                        <button
                          onClick={stopCamera}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 hover:text-white text-[11px] font-mono transition cursor-pointer"
                        >
                          Cancel Camera
                        </button>
                      </div>
                    )}

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
                      {investigations
                        .filter(i => detectModality(i.image_name) === 'image')
                        .filter(i => !searchQuery || i.image_name?.toLowerCase().includes(searchQuery.toLowerCase()) || i.id?.toLowerCase().includes(searchQuery.toLowerCase()) || i.image_hash?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .slice(0, 6)
                        .map(item => (
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

                      <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Select Video File</span>
                        </button>
                        <button
                          onClick={() => {
                            if (isVideoRecordingActive) {
                              stopVideoCamera();
                            } else {
                              startVideoCamera();
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center space-x-2 transition cursor-pointer ${
                            isVideoRecordingActive
                              ? 'border-rose-500/50 bg-rose-950/60 text-rose-300 hover:bg-rose-900 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                              : 'border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          }`}
                        >
                          <Video className="w-4 h-4 text-cyan-400" />
                          <span>{isVideoRecordingActive ? 'Close Floating Recorder' : 'Record Live Video'}</span>
                        </button>
                      </div>
                    </div>

                    {videoCameraError && (
                      <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{videoCameraError}</span>
                      </div>
                    )}

                    {isVideoRecordingActive && (
                      <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between shadow-[0_0_15px_rgba(244,63,94,0.2)] animate-pulse">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${isVideoRecording ? 'bg-rose-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
                          <span className="font-semibold">
                            {isVideoRecording 
                              ? `Live Video Recording active on screen (${formatVideoTimer(videoRecordingSeconds)})` 
                              : 'Floating Video Recorder Window is active on screen'}
                          </span>
                        </div>
                        <button
                          onClick={stopVideoCamera}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-200 hover:text-white text-[11px] font-mono transition cursor-pointer"
                        >
                          Cancel Recorder
                        </button>
                      </div>
                    )}

                    {selectedFile && (
                      <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="font-semibold text-white truncate max-w-sm">{selectedFile.name}</span>
                          <span className="text-purple-300 font-mono">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="text-purple-400 hover:text-rose-400 transition ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {previewUrl && (
                      <div className="relative rounded-xl overflow-hidden max-h-56 bg-black/50 border border-purple-500/20 flex items-center justify-center p-1">
                        <video src={previewUrl} controls className="max-h-52 w-full object-contain rounded-lg" />
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
                      {investigations
                        .filter(i => detectModality(i.image_name) === 'video')
                        .filter(i => !searchQuery || i.image_name?.toLowerCase().includes(searchQuery.toLowerCase()) || i.id?.toLowerCase().includes(searchQuery.toLowerCase()) || i.image_hash?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .slice(0, 6)
                        .map(item => (
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
                      <p className="text-xs text-purple-300/80">Digital evidence custody registry with cryptographic SHA-256 validation.</p>
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
                          .filter(i => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase().trim();
                            return (
                              i.image_name?.toLowerCase().includes(q) ||
                              i.id?.toLowerCase().includes(q) ||
                              i.image_hash?.toLowerCase().includes(q) ||
                              detectModality(i.image_name).includes(q)
                            );
                          })
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
                      <p className="text-[11px] text-purple-300/70">Secure cryptographic custody</p>
                    </div>
                  </div>

                  {/* Stored Files Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                        Files in Forensic Storage Vault {searchQuery ? `(matching "${searchQuery}")` : ''}
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
                        storageStats.files
                          .filter(f => !searchQuery || f.filename?.toLowerCase().includes(searchQuery.toLowerCase()) || f.category?.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((file, idx) => (
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

      {/* ======================================================== */}
      {/* LEAD EXAMINER PROFILE DETAILS MODAL */}
      {/* ======================================================== */}
      {isProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-950/95 border border-purple-500/40 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(168,85,247,0.35)] backdrop-blur-2xl p-6 sm:p-8 relative overflow-hidden text-white font-sans space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 transition cursor-pointer"
              title="Close Profile"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header: Lead Examiner Card */}
            <div className="flex items-start space-x-4 border-b border-purple-500/20 pb-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/40 ring-2 ring-purple-300/40">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-slate-950 flex items-center justify-center" title="Active Lead Session">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-900/70 text-purple-300 border border-purple-500/40">
                    {currentUser ? 'Authenticated Investigator' : 'Lead Examiner (Demo Profile)'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                    Active Session
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {currentUser?.full_name || 'Dr. Elena Vance'}
                </h3>
                <p className="text-xs text-purple-300 font-medium">
                  Chief Digital Forensics Examiner & Provenance Lead
                </p>
                <p className="text-[11px] font-mono text-purple-400/80">
                  {currentUser?.email || 'lead.examiner@truthlens.ai'}
                </p>
              </div>
            </div>

            {/* Forensic Examiner Credentials Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-purple-500/20 space-y-1">
                <span className="text-[10px] uppercase text-purple-400">Examiner ID</span>
                <p className="font-bold text-white">#TL-8429-EXAM</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-purple-500/20 space-y-1">
                <span className="text-[10px] uppercase text-purple-400">Judicial Clearance</span>
                <p className="font-bold text-emerald-400">Level 4 Federal</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-purple-500/20 space-y-1">
                <span className="text-[10px] uppercase text-purple-400">Department</span>
                <p className="font-bold text-white truncate">AI Provenance Taskforce</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-purple-500/20 space-y-1">
                <span className="text-[10px] uppercase text-purple-400">Evidence Vault</span>
                <p className="font-bold text-purple-300 truncate">
                  {storageStats ? `${(storageStats.total_size_bytes / (1024 * 1024)).toFixed(1)} MB • ${storageStats.total_files_count} Files` : '17.01 MB • 53 Files'}
                </p>
              </div>
            </div>

            {/* Authorized Diagnostic Toolsets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Active Diagnostic Clearances & Capabilities
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center space-x-2 text-purple-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Image ELA & Pixel Noise</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center space-x-2 text-purple-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Video Motion Jitter Flow</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center space-x-2 text-purple-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Audio FFT & Acoustic Prosody</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center space-x-2 text-purple-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Text Stylometry LLM Checks</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onSignOut();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <span>Sign Out Session</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-400/50 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In with Custom Account</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-purple-200 text-xs font-semibold transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEADY FLOATING WINDOW: LIVE PHOTO CAMERA ACQUISITION */}
      {/* ======================================================== */}
      {typeof document !== 'undefined' && isCameraActive && createPortal(
        <div 
          className={
            isFloatingCameraPiP
              ? "fixed bottom-6 right-6 z-[9999] w-80 sm:w-96 animate-in slide-in-from-bottom-5 duration-300 drop-shadow-2xl"
              : "fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200"
          }
          onClick={isFloatingCameraPiP ? undefined : () => {}}
        >
          <div 
            className={`relative w-full ${isFloatingCameraPiP ? '' : 'max-w-2xl'} bg-slate-950 border-2 border-cyan-400/70 rounded-3xl p-5 sm:p-6 shadow-[0_0_80px_rgba(6,182,212,0.4)] backdrop-blur-2xl flex flex-col space-y-4 overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Cyan Glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Title Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Camera className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-2">
                    <span>Optical Sensor Live Viewport</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">LIVE</span>
                  </h4>
                  <p className="text-[11px] text-cyan-400/80 font-mono">
                    Direct WebRTC Stream • Zero EXIF Penalty Mode
                  </p>
                </div>
              </div>

              {/* Window Controls (PiP Toggle & Close) */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setIsFloatingCameraPiP(!isFloatingCameraPiP)}
                  className="p-2 rounded-xl border border-cyan-500/40 bg-cyan-950/70 text-cyan-300 hover:text-white transition cursor-pointer"
                  title={isFloatingCameraPiP ? "Expand to Center" : "Float to Corner (PiP)"}
                >
                  {isFloatingCameraPiP ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-2 rounded-xl border border-cyan-500/40 bg-cyan-950/70 text-cyan-300 hover:text-white transition cursor-pointer"
                  title="Close Camera"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewfinder Video Element with Sci-Fi HUD */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-cyan-500/40 shadow-inner">
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && cameraStream && el.srcObject !== cameraStream) {
                    el.srcObject = cameraStream;
                    el.play().catch(e => console.warn('Play error:', e));
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />

              {/* Holographic Reticle Overlay */}
              <div className="absolute inset-4 pointer-events-none border border-cyan-500/20 rounded-xl flex flex-col justify-between p-2">
                <div className="flex justify-between text-[10px] font-mono text-cyan-400/80">
                  <span className="bg-black/60 px-2 py-0.5 rounded border border-cyan-500/30">[CAM-01 ACTIVE]</span>
                  <span className="bg-black/60 px-2 py-0.5 rounded border border-cyan-500/30">1080P HD • 60 FPS</span>
                </div>
                <div className="self-center w-14 h-14 border border-cyan-400/40 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-cyan-400/80">
                  <span className="bg-black/60 px-2 py-0.5 rounded">DIRECT WEBRTC RASTER</span>
                  <span className="bg-black/60 px-2 py-0.5 rounded">READY FOR SCAN</span>
                </div>
              </div>
            </div>

            {/* Floating Actions Deck */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-xl border border-purple-500/40 bg-slate-900 text-xs text-purple-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => captureLiveImage(false)}
                  className="px-4 py-2.5 rounded-xl border border-cyan-500/50 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-200 font-semibold text-xs flex items-center space-x-2 transition cursor-pointer shadow-md"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Snap Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => captureLiveImage(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs flex items-center space-x-2 shadow-[0_0_25px_rgba(6,182,212,0.45)] transition cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Capture & Test Immediately</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* STEADY FLOATING WINDOW: LIVE VIDEO RECORDER */}
      {/* ======================================================== */}
      {typeof document !== 'undefined' && isVideoRecordingActive && createPortal(
        <div 
          className={
            isFloatingVideoPiP
              ? "fixed bottom-6 right-6 z-[9999] w-80 sm:w-96 animate-in slide-in-from-bottom-5 duration-300 drop-shadow-2xl"
              : "fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200"
          }
          onClick={isFloatingVideoPiP ? undefined : () => {}}
        >
          <div 
            className={`relative w-full ${isFloatingVideoPiP ? '' : 'max-w-2xl'} bg-slate-950 border-2 border-rose-500/70 rounded-3xl p-5 sm:p-6 shadow-[0_0_80px_rgba(244,63,94,0.4)] backdrop-blur-2xl flex flex-col space-y-4 overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Rose Glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Title Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                  <Video className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <span>{isVideoRecording ? `LIVE RECORDING (${formatVideoTimer(videoRecordingSeconds)})` : 'LIVE OPTICAL VIDEO RECORDER'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isVideoRecording ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'}`}>
                      {isVideoRecording ? 'REC ● ACTIVE' : 'STANDBY'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-purple-300/80 font-mono">
                    Temporal Frame Extraction • Deepfake Motion Jitter Check
                  </p>
                </div>
              </div>

              {/* Window Controls (PiP Toggle & Close) */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setIsFloatingVideoPiP(!isFloatingVideoPiP)}
                  className="p-2 rounded-xl border border-purple-500/40 bg-purple-950/60 text-purple-300 hover:text-white transition cursor-pointer"
                  title={isFloatingVideoPiP ? "Expand to Center" : "Float to Corner (PiP)"}
                >
                  {isFloatingVideoPiP ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={stopVideoCamera}
                  className="p-2 rounded-xl border border-rose-500/40 bg-rose-950/60 text-rose-300 hover:text-white transition cursor-pointer"
                  title="Close Video Recorder"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewfinder Video Element with Sci-Fi HUD */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-rose-500/40 shadow-inner">
              <video
                ref={(el) => {
                  videoPreviewRef.current = el;
                  if (el && videoCameraStream && el.srcObject !== videoCameraStream) {
                    el.srcObject = videoCameraStream;
                    el.play().catch(e => console.warn('Play error:', e));
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />

              {/* Sci-fi Overlay */}
              <div className="absolute inset-4 pointer-events-none border border-rose-500/20 rounded-xl flex flex-col justify-between p-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400/80">
                  <span className="flex items-center space-x-1 bg-black/70 px-2 py-0.5 rounded border border-rose-500/30">
                    {isVideoRecording && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-1" />}
                    <span className={isVideoRecording ? 'text-rose-400 font-bold' : ''}>
                      {isVideoRecording ? 'REC ● ACTIVE' : '[CAM STANDBY]'}
                    </span>
                  </span>
                  <span className="bg-black/90 px-2.5 py-0.5 rounded border border-rose-500/50 text-rose-300 font-bold font-mono text-xs shadow-md">
                    {formatVideoTimer(videoRecordingSeconds)}
                  </span>
                </div>
                <div className="self-center w-16 h-16 border border-rose-400/40 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                  <div className={`w-3.5 h-3.5 rounded-full ${isVideoRecording ? 'bg-rose-500 animate-ping' : 'bg-cyan-400/50'}`} />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-cyan-400/80">
                  <span className="bg-black/60 px-2 py-0.5 rounded">OPTICAL TEMPORAL STREAM</span>
                  <span className="bg-black/60 px-2 py-0.5 rounded">KEEP SUBJECT VISIBLE</span>
                </div>
              </div>
            </div>

            {/* Floating Actions Deck */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={stopVideoCamera}
                className="px-4 py-2.5 rounded-xl border border-purple-500/40 bg-slate-900 text-xs text-purple-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              
              <div className="flex items-center gap-2">
                {!isVideoRecording ? (
                  <button
                    type="button"
                    onClick={startActualVideoRecording}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-2 shadow-[0_0_25px_rgba(244,63,94,0.5)] transition cursor-pointer"
                  >
                    <Circle className="w-3.5 h-3.5 fill-white" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => stopVideoRecordingAndSave(false)}
                      className="px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-950/70 hover:bg-rose-900 text-rose-200 font-semibold text-xs flex items-center space-x-2 transition cursor-pointer shadow-md"
                    >
                      <Square className="w-3.5 h-3.5 fill-rose-300" />
                      <span>Stop & Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => stopVideoRecordingAndSave(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold text-xs flex items-center space-x-2 shadow-[0_0_25px_rgba(244,63,94,0.5)] transition cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Stop & Test Immediately</span>
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
