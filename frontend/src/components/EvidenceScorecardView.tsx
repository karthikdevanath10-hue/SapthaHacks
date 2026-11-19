import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Info, HelpCircle, 
  Download, FileCheck, Layers, Sparkles, CheckCircle2, ChevronDown, ChevronUp,
  Camera, Cpu, MessageSquare, Video, Mic, FileText, ArrowRight
} from 'lucide-react';
import { FullAnalysisResponse, EvidenceItem } from '../types';
import { apiService } from '../services/api';

interface ScorecardProps {
  analysis: FullAnalysisResponse;
  onDownloadReport?: () => void;
}

export const EvidenceScorecardView: React.FC<ScorecardProps> = ({ analysis, onDownloadReport }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Human-friendly title and takeaway translator
  const getFriendlyPresentation = (item: EvidenceItem) => {
    const id = item.id.toUpperCase();
    const title = item.title.toLowerCase();

    if (id.includes('META-04') || title.includes('stripped') || title.includes('absent hardware')) {
      return {
        badge: 'Social Media Notice',
        simpleTitle: 'Camera Info Was Removed (Standard on Social Media)',
        takeaway: 'No physical camera details (make/model) were found. This happens automatically whenever an image is uploaded to WhatsApp, Instagram, or Twitter.',
        statusIcon: <Info className="w-5 h-5 text-sky-600" />,
        statusColor: 'text-sky-700',
        borderColor: 'border-sky-200',
        bgGradient: 'from-sky-50/70 to-white',
        verdictLabel: 'BENIGN NOTE',
        verdictClass: 'bg-sky-50 text-sky-700 border-sky-200'
      };
    }
    if (id.includes('TECH-04') || title.includes('consistent compression')) {
      return {
        badge: 'Pixel Integrity Clean',
        simpleTitle: 'Even Image Quality Across All Pixels (No Splicing)',
        takeaway: 'Error Level Analysis (ELA) shows the entire image degraded uniformly. No cut-and-paste or spliced objects from other photos were detected.',
        statusIcon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
        statusColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        bgGradient: 'from-emerald-50/70 to-white',
        verdictLabel: 'PASSED',
        verdictClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (title.includes('ai synthesis software') || id.includes('META-01')) {
      return {
        badge: 'AI Generator Tag',
        simpleTitle: 'AI Software Stamp Detected in File Headers',
        takeaway: 'The file directly contains embedded parameters from a known generative AI tool (e.g. Midjourney, Stable Diffusion, or ComfyUI).',
        statusIcon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
        statusColor: 'text-rose-700',
        borderColor: 'border-rose-200',
        bgGradient: 'from-rose-50/70 to-white',
        verdictLabel: 'FLAGGED',
        verdictClass: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    if (title.includes('noise discontinuity') || title.includes('sensor noise')) {
      return {
        badge: 'Pixel Noise Inconsistency',
        simpleTitle: 'Unnatural Sensor Noise Variation in Sectors',
        takeaway: 'Different parts of the image have conflicting noise grain, suggesting multiple images may have been merged together.',
        statusIcon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        statusColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        bgGradient: 'from-amber-50/70 to-white',
        verdictLabel: 'WARNING',
        verdictClass: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    if (title.includes('discordance') || title.includes('mismatch')) {
      return {
        badge: 'Claim Mismatch',
        simpleTitle: 'Caption Does Not Match What Is Visible (Out-of-Context Media)',
        takeaway: 'The photo itself may be a genuine photo, but the text/caption makes false claims that directly contradict the picture.',
        statusIcon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        statusColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        bgGradient: 'from-amber-50/70 to-white',
        verdictLabel: 'MISMATCH',
        verdictClass: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }

    // Default Fallbacks
    if (item.severity === 'suspicious') {
      return {
        badge: 'Suspicious Anomaly',
        simpleTitle: item.title,
        takeaway: item.explanation,
        statusIcon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
        statusColor: 'text-rose-700',
        borderColor: 'border-rose-200',
        bgGradient: 'from-rose-50/70 to-white',
        verdictLabel: 'FLAGGED',
        verdictClass: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    if (item.severity === 'medium') {
      return {
        badge: 'Needs Review',
        simpleTitle: item.title,
        takeaway: item.explanation,
        statusIcon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        statusColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        bgGradient: 'from-amber-50/70 to-white',
        verdictLabel: 'REVIEW',
        verdictClass: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    return {
      badge: 'Verified Normal',
      simpleTitle: item.title,
      takeaway: item.explanation,
      statusIcon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      statusColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      bgGradient: 'from-emerald-50/70 to-white',
      verdictLabel: 'NORMAL',
      verdictClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  };

  const getAssessmentTheme = (assessment: string) => {
    if (assessment.includes('Multiple suspicious')) {
      return {
        border: 'border-rose-200',
        bg: 'bg-gradient-to-br from-rose-50/80 via-white to-white',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        barColor: 'from-amber-500 to-rose-600',
        textColor: 'text-rose-600',
        statusText: 'Multiple Suspicious Indicators Detected',
        quickVerdict: 'High probability of synthetic manipulation or heavy editing.',
        icon: <ShieldAlert className="w-8 h-8 text-rose-600" />
      };
    }
    if (assessment.includes('Some indicators')) {
      return {
        border: 'border-amber-200',
        bg: 'bg-gradient-to-br from-amber-50/80 via-white to-white',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        barColor: 'from-blue-500 to-amber-500',
        textColor: 'text-amber-600',
        statusText: 'Some Indicators Require Attention',
        quickVerdict: 'Media has edits or missing data, but is not conclusively synthetic.',
        icon: <AlertTriangle className="w-8 h-8 text-amber-600" />
      };
    }
    return {
      border: 'border-emerald-200',
      bg: 'bg-gradient-to-br from-emerald-50/80 via-white to-white',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'from-blue-500 to-emerald-500',
      textColor: 'text-emerald-600',
      statusText: 'No Major Suspicious Indicators Detected',
      quickVerdict: 'Visuals and pixel structures align with authentic camera captures.',
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />
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
    <div className="space-y-8">
      
      {/* ======================================================== */}
      {/* 1. TOP HERO: EASY 10-SECOND VERDICT (FOR PRESENTING TO JURY) */}
      {/* ======================================================== */}
      <div className={`p-6 sm:p-8 rounded-2xl glass-panel border ${theme.border} ${theme.bg} shadow-sm relative overflow-hidden`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wider uppercase ${theme.badge}`}>
                {theme.statusText}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Modality: <strong className="text-slate-900 uppercase">{analysis.modality}</strong>
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Case #{analysis.investigation_id.slice(0, 8)}
              </span>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
                {theme.icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {analysis.image_name}
                </h2>
                <p className="text-sm sm:text-base font-semibold text-slate-700">
                  {theme.quickVerdict}
                </p>
              </div>
            </div>

            {/* Executive Forensic Briefing */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 max-w-3xl">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Forensic Briefing:</span>
              </span>
              <p className="text-slate-700 leading-relaxed font-sans">
                "{analysis.summary}"
              </p>
            </div>

            {/* File Details Bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono text-slate-500 pt-1">
              <span>SHA-256: <code className="text-blue-600 font-semibold">{analysis.image_hash.slice(0, 16)}...</code></span>
              <span>Size: <strong className="text-slate-800">{analysis.metadata.file_size_human}</strong></span>
              <span>Dimensions: <strong className="text-slate-800">{analysis.metadata.dimensions.width}×{analysis.metadata.dimensions.height}</strong></span>
            </div>
          </div>

          {/* Anomaly Gauge & PDF Export Button */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-w-[240px] text-center shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">
              Suspicious Indicator Score
            </span>
            
            <div className="flex items-baseline space-x-1 my-1">
              <span className={`text-5xl font-extrabold font-mono ${theme.textColor}`}>
                {analysis.indicator_score}
              </span>
              <span className="text-slate-400 font-mono text-base font-semibold">/100</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 my-2 overflow-hidden border border-slate-200">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${theme.barColor} transition-all duration-1000`}
                style={{ width: `${Math.max(analysis.indicator_score, 6)}%` }}
              />
            </div>
            
            <span className="text-[11px] font-medium text-slate-500 italic">
              {analysis.indicator_score > 50 ? 'High Anomaly Signals' : analysis.indicator_score > 20 ? 'Moderate Anomaly Signals' : 'Clean & Natural Signals'}
            </span>

            <button
              onClick={handleDownload}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-sm shadow-blue-500/20 cursor-pointer"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <span>Evidence Scorecard (Scientific Traceability)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Each finding broken down into simple terms with verifiable technical proofs
          </p>
        </div>

        {/* Corporate Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
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
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SIMPLIFIED, HUMAN-FRIENDLY EVIDENCE CARDS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvidence.map((item) => {
          const presentation = getFriendlyPresentation(item);
          const isExpanded = Boolean(expandedItems[item.id]);

          return (
            <div 
              key={item.id}
              className={`rounded-2xl glass-panel border p-5 sm:p-6 transition-all duration-300 ${presentation.borderColor} bg-gradient-to-r ${presentation.bgGradient} shadow-sm hover:shadow-md`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* Main Content */}
                <div className="space-y-2 flex-1">
                  
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${presentation.verdictClass}`}>
                      {presentation.verdictLabel}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 font-mono shadow-xs">
                      {item.layer}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Confidence: <strong className="text-slate-800">{item.confidence}</strong>
                    </span>
                  </div>

                  {/* Clean, Human-Friendly Title */}
                  <div className="flex items-start space-x-3 pt-1">
                    <div className="mt-0.5">
                      {presentation.statusIcon}
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {presentation.simpleTitle}
                      </h4>
                      {/* 1-Sentence Plain-English Takeaway */}
                      <p className="text-sm text-slate-600 leading-relaxed mt-1">
                        {presentation.takeaway}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Impact Points & Dropdown Toggle */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5 min-w-[130px]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Score Impact</span>
                  <span className={`text-xl font-mono font-extrabold ${item.score_impact > 15 ? 'text-rose-600' : item.score_impact > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    +{item.score_impact} pts
                  </span>

                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="mt-2 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Proof' : 'View Proof'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

              </div>

              {/* ======================================================== */}
              {/* COLLAPSIBLE DEEP TECHNICAL PROOF (FOR SKEPTICAL JUDGES) */}
              {/* ======================================================== */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-fadeIn">
                  
                  {/* Why Flagged */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center space-x-1.5 text-blue-600 font-bold">
                      <HelpCircle className="w-4 h-4" />
                      <span>Scientific Forensic Cause:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-sans">
                      {item.why_flagged}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono pt-1">
                      Evidence Source: <span className="text-blue-700 font-semibold">{item.evidence_source}</span>
                    </p>
                  </div>

                  {/* Scientific Limitations */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center space-x-1.5 text-amber-600 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Important Limitation:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-sans">
                      {item.limitations}
                    </p>
                    <p className="text-[10px] text-slate-500 italic pt-1">
                      * Automated indicators assist human investigators; they do not replace formal chain-of-custody verification.
                    </p>
                  </div>

                </div>
              )}

            </div>
          );
        })}

        {filteredEvidence.length === 0 && (
          <div className="p-8 text-center glass-panel rounded-2xl text-slate-500 border border-slate-200">
            No findings match the selected filter category.
          </div>
        )}
      </div>

      {/* Methodology & Ethical Disclaimer */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2 shadow-sm">
        <div className="flex items-center space-x-2 text-blue-600 font-bold uppercase tracking-wider text-[11px]">
          <Info className="w-4 h-4" />
          <span>Judicial & Forensic Methodology Notice</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          TruthLens is an investigative diagnostic system designed to support forensic examiners. All indicators serve as explainable signals requiring analyst corroboration before presentation in legal proceedings.
        </p>
      </div>

    </div>
  );
};
