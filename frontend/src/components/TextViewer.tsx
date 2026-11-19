import React from 'react';
import { TextDiagnostics } from '../types';
import { FileText, AlignLeft, Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';

interface TextViewerProps {
  text: TextDiagnostics;
}

export const TextViewer: React.FC<TextViewerProps> = ({ text }) => {
  const isHighAI = text.ai_generation_likelihood === 'High Synthetic Probability';
  const isModerateAI = text.ai_generation_likelihood === 'Moderate Likelihood';
  const isFlagged = isHighAI || isModerateAI || (text.factuality_flags && text.factuality_flags.length > 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <span>Layer 2: Text Stylometry & Synthetic Narrative Forensics</span>
        </h3>
        <p className="text-xs text-slate-400">
          Inspection of syntactic sentence burstiness, lexical diversity, and Large Language Model (LLM) phrasing markers
        </p>
      </div>

      {/* Top 10-Second Summary Pill for Jury Presentation */}
      <div className={`p-4 rounded-xl border ${
        isFlagged ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
        <div className="flex items-center space-x-3">
          {isFlagged ? (
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          )}
          <div>
            <strong className="text-white text-sm block">
              {isHighAI ? 'Text Displays High Probability of Synthetic AI Generation' : isModerateAI ? 'Text Contains Formulaic Language Model Phrasing' : 'Organic Human Writing Style Verified'}
            </strong>
            <span className="text-slate-300">
              {isFlagged 
                ? 'Syntactic sentence lengths are abnormally flat or contain repeated AI transition tokens (e.g. "Furthermore", "In conclusion").'
                : 'Text exhibits natural sentence length variety and healthy vocabulary diversity.'}
            </span>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full font-bold text-xs self-start sm:self-auto border ${
          isHighAI ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : isModerateAI ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        }`}>
          {isHighAI ? 'AI GENERATED' : isModerateAI ? 'SUSPECT' : 'ORGANIC'}
        </span>
      </div>

      {/* Visual Checklist for Presentation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans text-xs">
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Check 1: Sentence Variety (Burstiness)</span>
          <div className="flex items-center space-x-2">
            {text.burstiness_score < 3.0 ? (
              <span className="text-rose-400 font-bold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" /> <span>Flat / Uniform Lengths</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /> <span>Organic Sentence Rhythm</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Humans mix short and long sentences; AI writes uniformly.</p>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Check 2: AI Word Choices</span>
          <div className="flex items-center space-x-2">
            {text.stylometric_markers && text.stylometric_markers.length > 0 ? (
              <span className="text-amber-400 font-bold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" /> <span>{text.stylometric_markers.length} AI Markers Detected</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /> <span>Natural Idioms</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Detects overused words like "delve", "moreover", "testament".</p>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Check 3: Factual Consistency</span>
          <div className="flex items-center space-x-2">
            {text.factuality_flags && text.factuality_flags.length > 0 ? (
              <span className="text-rose-400 font-bold flex items-center space-x-1">
                <ShieldAlert className="w-4 h-4" /> <span>Factual Discrepancies</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /> <span>Coherent Narrative</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Gemini checks for logical contradictions and hallucinated claims.</p>
        </div>
      </div>

      {/* Grid of Text Technical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        
        {/* Word & Sentence Count */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <BookOpen className="w-3 h-3 text-cyan-400" />
            <span>Volume & Structure</span>
          </span>
          <p className="text-2xl font-bold font-mono text-white">{text.word_count} <span className="text-xs text-slate-400 font-sans">words</span></p>
          <p className="text-slate-300 font-sans">{text.sentence_count} sentences parsed</p>
        </div>

        {/* Lexical Diversity (TTR) */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <AlignLeft className="w-3 h-3 text-cyan-400" />
            <span>Lexical Diversity (TTR)</span>
          </span>
          <p className="text-2xl font-bold font-mono text-cyan-400">{text.lexical_diversity_ttr}</p>
          <p className="text-slate-400 text-[11px] font-sans">
            Unique words / total words ratio
          </p>
        </div>

        {/* Syntactic Burstiness */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Sentence Burstiness (σ)</span>
          </span>
          <p className={`text-2xl font-bold font-mono ${text.burstiness_score < 3.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {text.burstiness_score}
          </p>
          <p className="text-slate-400 text-[11px] font-sans">
            Sentence length variation index
          </p>
        </div>

        {/* AI Generation Assessment */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-cyan-400" />
            <span>LLM Synthesis Assessment</span>
          </span>
          <p className={`text-sm font-bold font-sans ${isHighAI ? 'text-rose-400' : isModerateAI ? 'text-amber-400' : 'text-emerald-400'}`}>
            {text.ai_generation_likelihood}
          </p>
          <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${
            isHighAI ? 'bg-rose-950/80 border-rose-500/40 text-rose-300' : isModerateAI ? 'bg-amber-950/80 border-amber-500/40 text-amber-300' : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
          }`}>
            {isHighAI ? 'Neural Generation Traces' : isModerateAI ? 'Formulaic Elements' : 'Organic Human Prose'}
          </span>
        </div>

      </div>

      {/* Identified Stylometric Markers */}
      {text.stylometric_markers && text.stylometric_markers.length > 0 && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <h4 className="font-semibold text-cyan-400">Identified LLM Transition Markers & Repetition Patterns:</h4>
          <div className="flex flex-wrap gap-2">
            {text.stylometric_markers.map((marker, i) => (
              <span key={i} className="px-2.5 py-1 rounded-md bg-cyber-950 border border-slate-700 text-slate-300 font-mono">
                "{marker}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Examiner Observations */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs space-y-2">
        <h4 className="font-semibold text-slate-200">Text Stylometric Observations:</h4>
        <ul className="list-disc pl-5 text-slate-300 space-y-1">
          {text.observations.map((obs, i) => (
            <li key={i}>{obs}</li>
          ))}
        </ul>
      </div>

    </div>
  );
};
