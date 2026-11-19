import React from 'react';
import { CaptionComparisonResult } from '../types';
import { MessageSquare, AlertTriangle, CheckCircle, HelpCircle, FileQuestion } from 'lucide-react';

interface CaptionCrossVerifierProps {
  captionResult: CaptionComparisonResult;
}

export const CaptionCrossVerifier: React.FC<CaptionCrossVerifierProps> = ({ captionResult }) => {
  if (!captionResult.caption_provided) {
    return (
      <div className="glass-panel p-8 rounded-xl border border-slate-800 text-center space-y-3">
        <FileQuestion className="w-10 h-10 text-slate-500 mx-auto" />
        <h4 className="text-base font-bold text-slate-300">No Associated Caption or Claim Provided</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          To perform Layer 4 Cross-Verification, upload media along with a headline, tweet caption, or claimed event context.
        </p>
      </div>
    );
  }

  const isContradictory = captionResult.consistency_verdict === 'Mismatched / Contradictory';
  const isPartial = captionResult.consistency_verdict === 'Partially Inconsistent';

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <span>Layer 4: Image & Claim Cross-Verification</span>
        </h3>
        <p className="text-xs text-slate-400">
          Cross-modal comparison between claimed textual narrative and observable visual ground-truth
        </p>
      </div>

      {/* Claim Display & Verdict */}
      <div className={`glass-panel p-5 rounded-xl border ${
        isContradictory 
          ? 'border-rose-500/40 bg-rose-950/20' 
          : isPartial 
          ? 'border-amber-500/40 bg-amber-950/20' 
          : 'border-emerald-500/40 bg-emerald-950/20'
      } space-y-4`}>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Submitted Claim / Narrative
          </span>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
              isContradictory 
                ? 'bg-rose-900/60 text-rose-300 border-rose-500/50' 
                : isPartial
                ? 'bg-amber-900/60 text-amber-300 border-amber-500/50'
                : 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50'
            }`}>
              {isContradictory ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              <span>{captionResult.consistency_verdict}</span>
            </span>
          </div>
        </div>

        {/* Claim text quote */}
        <blockquote className="border-l-4 border-cyan-400 pl-4 py-1 italic text-slate-200 text-sm bg-cyber-950/60 rounded-r-lg">
          "{captionResult.caption_text}"
        </blockquote>

        {captionResult.source_context && (
          <p className="text-xs text-slate-400 font-mono">
            Reported Context / Source: <span className="text-slate-300">{captionResult.source_context}</span>
          </p>
        )}

        {/* Semantic Match Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Semantic Alignment Index</span>
            <span className="font-bold text-cyan-400">{Math.round(captionResult.semantic_match_score * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                isContradictory ? 'bg-rose-500' : isPartial ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(captionResult.semantic_match_score * 100, 5)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Forensic Reasoning Explanation */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Cross-Modal Discrepancy Breakdown</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          {captionResult.explanation}
        </p>

        {captionResult.discrepancy_details.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-rose-400">Specific Narrative Conflicts:</span>
            <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
              {captionResult.discrepancy_details.map((detail, idx) => (
                <li key={idx}>{detail}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Forensic Fact-Checking Note */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
        <strong className="text-slate-300">Crucial Investigative Principle:</strong>
        <p>
          A contradictory claim indicates <em>miscontextualization or false attribution</em> (e.g., an authentic 2018 photo falsely captioned as breaking 2026 conflict news). It does NOT imply the underlying camera pixels are AI-generated.
        </p>
      </div>

    </div>
  );
};
