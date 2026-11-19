import React from 'react';
import { VideoDiagnostics } from '../types';
import { Video, ShieldAlert, CheckCircle, Clock, Film, Activity, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface VideoViewerProps {
  video: VideoDiagnostics;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ video }) => {
  const isSuspicious = video.facial_boundary_anomaly || (video.deepfake_visual_cues && video.deepfake_visual_cues.length > 0) || video.temporal_jitter_score > 20;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Video className="w-5 h-5 text-cyan-400" />
          <span>Layer 2: Video & Deepfake Temporal Forensics</span>
        </h3>
        <p className="text-xs text-slate-400">
          Inspection of temporal frame consistency, facial boundary blending, and deepfake synthesis artifacts
        </p>
      </div>

      {/* Top 10-Second Summary Pill for Jury Presentation */}
      <div className={`p-4 rounded-xl border ${
        isSuspicious ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
        <div className="flex items-center space-x-3">
          {isSuspicious ? (
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          )}
          <div>
            <strong className="text-white text-sm block">
              {isSuspicious ? 'Video Contains Flagged Temporal Anomaly Signals' : 'Temporal Trajectory & Facial Consistency Verified'}
            </strong>
            <span className="text-slate-300">
              {isSuspicious 
                ? 'Frame-by-frame analysis detected anomalous motion jitter or edge sharpness disparity at the facial boundary.'
                : 'Sampled keyframes transition smoothly without face-swapping mask lines or artificial jitter.'}
            </span>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full font-bold text-xs self-start sm:self-auto border ${
          isSuspicious ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        }`}>
          {isSuspicious ? 'NEEDS REVIEW' : 'PASSED'}
        </span>
      </div>

      {/* Visual Checklist for Presentation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans text-xs">
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Check 1: Face Boundary</span>
          <div className="flex items-center space-x-2">
            {video.facial_boundary_anomaly ? (
              <span className="text-rose-400 font-bold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" /> <span>Boundary Blurring Disparity</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /> <span>Clean Natural Contours</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Verifies face wasn't pasted onto another body.</p>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Check 2: Motion Jitter</span>
          <div className="flex items-center space-x-2">
            {video.temporal_jitter_score > 20 ? (
              <span className="text-amber-400 font-bold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" /> <span>Elevated Inter-Frame Jitter</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /> <span>Smooth Temporal Flow</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Deepfakes flicker between frames; genuine videos flow smoothly.</p>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Check 3: AI Keyframe Logic</span>
          <div className="flex items-center space-x-2">
            {video.deepfake_visual_cues && video.deepfake_visual_cues.length > 0 ? (
              <span className="text-rose-400 font-bold flex items-center space-x-1">
                <ShieldAlert className="w-4 h-4" /> <span>Morphing Artifacts Flagged</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /> <span>Coherent Physics & Lighting</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Gemini inspects keyframes for warping, teeth, and blinking.</p>
        </div>
      </div>

      {/* Grid of Video Technical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        
        {/* Stream Properties */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Film className="w-3 h-3 text-cyan-400" />
            <span>Container & Codec</span>
          </span>
          <p className="text-sm font-bold text-white font-sans">{video.codec} Stream</p>
          <p className="text-slate-300">{video.resolution.width} × {video.resolution.height} px</p>
          <p className="text-cyan-400">{video.fps} FPS ({video.frame_count} frames)</p>
        </div>

        {/* Playback Duration */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Video Duration</span>
          </span>
          <p className="text-2xl font-bold font-mono text-white">{video.duration_seconds}s</p>
          <p className="text-slate-400 text-[11px] font-sans">
            {video.keyframes_analyzed} temporal frames inspected
          </p>
        </div>

        {/* Temporal Motion Jitter */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Motion Jitter Score</span>
          </span>
          <p className={`text-2xl font-bold font-mono ${video.temporal_jitter_score > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {video.temporal_jitter_score}
          </p>
          <p className="text-slate-400 text-[11px] font-sans">
            Optical flow variance across frames
          </p>
        </div>

        {/* Facial Perimeter Blending */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-cyan-400" />
            <span>Face Mask Edge Ratio</span>
          </span>
          {video.facial_boundary_anomaly ? (
            <>
              <p className="text-sm font-bold text-rose-400 font-sans">Disparity Flagged</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                Face Blending Edge
              </span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-emerald-400 font-sans">Normal Gradient</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                Natural Contours
              </span>
            </>
          )}
        </div>

      </div>

      {/* Flagged Visual Deepfake Cues */}
      {video.deepfake_visual_cues && video.deepfake_visual_cues.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Identified Deepfake Visual Artifacts:</span>
          </div>
          <ul className="list-disc pl-5 text-rose-200 space-y-1 font-sans">
            {video.deepfake_visual_cues.map((cue, idx) => (
              <li key={idx}>{cue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Examiner Observations */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs space-y-2">
        <h4 className="font-semibold text-slate-200">Video Forensic Observations:</h4>
        <ul className="list-disc pl-5 text-slate-300 space-y-1">
          {video.observations.map((obs, i) => (
            <li key={i}>{obs}</li>
          ))}
        </ul>
      </div>

    </div>
  );
};
