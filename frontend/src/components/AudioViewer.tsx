import React from 'react';
import { AudioDiagnostics } from '../types';
import { Mic, Volume2, Radio, Activity, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface AudioViewerProps {
  audio: AudioDiagnostics;
}

export const AudioViewer: React.FC<AudioViewerProps> = ({ audio }) => {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Mic className="w-5 h-5 text-cyan-400" />
          <span>Layer 2: Acoustic & Synthetic Voice Forensics</span>
        </h3>
        <p className="text-xs text-slate-400">
          Analysis of vocal prosody, respiratory pause frequency, neural vocoder spectral roll-off, and cloned speaker timbre
        </p>
      </div>

      {/* Grid of Audio Properties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        
        {/* Stream Properties */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>Format & Sample Rate</span>
          </span>
          <p className="text-sm font-bold text-white font-sans">{audio.format} Audio</p>
          <p className="text-slate-300">{audio.sample_rate_hz.toLocaleString()} Hz ({audio.channels === 1 ? 'Mono' : 'Stereo'})</p>
          <p className="text-cyan-400">{audio.bitrate_kbps ? `${audio.bitrate_kbps} kbps` : 'Standard Bitrate'}</p>
        </div>

        {/* Duration */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Volume2 className="w-3 h-3 text-cyan-400" />
            <span>Recording Length</span>
          </span>
          <p className="text-2xl font-bold font-mono text-white">{audio.duration_seconds}s</p>
          <p className="text-slate-400 text-[11px] font-sans">
            Speech-to-Pause: <strong className="text-cyan-300">{Math.round(audio.speech_silence_ratio * 100)}%</strong>
          </p>
        </div>

        {/* Voice Synthesis Index */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Voice Synthesis Index</span>
          </span>
          <p className={`text-2xl font-bold font-mono ${audio.synthetic_prosody_score > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {audio.synthetic_prosody_score} <span className="text-xs text-slate-500 font-normal">/100</span>
          </p>
          <p className="text-slate-400 text-[11px] font-sans">
            Neural text-to-speech probability
          </p>
        </div>

        {/* Spectral Cutoff Status */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-cyan-400" />
            <span>Vocoder Spectral Cutoff</span>
          </span>
          {audio.spectral_cutoff_observed ? (
            <>
              <p className="text-sm font-bold text-amber-400 font-sans">Abrupt Roll-Off</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                Neural Resampling Marker
              </span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-emerald-400 font-sans">Continuous Spectrum</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                Natural Acoustic Decay
              </span>
            </>
          )}
        </div>

      </div>

      {/* Unnatural Pauses / Respiratory Alert */}
      {audio.unnatural_pause_detected && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Acoustic Cadence Anomaly Flagged</span>
          </div>
          <p className="text-amber-200">
            Audio exhibits continuous speech envelope without physiological human breathing intervals (micro-pauses). This is a frequent signature of concatenated synthetic neural speech.
          </p>
        </div>
      )}

      {/* Observations */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs space-y-2">
        <h4 className="font-semibold text-slate-200">Acoustic Examiner Observations:</h4>
        <ul className="list-disc pl-5 text-slate-300 space-y-1">
          {audio.observations.map((obs, i) => (
            <li key={i}>{obs}</li>
          ))}
        </ul>
      </div>

    </div>
  );
};
