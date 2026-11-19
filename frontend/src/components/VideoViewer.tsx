import React from 'react';
import { VideoDiagnostics } from '../types';
import { Video, ShieldAlert, CheckCircle, Clock, Film, Activity, AlertTriangle } from 'lucide-react';

interface VideoViewerProps {
  video: VideoDiagnostics;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ video }) => {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Video className="w-5 h-5 text-cyan-400" />
          <span>Layer 2: Video & Deepfake Temporal Forensics</span>
        </h3>
        <p className="text-xs text-slate-400">
          Extraction of temporal motion jitter, facial perimeter blending gradients, and inter-frame optical consistency
        </p>
      </div>

      {/* Grid of Video Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        
        {/* Stream Properties */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Film className="w-3 h-3 text-cyan-400" />
            <span>Container & Codec</span>
          </span>
          <p className="text-sm font-bold text-white font-sans">{video.codec} Video</p>
          <p className="text-slate-300">{video.resolution.width} × {video.resolution.height} px</p>
          <p className="text-cyan-400">{video.fps} FPS ({video.frame_count} frames)</p>
        </div>

        {/* Duration */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Playback Duration</span>
          </span>
          <p className="text-2xl font-bold font-mono text-white">{video.duration_seconds}s</p>
          <p className="text-slate-400 text-[11px] font-sans">
            {video.keyframes_analyzed} temporal keyframes sampled
          </p>
        </div>

        {/* Temporal Motion Jitter */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Temporal Jitter Score</span>
          </span>
          <p className="text-2xl font-bold font-mono text-cyan-300">{video.temporal_jitter_score}</p>
          <p className="text-slate-400 text-[11px] font-sans">
            Inter-frame motion standard deviation
          </p>
        </div>

        {/* Facial Perimeter Blending */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-cyan-400" />
            <span>Facial Mask Boundary</span>
          </span>
          {video.facial_boundary_anomaly ? (
            <>
              <p className="text-sm font-bold text-rose-400 font-sans">Anomalous Gradient</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                Face Blending Disparity
              </span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-emerald-400 font-sans">Normal Gradient</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                Consistent Facial Edge
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
            <span>Identified Deepfake Visual Artifacts</span>
          </div>
          <ul className="list-disc pl-5 text-rose-200 space-y-1">
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
