import React from 'react';
import { AIVisualResult } from '../types';
import { Sparkles, Sun, Eye, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AIVisionViewerProps {
  aiResult: AIVisualResult;
}

export const AIVisionViewer: React.FC<AIVisionViewerProps> = ({ aiResult }) => {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span>Layer 3: Gemini Multimodal AI Reasoning</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Multimodal optical coherence, lighting physics, and anatomical anomaly identification
        </p>
      </div>

      {/* AI Disclaimer Alert */}
      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start space-x-2.5 shadow-xs">
        <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-blue-950 font-bold">Explainable AI Safeguard: </strong> 
          {aiResult.ai_disclaimer} Gemini vision observations provide structural reasoning and context, strictly separated from mathematical binary checks.
        </p>
      </div>

      {/* Scene Understanding Card */}
      <div className="glass-panel p-5 rounded-xl border border-slate-200 space-y-3 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <span>Scene & Entity Decomposition</span>
        </h4>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          {aiResult.scene_description}
        </p>

        {aiResult.detected_entities.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs text-slate-500 font-mono self-center">Entities:</span>
            {aiResult.detected_entities.map((entity, i) => (
              <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                {entity}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Optical & Physical Consistency Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Lighting Physics */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Lighting & Shadow Directionality</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {aiResult.lighting_physics}
          </p>
        </div>

        {/* Anatomical / Geometric Consistency */}
        <div className="glass-panel p-5 rounded-xl border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Anatomical & Geometric Coherence</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {aiResult.anatomical_or_structural_consistency}
          </p>
        </div>

      </div>

      {/* Flagged Visual Anomalies or Synthesis Artifacts */}
      {(aiResult.visual_anomalies.length > 0 || aiResult.generation_artifacts_observed.length > 0) ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2 shadow-xs">
          <div className="flex items-center space-x-2 text-rose-700 font-bold">
            <AlertOctagon className="w-4 h-4" />
            <span>AI Flagged Visual Inconsistencies</span>
          </div>
          <ul className="list-disc pl-5 text-rose-800 space-y-1">
            {aiResult.visual_anomalies.map((anom, i) => (
              <li key={`anom-${i}`}>{anom}</li>
            ))}
            {aiResult.generation_artifacts_observed.map((art, i) => (
              <li key={`art-${i}`}>{art}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>No overt anatomical mutations, floating artifacts, or lighting reversals were detected by the multimodal vision model.</span>
        </div>
      )}

      {/* Confidence Rationale */}
      <div className="glass-panel p-4 rounded-xl border border-slate-200 text-xs space-y-1 shadow-xs">
        <span className="text-slate-500 font-mono uppercase text-[10px] block">Confidence & Calibration Note</span>
        <p className="text-slate-600 italic">{aiResult.confidence_rationale}</p>
      </div>

    </div>
  );
};
