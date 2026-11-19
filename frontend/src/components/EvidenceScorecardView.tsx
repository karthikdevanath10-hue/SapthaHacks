import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Info, HelpCircle, 
  Download, FileCheck, Layers, Sparkles, Binary, MessageSquare, ExternalLink
} from 'lucide-react';
import { FullAnalysisResponse, EvidenceItem } from '../types';
import { apiService } from '../services/api';

interface ScorecardProps {
  analysis: FullAnalysisResponse;
  onDownloadReport?: () => void;
}

export const EvidenceScorecardView: React.FC<ScorecardProps> = ({ analysis, onDownloadReport }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'suspicious':
      case 'high':
        return {
          bg: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
          dot: 'bg-rose-500',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        };
      case 'medium':
        return {
          bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          dot: 'bg-amber-400',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        };
      case 'low':
        return {
          bg: 'bg-sky-950/80 border-sky-500/50 text-sky-300',
          dot: 'bg-sky-400',
          icon: <Info className="w-3.5 h-3.5 text-sky-400" />
        };
      default:
        return {
          bg: 'bg-slate-800/80 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        };
    }
  };

  const getAssessmentTheme = (assessment: string) => {
    if (assessment.includes('Multiple suspicious')) {
      return {
        border: 'border-rose-500/40',
        bg: 'bg-gradient-to-br from-rose-950/40 via-cyber-900 to-cyber-950',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        barColor: 'from-amber-500 to-rose-600',
        textColor: 'text-rose-400',
        icon: <ShieldAlert className="w-7 h-7 text-rose-400" />
      };
    }
    if (assessment.includes('Some indicators')) {
      return {
        border: 'border-amber-500/40',
        bg: 'bg-gradient-to-br from-amber-950/40 via-cyber-900 to-cyber-950',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        barColor: 'from-cyan-500 to-amber-500',
        textColor: 'text-amber-400',
        icon: <AlertTriangle className="w-7 h-7 text-amber-400" />
      };
    }
    return {
      border: 'border-cyan-500/40',
      bg: 'bg-gradient-to-br from-cyan-950/40 via-cyber-900 to-cyber-950',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      barColor: 'from-blue-600 to-cyan-400',
      textColor: 'text-cyan-400',
      icon: <ShieldCheck className="w-7 h-7 text-cyan-400" />
    };
  };

  const filteredEvidence = analysis.evidence_scorecard.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'flagged') return item.severity === 'suspicious' || item.severity === 'medium';
    if (activeFilter === 'metadata') return item.layer.includes('Metadata');
    if (activeFilter === 'technical') return item.layer.includes('Technical');
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
    <div className="space-y-6">
      
      {/* Top Banner: Assessment & Indicator Score Summary */}
      <div className={`p-6 rounded-xl glass-panel border ${theme.border} ${theme.bg} shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">Forensic Evaluation</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${theme.badge}`}>
                {analysis.assessment}
              </span>
              <span className="text-xs text-slate-500 font-mono">Case #{analysis.investigation_id.slice(0, 8)}</span>
            </div>

            <div className="flex items-start space-x-3">
              <div className="mt-1 p-2 rounded-lg bg-cyber-900 border border-slate-700/60 shadow-inner">
                {theme.icon}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {analysis.image_name}
                </h2>
                <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            </div>

            {/* Hash & File Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400 pt-1">
              <span>SHA-256: <code className="text-cyan-300">{analysis.image_hash.slice(0, 16)}...</code></span>
              <span>Size: <span className="text-slate-200">{analysis.metadata.file_size_human}</span></span>
              <span>Dimensions: <span className="text-slate-200">{analysis.metadata.dimensions.width}×{analysis.metadata.dimensions.height}</span></span>
            </div>
          </div>

          {/* Indicator Score Metric Card */}
          <div className="bg-cyber-950/80 p-5 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-w-[220px] text-center shadow-lg">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Indicator Risk Score
            </span>
            <div className="relative flex items-center justify-center my-1">
              <span className={`text-4xl font-extrabold font-mono ${theme.textColor}`}>
                {analysis.indicator_score}
              </span>
              <span className="text-slate-500 font-mono text-sm ml-1">/100</span>
            </div>

            {/* Gauge progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden border border-slate-700">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${theme.barColor} transition-all duration-1000`}
                style={{ width: `${Math.max(analysis.indicator_score, 4)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              Aggregated anomaly index (NOT fake probability)
            </p>

            <button
              onClick={handleDownload}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scorecard Control Bar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-cyan-400" />
            <span>Multi-Layer Evidence Scorecard</span>
          </h3>
          <p className="text-xs text-slate-400">
            Traceable, explainable indicators categorized by scientific forensic layer
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 bg-cyber-900/80 p-1 rounded-lg border border-slate-800 text-xs">
          {[
            { id: 'all', label: `All (${analysis.evidence_scorecard.length})` },
            { id: 'flagged', label: 'Flagged Only' },
            { id: 'metadata', label: 'Metadata' },
            { id: 'technical', label: 'Technical' },
            { id: 'vision', label: 'AI Vision' },
            { id: 'caption', label: 'Caption Claim' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                activeFilter === f.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvidence.map((item) => {
          const badge = getSeverityBadge(item.severity);
          const isExpanded = expandedItem === item.id;

          return (
            <div 
              key={item.id}
              className={`rounded-xl glass-panel border p-5 transition-all duration-200 ${
                item.severity === 'suspicious' 
                  ? 'border-rose-500/30 bg-cyber-900/90' 
                  : item.severity === 'medium'
                  ? 'border-amber-500/30 bg-cyber-900/90'
                  : 'border-slate-800 hover:border-slate-700 bg-cyber-900/50'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-semibold">{item.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {item.layer}
                    </span>
                    <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
                      {badge.icon}
                      <span className="uppercase tracking-wide text-[10px]">{item.severity}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Confidence: <span className="text-slate-200">{item.confidence}</span>
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">
                    {item.title}
                  </h4>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>

                {/* Score impact indicator */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4 min-w-[120px]">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Score Impact</span>
                  <span className={`text-base font-mono font-bold ${item.score_impact > 15 ? 'text-rose-400' : item.score_impact > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    +{item.score_impact} pts
                  </span>
                  <button
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline-offset-4 hover:underline mt-1"
                  >
                    {isExpanded ? 'Hide Details' : 'Forensic Traceability'}
                  </button>
                </div>

              </div>

              {/* Forensic Traceability Callout (Why was this flagged?) */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                
                {/* Why Flagged */}
                <div className="bg-cyber-950/70 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Why was this flagged?</span>
                  </div>
                  <p className="text-slate-300 leading-normal">
                    {item.why_flagged}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono pt-1">
                    Source: <span className="text-cyan-300">{item.evidence_source}</span>
                  </p>
                </div>

                {/* Limitations & Uncertainty */}
                <div className="bg-cyber-950/70 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Scientific Limitations</span>
                  </div>
                  <p className="text-slate-300 leading-normal">
                    {item.limitations}
                  </p>
                </div>

              </div>

            </div>
          );
        })}

        {filteredEvidence.length === 0 && (
          <div className="p-8 text-center glass-panel rounded-xl text-slate-400">
            No evidence items match the selected filter category.
          </div>
        )}
      </div>

      {/* Limitations & Human Corroboration Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
          <Info className="w-4 h-4" />
          <span>Forensic Methodology Disclaimers & Traceability Notice</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          {analysis.limitations.map((limit, idx) => (
            <li key={idx}>{limit}</li>
          ))}
        </ul>
        <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800">
          DISCLAIMER: TruthLens findings do not constitute final legal proof of fraud. All indicators serve as investigative signals requiring analyst corroboration.
        </p>
      </div>

    </div>
  );
};
