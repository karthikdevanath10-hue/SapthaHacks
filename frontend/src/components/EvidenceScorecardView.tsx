import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Info, HelpCircle, 
  Download, FileCheck, Layers, Sparkles, CheckCircle2, ChevronDown, ChevronUp,
  Camera, Cpu, MessageSquare, Video, Mic, FileText, ArrowRight, Maximize2, X
} from 'lucide-react';
import { FullAnalysisResponse, EvidenceItem } from '../types';
import { apiService } from '../services/api';

interface ScorecardProps {
  analysis: FullAnalysisResponse;
  onDownloadReport?: () => void;
  previewUrl?: string | null;
}

export const EvidenceScorecardView: React.FC<ScorecardProps> = ({ analysis, onDownloadReport, previewUrl }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const resolveMediaUrl = () => {
    const cached = typeof window !== 'undefined' 
      ? (sessionStorage.getItem(`media_${analysis.investigation_id}`) || sessionStorage.getItem(`media_hash_${analysis.image_hash}`)) 
      : null;

    if (previewUrl && !previewUrl.includes('/api/media/')) {
      return previewUrl;
    }
    if (analysis.media_preview) {
      return analysis.media_preview;
    }
    if ((analysis.metadata as any)?.media_preview) {
      return (analysis.metadata as any).media_preview;
    }
    if (cached) {
      return cached;
    }
    return previewUrl || apiService.getMediaUrl(analysis.investigation_id);
  };

  const [currentMediaSrc, setCurrentMediaSrc] = useState<string>(resolveMediaUrl);
  const [imgFailed, setImgFailed] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  useEffect(() => {
    const next = resolveMediaUrl();
    setCurrentMediaSrc(next);
    setImgFailed(false);
  }, [analysis, previewUrl]);

  const handleImageError = () => {
    const cached = typeof window !== 'undefined' 
      ? (sessionStorage.getItem(`media_${analysis.investigation_id}`) || sessionStorage.getItem(`media_hash_${analysis.image_hash}`)) 
      : null;

    if (currentMediaSrc && currentMediaSrc.includes('/api/media/')) {
      const fallback = analysis.media_preview || (analysis.metadata as any)?.media_preview || cached;
      if (fallback && fallback !== currentMediaSrc) {
        setCurrentMediaSrc(fallback);
        return;
      }
    } else if (currentMediaSrc && !currentMediaSrc.startsWith('data:') && !currentMediaSrc.startsWith('blob:')) {
      const apiFallback = apiService.getMediaUrl(analysis.investigation_id);
      if (apiFallback !== currentMediaSrc) {
        setCurrentMediaSrc(apiFallback);
        return;
      }
    }
    setImgFailed(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Human-friendly title and takeaway translator (Cyber-Neon Dark Themed)
  const getFriendlyPresentation = (item: EvidenceItem) => {
    const id = item.id.toUpperCase();
    const title = item.title.toLowerCase();

    if (id.includes('META-04-LIVE') || title.includes('direct browser optical') || analysis.image_name.toLowerCase().includes('live_capture') || analysis.image_name.toLowerCase().includes('live_video')) {
      return {
        badge: 'Live Optical Stream',
        simpleTitle: 'Live In-Browser Camera Capture (Clean Pixel Buffer)',
        takeaway: 'This media was captured live directly from your camera via TruthLens. Standard HTML5 web browser APIs produce direct raster streams without hardware EXIF metadata.',
        statusIcon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        statusColor: 'text-emerald-300',
        borderColor: 'border-emerald-500/30',
        bgGradient: 'from-emerald-950/40 via-slate-950/70 to-slate-950/90',
        verdictLabel: 'AUTHENTIC STREAM',
        verdictClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
      };
    }

    if (id.includes('META-04') || title.includes('stripped') || title.includes('absent hardware')) {
      return {
        badge: 'Social Media Notice',
        simpleTitle: 'Camera Info Was Removed (Standard on Social Media)',
        takeaway: 'No physical camera details (make/model) were found. This happens automatically whenever an image is uploaded to WhatsApp, Instagram, or Twitter.',
        statusIcon: <Info className="w-5 h-5 text-sky-400" />,
        statusColor: 'text-sky-300',
        borderColor: 'border-sky-500/30',
        bgGradient: 'from-sky-950/40 via-slate-950/70 to-slate-950/90',
        verdictLabel: 'BENIGN NOTE',
        verdictClass: 'bg-sky-950/60 text-sky-300 border-sky-500/40'
      };
    }
    if (id.includes('TECH-04') || title.includes('consistent compression')) {
      return {
        badge: 'Pixel Integrity Clean',
        simpleTitle: 'Even Image Quality Across All Pixels (No Splicing)',
        takeaway: 'Error Level Analysis (ELA) shows the entire image degraded uniformly. No cut-and-paste or spliced objects from other photos were detected.',
        statusIcon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        statusColor: 'text-emerald-300',
        borderColor: 'border-emerald-500/30',
        bgGradient: 'from-emerald-950/40 via-slate-950/70 to-slate-950/90',
        verdictLabel: 'PASSED',
        verdictClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
      };
    }
    if (title.includes('ai synthesis software') || id.includes('META-01')) {
      return {
        badge: 'AI Generator Tag',
        simpleTitle: 'AI Software Stamp Detected in File Headers',
        takeaway: 'The file directly contains embedded parameters from a known generative AI tool (e.g. Midjourney, Stable Diffusion, or ComfyUI).',
        statusIcon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
        statusColor: 'text-rose-300',
        borderColor: 'border-rose-500/30',
        bgGradient: 'from-rose-950/40 via-slate-950/70 to-slate-950/90',
        verdictLabel: 'FLAGGED',
        verdictClass: 'bg-rose-950/60 text-rose-300 border-rose-500/40'
      };
    }
    if (title.includes('noise discontinuity') || title.includes('sensor noise')) {
      return {
        badge: 'Pixel Noise Inconsistency',
        simpleTitle: 'Unnatural Sensor Noise Variation in Sectors',
        takeaway: 'Different parts of the image have conflicting noise grain, suggesting multiple images may have been merged together.',
        statusIcon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        statusColor: 'text-amber-300',
        borderColor: 'border-amber-500/30',
        bgGradient: 'from-amber-950/40 via-slate-950/70 to-slate-950/90',
        verdictLabel: 'WARNING',
        verdictClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40'
      };
    }
    if (title.includes('discordance') || title.includes('mismatch')) {
      return {
        badge: 'Claim Mismatch',
        simpleTitle: 'Caption Does Not Match What Is Visible (Out-of-Context Media)',
        takeaway: 'The photo itself may be a genuine photo, but the text/caption makes false claims that directly contradict the picture.',
        statusIcon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        statusColor: 'text-amber-300',
        borderColor: 'border-amber-500/30',
        bgGradient: 'from-amber-950/40 via-slate-950/70 to-slate-950/90',
        verdictLabel: 'MISMATCH',
        verdictClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40'
      };
    }

    // Default Fallbacks
    if (item.severity === 'suspicious') {
      return {
        badge: 'Suspicious Anomaly',
        simpleTitle: item.title,
        takeaway: item.explanation,
        statusIcon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
        statusColor: 'text-rose-300',
        borderColor: 'border-rose-500/30',
        bgGradient: 'from-rose-950/40 via-slate-950/70 to-slate-950/90',
        verdictLabel: 'FLAGGED',
        verdictClass: 'bg-rose-950/60 text-rose-300 border-rose-500/40'
      };
    }
    if (item.severity === 'medium') {
      return {
        badge: 'Needs Review',
        simpleTitle: item.title,
        takeaway: item.explanation,
        statusIcon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        statusColor: 'text-amber-300',
        borderColor: 'border-amber-500/30',
        bgGradient: 'from-amber-950/40 via-slate-950/70 to-slate-950/90',
        verdictLabel: 'REVIEW',
        verdictClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40'
      };
    }
    return {
      badge: 'Verified Normal',
      simpleTitle: item.title,
      takeaway: item.explanation,
      statusIcon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      statusColor: 'text-emerald-300',
      borderColor: 'border-emerald-500/30',
      bgGradient: 'from-emerald-950/40 via-slate-950/70 to-slate-950/90',
      verdictLabel: 'NORMAL',
      verdictClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
    };
  };

  const getAssessmentTheme = (assessment: string) => {
    if (assessment.includes('Multiple suspicious')) {
      return {
        border: 'border-rose-500/40',
        bg: 'bg-gradient-to-br from-rose-950/40 via-slate-950/90 to-purple-950/40',
        badge: 'bg-rose-950/70 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
        barColor: 'from-amber-400 to-rose-500',
        textColor: 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]',
        statusText: 'Multiple Suspicious Indicators Detected',
        quickVerdict: 'High probability of synthetic manipulation or heavy editing.',
        icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
        iconBg: 'bg-rose-950/60 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
        glowShadow: 'shadow-[0_0_40px_rgba(244,63,94,0.18)]'
      };
    }
    if (assessment.includes('Some indicators')) {
      return {
        border: 'border-amber-500/40',
        bg: 'bg-gradient-to-br from-amber-950/40 via-slate-950/90 to-purple-950/40',
        badge: 'bg-amber-950/70 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
        barColor: 'from-purple-500 to-amber-400',
        textColor: 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]',
        statusText: 'Some Indicators Require Attention',
        quickVerdict: 'Media has edits or missing data, but is not conclusively synthetic.',
        icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
        iconBg: 'bg-amber-950/60 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
        glowShadow: 'shadow-[0_0_40px_rgba(245,158,11,0.18)]'
      };
    }
    return {
      border: 'border-emerald-500/40',
      bg: 'bg-gradient-to-br from-emerald-950/30 via-slate-950/90 to-purple-950/40',
      badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      barColor: 'from-purple-500 via-teal-400 to-emerald-400',
      textColor: 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      statusText: 'No Major Suspicious Indicators Detected',
      quickVerdict: 'Visuals and pixel structures align with authentic camera captures.',
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
      iconBg: 'bg-emerald-950/60 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      glowShadow: 'shadow-[0_0_40px_rgba(16,185,129,0.18)]'
    };
  };

  const filteredEvidence = analysis.evidence_scorecard.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'flagged') return item.severity === 'suspicious' || item.severity === 'medium';
    if (activeFilter === 'metadata') return item.layer.includes('Metadata');
    if (activeFilter === 'technical') return item.layer.includes('Technical') || item.layer.includes('Video') || item.layer.includes('Audio');
    if (activeFilter === 'vision') return item.layer.includes('Visual');
    if (activeFilter === 'caption') return item.layer.includes('Caption');
    return true;
  });

  const theme = getAssessmentTheme(analysis.assessment);

  const handleDownload = () => {
    if (onDownloadReport) {
      onDownloadReport();
    } else {
      window.open(apiService.getReportDownloadUrl(analysis.investigation_id), '_blank');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* ======================================================== */}
      {/* 1. TOP HERO: CYBER NEON VERDICT CARD */}
      {/* ======================================================== */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${theme.border} ${theme.bg} ${theme.glowShadow} backdrop-blur-2xl relative overflow-hidden`}>
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wider uppercase ${theme.badge}`}>
                {theme.statusText}
              </span>
              <span className="text-xs text-purple-300/70 font-mono">
                Modality: <strong className="text-white uppercase">{analysis.modality}</strong>
              </span>
              <span className="text-xs text-purple-300/70 font-mono">
                Case #{analysis.investigation_id.slice(0, 8)}
              </span>
            </div>

            <div className="flex items-start space-x-4">
              <div className={`p-3.5 rounded-2xl border ${theme.iconBg}`}>
                {theme.icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                  {analysis.image_name}
                </h2>
                <p className="text-sm sm:text-base font-semibold text-purple-200">
                  {theme.quickVerdict}
                </p>
              </div>
            </div>

            {/* Executive Forensic Briefing */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30 text-xs space-y-1.5 max-w-3xl shadow-inner">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Executive Forensic Briefing:</span>
              </span>
              <p className="text-purple-100/90 leading-relaxed font-sans">
                "{analysis.summary}"
              </p>
            </div>

            {/* File Details Bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono text-purple-300/70 pt-1">
              <span>SHA-256: <code className="text-purple-300 font-semibold">{analysis.image_hash.slice(0, 16)}...</code></span>
              <span>Size: <strong className="text-white">{analysis.metadata.file_size_human}</strong></span>
              <span>Dimensions: <strong className="text-white">{analysis.metadata.dimensions.width}×{analysis.metadata.dimensions.height}</strong></span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* UPLOADED EVIDENCE MEDIA PREVIEW (Left of Suspicious Indicator Score) */}
          {/* ======================================================== */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center self-center">
            <div className="relative group w-48 sm:w-56 h-48 sm:h-52 rounded-2xl border border-purple-500/40 bg-slate-950/90 shadow-[0_0_25px_rgba(168,85,247,0.25)] overflow-hidden flex items-center justify-center p-2 backdrop-blur-xl hover:border-purple-400 transition-all duration-300">
              
              {/* Top Status Badge */}
              <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-slate-950/85 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1 shadow-sm backdrop-blur-sm pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Uploaded Media</span>
              </div>

              {/* Lightbox Trigger Button */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-purple-950/80 border border-purple-400/40 text-purple-200 hover:text-white hover:bg-purple-900 transition shadow-sm cursor-pointer opacity-80 group-hover:opacity-100"
                title="Inspect Full Media"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Modality Dynamic Viewer */}
              {analysis.modality === 'video' ? (
                <video
                  src={currentMediaSrc}
                  controls
                  className="w-full h-full object-contain rounded-xl bg-black"
                />
              ) : analysis.modality === 'audio' ? (
                <div className="flex flex-col items-center justify-center space-y-2 p-2 text-center w-full">
                  <div className="p-3 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <Mic className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="text-[11px] font-mono text-purple-200 truncate max-w-[140px]">
                    {analysis.image_name}
                  </span>
                  <audio controls src={currentMediaSrc} className="w-full h-8 scale-90" />
                </div>
              ) : analysis.modality === 'text' ? (
                <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                  <FileText className="w-8 h-8 text-purple-400" />
                  <span className="text-[11px] font-mono text-purple-200 line-clamp-3">
                    {analysis.image_name}
                  </span>
                </div>
              ) : (
                /* Image Modality */
                !imgFailed ? (
                  <img
                    src={currentMediaSrc}
                    alt={analysis.image_name}
                    onError={handleImageError}
                    onClick={() => setIsLightboxOpen(true)}
                    className="w-full h-full object-contain rounded-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                    <Camera className="w-8 h-8 text-purple-400/80" />
                    <span className="text-[11px] font-mono text-purple-300/80 line-clamp-2">
                      {analysis.image_name}
                    </span>
                    <span className="text-[10px] text-purple-400/60 font-sans">
                      Evidence Recorded
                    </span>
                  </div>
                )
              )}

              {/* Bottom Expand Label on Hover */}
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="absolute inset-x-0 bottom-0 py-1 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent text-[10px] font-mono text-purple-300/90 text-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              >
                Click to inspect
              </div>
            </div>
          </div>

          {/* Anomaly Gauge & PDF Export Button */}
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-purple-500/30 flex flex-col items-center justify-center min-w-[240px] text-center shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-xl">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-300/80 mb-1">
              Suspicious Indicator Score
            </span>
            
            <div className="flex items-baseline space-x-1 my-1">
              <span className={`text-5xl font-extrabold font-mono ${theme.textColor}`}>
                {analysis.indicator_score}
              </span>
              <span className="text-purple-400/60 font-mono text-base font-semibold">/100</span>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-2.5 my-2 overflow-hidden border border-purple-500/30">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${theme.barColor} transition-all duration-1000 shadow-[0_0_10px_rgba(192,132,252,0.8)]`}
                style={{ width: `${Math.max(analysis.indicator_score, 6)}%` }}
              />
            </div>
            
            <span className="text-[11px] font-medium text-purple-300/80 italic">
              {analysis.indicator_score > 50 ? 'High Anomaly Signals' : analysis.indicator_score > 20 ? 'Moderate Anomaly Signals' : 'Clean & Natural Signals'}
            </span>

            <button
              onClick={handleDownload}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-400/40 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Official Dossier (PDF)</span>
            </button>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. FILTER PILLS & COUNT */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-500/20">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-purple-400" />
            <span>Evidence Scorecard (Scientific Traceability)</span>
          </h3>
          <p className="text-xs text-purple-300/70">
            Each finding broken down into simple terms with verifiable technical proofs
          </p>
        </div>

        {/* Corporate Filter Pills (Cyber Neon Style) */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-purple-500/30 text-xs">
          {[
            { id: 'all', label: `All Findings (${analysis.evidence_scorecard.length})` },
            { id: 'flagged', label: 'Flagged Only' },
            { id: 'metadata', label: 'Metadata' },
            { id: 'technical', label: 'Technical Signal' },
            { id: 'vision', label: 'AI Reasoning' },
            { id: 'caption', label: 'Claim Check' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer border ${
                activeFilter === f.id
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)] font-semibold'
                  : 'bg-transparent text-purple-300/70 border-transparent hover:text-white hover:bg-purple-900/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SIMPLIFIED, HUMAN-FRIENDLY EVIDENCE CARDS (CYBER DARK) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvidence.map((item) => {
          const presentation = getFriendlyPresentation(item);
          const isExpanded = Boolean(expandedItems[item.id]);

          return (
            <div 
              key={item.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${presentation.borderColor} bg-gradient-to-r ${presentation.bgGradient} shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] backdrop-blur-xl`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* Main Content */}
                <div className="space-y-2 flex-1">
                  
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${presentation.verdictClass}`}>
                      {presentation.verdictLabel}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-900/80 text-purple-300 border border-purple-500/30 font-mono shadow-xs">
                      {item.layer}
                    </span>
                    <span className="text-xs text-purple-300/70 font-mono">
                      Confidence: <strong className="text-white">{item.confidence}</strong>
                    </span>
                  </div>

                  {/* Clean, Human-Friendly Title */}
                  <div className="flex items-start space-x-3 pt-1">
                    <div className="mt-0.5">
                      {presentation.statusIcon}
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {presentation.simpleTitle}
                      </h4>
                      {/* 1-Sentence Plain-English Takeaway */}
                      <p className="text-sm text-purple-200/80 leading-relaxed mt-1">
                        {presentation.takeaway}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Impact Points & Dropdown Toggle */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-purple-500/20 pt-3 md:pt-0 md:pl-5 min-w-[130px]">
                  <span className="text-[10px] font-mono text-purple-300/70 uppercase">Score Impact</span>
                  <span className={`text-xl font-mono font-extrabold ${item.score_impact > 15 ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : item.score_impact > 0 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}>
                    +{item.score_impact} pts
                  </span>

                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="mt-2 text-xs font-semibold text-purple-200 hover:text-white flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/60 shadow-xs transition cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Proof' : 'View Proof'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

              </div>

              {/* ======================================================== */}
              {/* COLLAPSIBLE DEEP TECHNICAL PROOF */}
              {/* ======================================================== */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-purple-500/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-fadeIn">
                  
                  {/* Why Flagged */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-purple-500/30 space-y-1.5 shadow-xs">
                    <div className="flex items-center space-x-1.5 text-purple-300 font-bold">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      <span>Scientific Forensic Cause:</span>
                    </div>
                    <p className="text-purple-100/90 leading-relaxed font-sans">
                      {item.why_flagged}
                    </p>
                    <p className="text-[11px] text-purple-300/70 font-mono pt-1">
                      Evidence Source: <span className="text-purple-300 font-semibold">{item.evidence_source}</span>
                    </p>
                  </div>

                  {/* Scientific Limitations */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-purple-500/30 space-y-1.5 shadow-xs">
                    <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Important Limitation:</span>
                    </div>
                    <p className="text-purple-100/90 leading-relaxed font-sans">
                      {item.limitations}
                    </p>
                    <p className="text-[10px] text-purple-300/60 italic pt-1">
                      * Automated indicators assist human investigators; they do not replace formal chain-of-custody verification.
                    </p>
                  </div>

                </div>
              )}

            </div>
          );
        })}

        {filteredEvidence.length === 0 && (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl text-purple-300/70 border border-purple-500/30">
            No findings match the selected filter category.
          </div>
        )}
      </div>

      {/* Methodology & Ethical Disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-500/30 text-xs text-purple-300/80 space-y-2 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
        <div className="flex items-center space-x-2 text-purple-400 font-bold uppercase tracking-wider text-[11px]">
          <Info className="w-4 h-4" />
          <span>Judicial & Forensic Methodology Notice</span>
        </div>
        <p className="text-purple-200/80 leading-relaxed">
          TruthLens is an investigative diagnostic system designed to support forensic examiners. All indicators serve as explainable signals requiring analyst corroboration before presentation in legal proceedings.
        </p>
      </div>

      {/* ======================================================== */}
      {/* 4. LIGHTBOX / FULLSCREEN MEDIA MODAL */}
      {/* ======================================================== */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-950 border border-purple-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_60px_rgba(168,85,247,0.35)] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-purple-500/30 mb-4">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold uppercase">
                  {analysis.modality}
                </span>
                <span className="text-sm font-semibold text-white truncate max-w-md">
                  {analysis.image_name}
                </span>
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-xl border border-purple-500/40 bg-purple-950/80 text-purple-300 hover:text-white hover:bg-purple-900 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center w-full max-h-[65vh]">
              {analysis.modality === 'video' ? (
                <video src={currentMediaSrc} controls autoPlay className="max-h-[65vh] max-w-full rounded-2xl shadow-lg" />
              ) : analysis.modality === 'audio' ? (
                <div className="p-8 text-center space-y-4">
                  <Mic className="w-16 h-16 text-purple-400 mx-auto" />
                  <p className="text-white font-mono">{analysis.image_name}</p>
                  <audio controls src={currentMediaSrc} autoPlay className="w-full max-w-md" />
                </div>
              ) : (
                <img
                  src={currentMediaSrc}
                  alt={analysis.image_name}
                  className="max-h-[65vh] max-w-full object-contain rounded-2xl shadow-2xl"
                />
              )}
            </div>

            <div className="w-full flex items-center justify-between pt-3 border-t border-purple-500/30 mt-4 text-xs font-mono text-purple-300/70">
              <span>SHA-256: {analysis.image_hash.slice(0, 24)}...</span>
              <span>Dimensions: {analysis.metadata.dimensions.width}×{analysis.metadata.dimensions.height}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
