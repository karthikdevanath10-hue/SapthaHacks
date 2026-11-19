import React, { useState } from 'react';
import { MetadataResult } from '../types';
import { Camera, FileText, Hash, ShieldAlert, Cpu, Calendar, Globe, Code } from 'lucide-react';

interface MetadataViewerProps {
  metadata: MetadataResult;
}

export const MetadataViewer: React.FC<MetadataViewerProps> = ({ metadata }) => {
  const [showRawTags, setShowRawTags] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>Layer 1: Metadata & Provenance Diagnostics</span>
          </h3>
          <p className="text-xs text-slate-400">
            Extraction and inspection of binary file headers, EXIF structures, and editing tool signatures
          </p>
        </div>

        <button
          onClick={() => setShowRawTags(!showRawTags)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-cyber-900 text-slate-300 hover:text-white hover:border-cyan-500/50 transition flex items-center space-x-1.5"
        >
          <Code className="w-3.5 h-3.5 text-cyan-400" />
          <span>{showRawTags ? 'Hide Raw EXIF' : 'View Raw EXIF'}</span>
        </button>
      </div>

      {/* Grid of Core Metadata Properties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        
        {/* File Format & Size */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <FileText className="w-3 h-3 text-cyan-400" />
            <span>File Attributes</span>
          </span>
          <p className="text-sm font-bold text-white font-sans">{metadata.format} ({metadata.color_mode})</p>
          <p className="text-slate-300">{metadata.file_size_human} ({metadata.file_size_bytes.toLocaleString()} bytes)</p>
          <p className="text-cyan-400">{metadata.dimensions.width} × {metadata.dimensions.height} px ({metadata.dimensions.aspect_ratio})</p>
        </div>

        {/* Camera Hardware */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>Camera Hardware</span>
          </span>
          {metadata.camera_make || metadata.camera_model ? (
            <>
              <p className="text-sm font-bold text-emerald-400 font-sans">{metadata.camera_make || 'Unknown Make'}</p>
              <p className="text-slate-200">{metadata.camera_model || 'Unknown Model'}</p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                Hardware Tag Detected
              </span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-amber-400 font-sans">No Hardware EXIF</p>
              <p className="text-slate-400">Stripped or synthetic origin</p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300">
                Metadata Stripped
              </span>
            </>
          )}
        </div>

        {/* Software Signature */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Code className="w-3 h-3 text-cyan-400" />
            <span>Software Signature</span>
          </span>
          {metadata.software_signature ? (
            <>
              <p className="text-sm font-bold text-cyan-300 font-sans truncate">{metadata.software_signature}</p>
              <p className="text-slate-400 text-[11px]">Identified in file headers</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-400 font-sans">None Registered</p>
              <p className="text-slate-500 text-[11px]">No editing tool tag found</p>
            </>
          )}
        </div>

        {/* Timestamp & Integrity Hash */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>Recorded Timestamp</span>
          </span>
          <p className="text-sm font-bold text-slate-200 font-sans">
            {metadata.creation_datetime || 'Not Available'}
          </p>
          <div className="pt-1">
            <span className="text-[10px] text-slate-400 block">SHA-256 Checksum:</span>
            <code className="text-[10px] text-cyan-300 truncate block">{metadata.sha256_hash.slice(0, 20)}...</code>
          </div>
        </div>

      </div>

      {/* Suspicious Indicators / Observations Banner */}
      {metadata.suspicious_indicators.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 text-rose-400 font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Suspicious Metadata Indicators Identified</span>
          </div>
          <ul className="list-disc pl-5 text-rose-200 space-y-1">
            {metadata.suspicious_indicators.map((ind, i) => (
              <li key={i}>{ind}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Observations */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs space-y-2">
        <h4 className="font-semibold text-slate-200">Examiner Observations:</h4>
        <ul className="list-disc pl-5 text-slate-300 space-y-1">
          {metadata.observations.map((obs, i) => (
            <li key={i}>{obs}</li>
          ))}
        </ul>
      </div>

      {/* Raw EXIF Tags Modal/Accordion */}
      {showRawTags && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
          <h4 className="font-bold text-cyan-400 text-sm">Raw EXIF Tag Dump ({Object.keys(metadata.raw_exif_tags).length} tags found)</h4>
          {Object.keys(metadata.raw_exif_tags).length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
              {Object.entries(metadata.raw_exif_tags).map(([k, v]) => (
                <div key={k} className="flex items-start justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-semibold">{k}</span>
                  <span className="text-slate-200 max-w-md truncate text-right">{String(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic">No embedded EXIF tags exist in this file structure.</p>
          )}
        </div>
      )}
    </div>
  );
};
