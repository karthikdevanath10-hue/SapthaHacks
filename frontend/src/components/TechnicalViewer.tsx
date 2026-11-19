import React from 'react';
import { TechnicalResult } from '../types';
import { Activity, Layers, BarChart2, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';

interface TechnicalViewerProps {
  technical: TechnicalResult;
}

export const TechnicalViewer: React.FC<TechnicalViewerProps> = ({ technical }) => {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span>Layer 2: Technical & Pixel Forensics</span>
        </h3>
        <p className="text-xs text-slate-400">
          Mathematical measurement of high-frequency sensor noise, Error Level Analysis (ELA), and pixel distribution
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        
        {/* ELA Metric */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Error Level Analysis</span>
            {technical.ela_anomaly_detected ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-600 font-bold">ANOMALY</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-600 font-bold">NORMAL</span>
            )}
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-400">{technical.ela_mean_difference}</p>
          <p className="text-[11px] text-slate-400 font-sans">
            Compression residue variance (re-saved at 90% quality)
          </p>
        </div>

        {/* Noise Residual Variance */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Noise Residual</span>
            <span className="text-slate-500 text-[10px]">Spatial σ²</span>
          </div>
          <p className="text-2xl font-bold font-mono text-white">{technical.noise_variance}</p>
          <p className="text-[11px] text-slate-400 font-sans">
            High-pass sensor pattern noise proxy
          </p>
        </div>

        {/* Laplacian Edge Sharpness */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Edge Sharpness</span>
            <span className="text-slate-500 text-[10px]">Laplacian</span>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">{technical.laplacian_variance_blur}</p>
          <p className="text-[11px] text-slate-400 font-sans">
            Focus and high-frequency structural gradient score
          </p>
        </div>

        {/* Contrast & Dynamic Range */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Dynamic Range</span>
            <span className="text-slate-500 text-[10px]">Std Dev</span>
          </div>
          <p className="text-2xl font-bold font-mono text-sky-400">{technical.contrast_std}</p>
          <p className="text-[11px] text-slate-400 font-sans">
            Luminance standard deviation (Mean: {technical.brightness_mean})
          </p>
        </div>

      </div>

      {/* Color Balance & Channel Histogram */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span>Color Channel Distribution (Mean Intensity / 255)</span>
        </h4>
        
        <div className="space-y-2 font-mono text-xs">
          {/* Red */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Red Channel (R)</span>
              <span className="text-rose-400 font-bold">{technical.color_channel_balance.red_mean}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${(technical.color_channel_balance.red_mean / 255) * 100}%` }}
              />
            </div>
          </div>

          {/* Green */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Green Channel (G)</span>
              <span className="text-emerald-400 font-bold">{technical.color_channel_balance.green_mean}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${(technical.color_channel_balance.green_mean / 255) * 100}%` }}
              />
            </div>
          </div>

          {/* Blue */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Blue Channel (B)</span>
              <span className="text-blue-400 font-bold">{technical.color_channel_balance.blue_mean}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${(technical.color_channel_balance.blue_mean / 255) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs space-y-2">
        <h4 className="font-semibold text-slate-200">Technical Diagnostic Observations:</h4>
        <ul className="list-disc pl-5 text-slate-300 space-y-1">
          {technical.observations.map((obs, i) => (
            <li key={i}>{obs}</li>
          ))}
        </ul>
      </div>

    </div>
  );
};
