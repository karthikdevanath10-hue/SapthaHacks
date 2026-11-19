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
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span>Layer 1: Metadata & Provenance Diagnostics</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Extraction and inspection of binary file headers, EXIF structures, and editing tool signatures
          </p>
        </div>

        <button
          onClick={() => setShowRawTags(!showRawTags)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition flex items-center space-x-1.5 cursor-pointer font-medium"
        >
          <Code className="w-3.5 h-3.5 text-blue-600" />
          <span>{showRawTags ? 'Hide Raw EXIF' : 'View Raw EXIF'}</span>
        </button>
      </div>

      {/* Grid of Core Metadata Properties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        
        {/* File Format & Size */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <FileText className="w-3 h-3 text-blue-600" />
            <span>File Attributes</span>
          </span>
          <p className="text-sm font-bold text-slate-900 font-sans">{metadata.format} ({metadata.color_mode})</p>
          <p className="text-slate-600">{metadata.file_size_human} ({metadata.file_size_bytes.toLocaleString()} bytes)</p>
          <p className="text-blue-600 font-semibold">{metadata.dimensions.width} × {metadata.dimensions.height} px ({metadata.dimensions.aspect_ratio})</p>
        </div>

        {/* Camera Hardware */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-blue-600" />
            <span>Camera Hardware</span>
          </span>
          {metadata.camera_make || metadata.camera_model ? (
            <>
              <p className="text-sm font-bold text-emerald-700 font-sans">{metadata.camera_make || 'Unknown Make'}</p>
              <p className="text-slate-700">{metadata.camera_model || 'Unknown Model'}</p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                Hardware Tag Detected
              </span>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-amber-800 font-sans">No Hardware EXIF</p>
              <p className="text-slate-500">Stripped or synthetic origin</p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                Metadata Stripped
              </span>
            </>
          )}
        </div>

        {/* Software Signature */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Code className="w-3 h-3 text-blue-600" />
            <span>Software Signature</span>
          </span>
          {metadata.software_signature ? (
            <>
              <p className="text-sm font-bold text-blue-700 font-sans truncate">{metadata.software_signature}</p>
              <p className="text-slate-500 text-[11px]">Identified in file headers</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-700 font-sans">None Registered</p>
              <p className="text-slate-500 text-[11px]">No editing tool tag found</p>
            </>
          )}
        </div>

        {/* Timestamp & Integrity Hash */}
        <div className="glass-panel p-4 rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span>Recorded Timestamp</span>
          </span>
          <p className="text-sm font-bold text-slate-800 font-sans">
            {metadata.creation_datetime || 'Not Available'}
          </p>
          <div className="pt-1">
            <span className="text-[10px] text-slate-500 block">SHA-256 Checksum:</span>
            <code className="text-[10px] text-blue-600 font-semibold truncate block">{metadata.sha256_hash.slice(0, 20)}...</code>
          </div>
        </div>

      </div>

      {/* Suspicious Indicators / Observations Banner */}
      {metadata.suspicious_indicators.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1.5 shadow-xs">
          <div className="flex items-center space-x-2 text-rose-700 font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Suspicious Metadata Indicators Identified</span>
          </div>
          <ul className="list-disc pl-5 text-rose-800 space-y-1">
            {metadata.suspicious_indicators.map((ind, i) => (
              <li key={i}>{ind}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Observations */}
      <div className="glass-panel p-4 rounded-xl border border-slate-200 text-xs space-y-2 shadow-xs">
        <h4 className="font-semibold text-slate-900">Examiner Observations:</h4>
        <ul className="list-disc pl-5 text-slate-700 space-y-1">
          {metadata.observations.map((obs, i) => (
            <li key={i}>{obs}</li>
          ))}
        </ul>
      </div>

      {/* Raw EXIF Tags Modal/Accordion */}
      {showRawTags && (
        <div className="glass-panel p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs shadow-xs">
          <h4 className="font-bold text-blue-700 text-sm">Raw EXIF Tag Dump ({Object.keys(metadata.raw_exif_tags).length} tags found)</h4>
          {Object.keys(metadata.raw_exif_tags).length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
              {Object.entries(metadata.raw_exif_tags).map(([k, v]) => (
                <div key={k} className="flex items-start justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">{k}</span>
                  <span className="text-slate-800 max-w-md truncate text-right">{String(v)}</span>
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
