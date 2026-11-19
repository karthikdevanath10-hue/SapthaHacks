import React from 'react';
import { AudioDiagnostics } from '../types';
import { Mic, Volume2, Radio, Activity, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AudioViewerProps {
  audio: AudioDiagnostics;
}

export const AudioViewer: React.FC<AudioViewerProps> = ({ audio }) => {
  const isSuspicious = audio.unnatural_pause_detected || audio.spectral_cutoff_observed || audio.synthetic_prosody_score > 40;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Mic className="w-5 h-5 text-blue-600" />
          <span>Layer 2: Acoustic & Synthetic Voice Forensics</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Inspection of vocal prosody, respiratory micro-pauses, neural vocoder frequency roll-off, and cloned speaker timbre
        </p>
      </div>

      {/* Top 10-Second Summary Pill for Jury Presentation */}
      <div className={`p-4 rounded-xl border ${
        isSuspicious ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs`}>
        <div className="flex items-center space-x-3">
          {isSuspicious ? (
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          )}
          <div>
            <strong className="text-slate-900 text-sm block">
              {isSuspicious ? 'Acoustic Audio Displays Synthetic Voice Cloning Signatures' : 'Acoustic Harmonics & Vocal Cadence Verified Organic'}
            </strong>
            <span className="text-slate-700">
              {isSuspicious 
                ? 'Signal displays continuous un-paused speech or unnatural high-frequency vocoder cutoff.'
                : 'Recording displays natural human breathing micro-pauses and organic room acoustics.'}
            </span>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full font-bold text-xs self-start sm:self-auto border ${
          isSuspicious ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
        }`}>
          {isSuspicious ? 'NEEDS REVIEW' : 'PASSED'}
        </span>
      </div>

      {/* Visual Checklist for Presentation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans text-xs">
        <div className="glass-panel p-3.5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase font-mono block">Check 1: Breathing Pauses</span>
          <div className="flex items-center space-x-2">
            {audio.unnatural_pause_detected ? (
              <span className="text-rose-600 font-bold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" /> <span>No Natural Breaths</span>
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /> <span>Natural Human Pauses</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">AI voice generators often speak continuously without taking a breath.</p>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase font-mono block">Check 2: Frequency Spectrum</span>
          <div className="flex items-center space-x-2">
            {audio.spectral_cutoff_observed ? (
              <span className="text-amber-600 font-bold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" /> <span>Artificial Vocoder Cutoff</span>
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /> <span>Full Acoustic Bandwidth</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Neural voice models cut off frequencies abruptly above 12–16 kHz.</p>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase font-mono block">Check 3: Voice Clone Timbre</span>
          <div className="flex items-center space-x-2">
            {audio.synthetic_prosody_score > 40 ? (
              <span className="text-rose-600 font-bold flex items-center space-x-1">
                <ShieldAlert className="w-4 h-4" /> <span>Synthetic Voice Model</span>
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /> <span>Natural Inflection</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Gemini listens to emotion, throat resonance, and room acoustics.</p>
        </div>
      </div>

      {/* Grid of Audio Technical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        
        {/* Stream Properties */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Radio className="w-3 h-3 text-blue-600" />
            <span>Format & Sample Rate</span>
          </span>
          <p className="text-sm font-bold text-slate-900 font-sans">{audio.format} Audio</p>
          <p className="text-slate-600">{audio.sample_rate_hz.toLocaleString()} Hz ({audio.channels === 1 ? 'Mono' : 'Stereo'})</p>
          <p className="text-blue-600 font-semibold">{audio.bitrate_kbps ? `${audio.bitrate_kbps} kbps` : 'Standard Bitrate'}</p>
        </div>

        {/* Playback Duration */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Volume2 className="w-3 h-3 text-blue-600" />
            <span>Recording Length</span>
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900">{audio.duration_seconds}s</p>
          <p className="text-slate-500 text-[11px] font-sans">
            Speech-to-Pause: <strong className="text-blue-600">{Math.round(audio.speech_silence_ratio * 100)}%</strong>
          </p>
        </div>

        {/* Voice Synthesis Index */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Activity className="w-3 h-3 text-blue-600" />
            <span>Voice Synthesis Index</span>
          </span>
          <p className={`text-2xl font-bold font-mono ${audio.synthetic_prosody_score > 40 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {audio.synthetic_prosody_score} <span className="text-xs text-slate-400 font-normal">/100</span>
          </p>
          <p className="text-slate-500 text-[11px] font-sans">
            Neural text-to-speech probability
          </p>
        </div>

        {/* Spectral Cutoff Status */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-blue-600" />
            <span>Vocoder Spectral Cutoff</span>
          </span>
          {audio.spectral_cutoff_observed ? (
            <>
              <p className="text-sm font-bold text-amber-800 font-sans">Abrupt Roll-Off</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                Neural Resampling Marker
              </span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-emerald-700 font-sans">Continuous Spectrum</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                Natural Acoustic Decay
              </span>
            </>
          )}
        </div>

      </div>

      {/* Observations */}
      <div className="glass-panel p-4 rounded-xl border border-slate-200 text-xs space-y-2 shadow-xs">
        <h4 className="font-semibold text-slate-900">Acoustic Examiner Observations:</h4>
        <ul className="list-disc pl-5 text-slate-700 space-y-1">
          {audio.observations.map((obs, i) => (
            <li key={i}>{obs}</li>
          ))}
        </ul>
      </div>

    </div>
  );
};
