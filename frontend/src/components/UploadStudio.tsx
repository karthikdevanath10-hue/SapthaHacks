import React, { useState, useRef } from 'react';
import { 
  UploadCloud, Image as ImageIcon, Video, Mic, FileText, CheckCircle2, 
  AlertCircle, Loader2, ArrowRight, RefreshCw, Layers, ShieldCheck, Download, Trash2,
  Play, Volume2, Sparkles, FileEdit, Square, Radio, Zap
} from 'lucide-react';
import { FullAnalysisResponse, UserProfile, MediaModality } from '../types';
import { apiService } from '../services/api';
import { EvidenceScorecardView } from './EvidenceScorecardView';
import { MetadataViewer } from './MetadataViewer';
import { TechnicalViewer } from './TechnicalViewer';
import { VideoViewer } from './VideoViewer';
import { AudioViewer } from './AudioViewer';
import { TextViewer } from './TextViewer';
import { AIVisionViewer } from './AIVisionViewer';
import { CaptionCrossVerifier } from './CaptionCrossVerifier';

interface UploadStudioProps {
  currentUser: UserProfile | null;
  onAnalysisComplete?: (result: FullAnalysisResponse) => void;
}

const MODALITY_STEPS: Record<MediaModality, string[]> = {
  image: [
    'Verifying binary integrity & generating SHA-256 fingerprint...',
    'Extracting embedded EXIF headers & generation metadata tags...',
    'Executing Error Level Analysis (ELA 90%) & spatial noise variance...',
    'Interrogating Gemini Multimodal Vision for physical/lighting coherence...',
    'Cross-verifying narrative claims against visual ground truth...',
    'Synthesizing Evidence Scorecard & compiling cryptographic PDF report...'
  ],
  video: [
    'Sampling temporal keyframe trajectory & calculating SHA-256...',
    'Measuring inter-frame motion jitter and optical flow differentials...',
    'Evaluating facial perimeter blending gradients via Haar cascade filters...',
    'Interrogating Gemini Multimodal Video for deepfake morphing markers...',
    'Cross-verifying temporal scene continuity against claimed narrative...',
    'Synthesizing Video Evidence Scorecard & compiling forensic PDF...'
  ],
  audio: [
    'Extracting acoustic frequency spectrum & sample rate parameters...',
    'Measuring speech-to-pause ratio & human respiratory micro-intervals...',
    'Inspecting Fast Fourier Transform (FFT) for neural vocoder cutoffs...',
    'Interrogating Gemini Multimodal Audio for synthetic voice clone timbres...',
    'Evaluating room reverberation & acoustic environment consistency...',
    'Synthesizing Audio Evidence Scorecard & compiling forensic PDF...'
  ],
  text: [
    'Parsing syntactic structure & calculating Type-Token Ratio (TTR)...',
    'Measuring sentence length variance & syntactic burstiness (σ)...',
    'Identifying Large Language Model (LLM) transition markers & idioms...',
    'Decomposing narrative assertions for factual inconsistencies...',
    'Interrogating Gemini for synthetic generation & disinformation patterns...',
    'Synthesizing Text Evidence Scorecard & compiling forensic PDF...'
  ]
};

export const UploadStudio: React.FC<UploadStudioProps> = ({ currentUser, onAnalysisComplete }) => {
  const [selectedModality, setSelectedModality] = useState<MediaModality>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [directText, setDirectText] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [sourceContext, setSourceContext] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<FullAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'scorecard' | 'diagnostics' | 'metadata' | 'ai' | 'caption'>('scorecard');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio live recording state
  const [audioInputMode, setAudioInputMode] = useState<'record' | 'upload'>('record');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedExtensions = (modality: MediaModality) => {
    switch (modality) {
      case 'video':
        return 'video/mp4,video/quicktime,video/webm,video/x-msvideo,.mp4,.mov,.webm,.avi';
      case 'audio':
        return 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.weba';
      case 'text':
        return 'text/plain,.txt';
      case 'image':
      default:
        return 'image/*,.jpg,.jpeg,.png,.webp,.tiff,.jfif,.jfi,.bmp';
    }
  };

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const ext = recorder.mimeType.includes('webm') ? '.weba' : '.wav';
        const recordedFile = new File([audioBlob], `mic_voice_recording_${Date.now()}${ext}`, {
          type: recorder.mimeType || 'audio/webm'
        });
        setSelectedFile(recordedFile);
        setSelectedModality('audio');
        setPreviewUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMsg('Microphone access unavailable or denied: ' + (err.message || 'Please check microphone permissions in your browser.'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleLoadDemoAudio = async () => {
    try {
      setErrorMsg(null);
      const res = await fetch('http://127.0.0.1:8000/static/uploads/sample_voice.wav');
      if (res.ok) {
        const blob = await res.blob();
        const demoFile = new File([blob], 'sample_voice_analysis.wav', { type: 'audio/wav' });
        handleFileChange(demoFile);
      } else {
        setErrorMsg('Sample audio file not found on server.');
      }
    } catch (e: any) {
      setErrorMsg('Could not fetch sample audio: ' + e.message);
    }
  };

  const handleModalityChange = (mod: MediaModality) => {
    setSelectedModality(mod);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDirectText('');
    setAnalysisResult(null);
    setErrorMsg(null);
    if (isRecording) {
      stopRecording();
    }
  };

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50MB maximum limit.');
      return;
    }

    // Auto-detect modality from extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (['.mp4', '.mov', '.webm', '.avi', '.mkv'].includes(ext) && selectedModality !== 'audio') {
      setSelectedModality('video');
    } else if (['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac', '.weba'].includes(ext) || file.type.startsWith('audio/')) {
      setSelectedModality('audio');
    } else if (['.txt'].includes(ext)) {
      setSelectedModality('text');
    } else if (['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.jfif', '.jfi', '.bmp'].includes(ext) || file.type.startsWith('image/')) {
      setSelectedModality('image');
    } else {
      setSelectedModality('image');
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalysisResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile && !directText.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setCurrentStepIndex(0);

    const steps = MODALITY_STEPS[selectedModality];
    const timer = setInterval(() => {
      setCurrentStepIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 350);

    try {
      const result = await apiService.analyzeMedia({
        file: selectedFile,
        textContent: directText,
        caption,
        sourceContext,
        userId: currentUser?.id,
        modality: selectedModality
      });
      clearInterval(timer);
      setAnalysisResult(result);
      if (onAnalysisComplete) onAnalysisComplete(result);
    } catch (err: any) {
      clearInterval(timer);
      const detail = err.response?.data?.detail || err.message || 'Forensic analysis failed';
      setErrorMsg(detail);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDirectText('');
    setCaption('');
    setSourceContext('');
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {!analysisResult ? (
        <div className="space-y-6">
          
          {/* Corporate Modality Header */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-white tracking-tight">Forensic Investigation Studio</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60">ISO 27037 Standard</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-layer inspection across mathematical signal, cryptographic provenance, and AI reasoning pipelines
              </p>
            </div>

            {/* Corporate Modality Switcher */}
            <div className="flex items-center flex-wrap gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'image', label: 'Image Forensics', icon: <ImageIcon className="w-3.5 h-3.5" /> },
                { id: 'video', label: 'Video Deepfake', icon: <Video className="w-3.5 h-3.5" /> },
                { id: 'audio', label: 'Voice / Audio', icon: <Mic className="w-3.5 h-3.5" /> },
                { id: 'text', label: 'Text & Narrative', icon: <FileText className="w-3.5 h-3.5" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleModalityChange(tab.id as MediaModality)}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-2 transition ${
                    selectedModality === tab.id
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-800/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Media Uploader & Previews */}
            <div className="lg:col-span-7 space-y-4">
              
              {selectedModality === 'text' && !selectedFile ? (
                /* Direct Text Input Box */
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white flex items-center space-x-2">
                      <FileEdit className="w-4 h-4 text-cyan-400" />
                      <span>Input Suspicious Statement or Article</span>
                    </label>
                    <span className="text-xs text-slate-400 font-mono">
                      {directText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={directText}
                    onChange={(e) => setDirectText(e.target.value)}
                    placeholder="Paste suspect text, article, social media post, or speech transcript here for stylometric, burstiness, and LLM synthesis examination..."
                    className="w-full bg-cyber-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-y"
                  />
                  
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Or upload a .txt file:</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg border border-slate-700 bg-cyber-900 text-slate-300 hover:text-white"
                    >
                      Browse .txt File
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".txt"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    />
                  </div>
                </div>
              ) : selectedModality === 'audio' && !previewUrl ? (
                /* Voice & Acoustic Audio Studio (Live Mic + File Ingestion) */
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <Mic className="w-4 h-4 text-cyan-400" />
                        <span>Voice & Acoustic Forensic Studio</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Record voice from microphone or upload audio file to test for AI cloning & vocoder synthesis
                      </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-cyber-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setAudioInputMode('record')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition ${
                          audioInputMode === 'record'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🎙️ Live Mic
                      </button>
                      <button
                        type="button"
                        onClick={() => setAudioInputMode('upload')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition ${
                          audioInputMode === 'upload'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        📁 File Upload
                      </button>
                    </div>
                  </div>

                  {audioInputMode === 'record' ? (
                    <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4 rounded-xl bg-cyber-950/70 border border-slate-800/80">
                      {isRecording ? (
                        <>
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center shadow-lg shadow-rose-900/40 animate-pulse">
                              <Radio className="w-10 h-10 text-rose-400 animate-spin" />
                            </div>
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 animate-ping" />
                          </div>

                          <div className="space-y-1">
                            <span className="text-rose-400 font-mono text-xl font-bold tracking-wider">
                              ● RECORDING: 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                            </span>
                            <p className="text-xs text-slate-300">Speak naturally into your microphone (3–10 seconds recommended)...</p>
                          </div>

                          <button
                            type="button"
                            onClick={stopRecording}
                            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-900/50 transition cursor-pointer"
                          >
                            <Square className="w-4 h-4 fill-white" />
                            <span>Stop & Analyze Voice</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 rounded-full bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950">
                            <Mic className="w-10 h-10 text-cyan-400" />
                          </div>

                          <div className="space-y-1 max-w-sm">
                            <h4 className="text-sm font-semibold text-white">Record Your Voice Live</h4>
                            <p className="text-xs text-slate-400">
                              Capture live speech to examine respiratory pause ratios, phonetic clipping, and vocoder harmonic anomalies.
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={startRecording}
                              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/30 transition cursor-pointer"
                            >
                              <Mic className="w-4 h-4" />
                              <span>Start Voice Recording</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleLoadDemoAudio}
                              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center space-x-2 border border-slate-700 transition"
                            >
                              <Zap className="w-4 h-4 text-amber-400" />
                              <span>Load Demo Sample Voice</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Drag & Drop Audio File Zone */
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/70 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer glass-panel transition group relative overflow-hidden"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept={getAcceptedExtensions('audio')}
                        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      />
                      <div className="w-14 h-14 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-cyan-400 transition shadow-lg shadow-cyan-950">
                        <Volume2 className="w-7 h-7 text-cyan-400" />
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        Drag and drop audio file here
                      </h4>
                      <p className="text-xs text-slate-400 mb-3 max-w-xs">
                        Supports MP3, WAV, M4A, AAC, OGG, FLAC up to 50MB
                      </p>
                      <button 
                        type="button" 
                        className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition"
                      >
                        Browse Local Audio File
                      </button>
                    </div>
                  )}
                </div>
              ) : !previewUrl ? (
                /* Drag & Drop File Zone for Image & Video */
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/70 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer glass-panel transition group relative overflow-hidden"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={getAcceptedExtensions(selectedModality)}
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />
                  
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-cyan-400 transition shadow-lg shadow-cyan-950">
                    {selectedModality === 'video' ? (
                      <Video className="w-8 h-8 text-cyan-400" />
                    ) : selectedModality === 'audio' ? (
                      <Mic className="w-8 h-8 text-cyan-400" />
                    ) : selectedModality === 'text' ? (
                      <FileText className="w-8 h-8 text-cyan-400" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-cyan-400" />
                    )}
                  </div>
                  
                  <h3 className="text-base font-semibold text-white mb-1">
                    Drag and drop suspect {selectedModality.toUpperCase()} file here
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 max-w-xs">
                    {selectedModality === 'video' && 'Supports MP4, MOV, WEBM, AVI up to 50MB.'}
                    {selectedModality === 'audio' && 'Supports MP3, WAV, M4A, AAC, OGG up to 50MB.'}
                    {selectedModality === 'text' && 'Supports TXT plain text documents.'}
                    {selectedModality === 'image' && 'Supports JPG, JPEG, PNG, WEBP, JFIF, TIFF up to 25MB.'}
                  </p>

                  <button 
                    type="button" 
                    className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition"
                  >
                    Browse Local {selectedModality.toUpperCase()}
                  </button>
                </div>
              ) : (
                /* Dynamic Media Preview Box */
                <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 relative">
                  <div className="relative rounded-xl overflow-hidden bg-cyber-950 flex items-center justify-center max-h-[420px] border border-slate-800 p-2">
                    {selectedModality === 'video' ? (
                      <video 
                        src={previewUrl} 
                        controls 
                        className="max-h-[380px] w-auto rounded-lg"
                      />
                    ) : selectedModality === 'audio' ? (
                      <div className="py-12 px-6 w-full text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
                          <Volume2 className="w-8 h-8 text-cyan-400 animate-pulse" />
                        </div>
                        <audio src={previewUrl} controls className="w-full max-w-md mx-auto" />
                      </div>
                    ) : (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-[380px] w-auto object-contain"
                      />
                    )}

                    <button
                      onClick={handleReset}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-cyber-950/80 border border-slate-700 text-slate-300 hover:text-rose-400 transition"
                      title="Remove Media"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                    <span>Target: <strong className="text-white">{selectedFile?.name}</strong></span>
                    <span>Modality: <strong className="text-cyan-400 uppercase">{selectedModality}</strong></span>
                    <span>Size: {(Number(selectedFile?.size) / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
              )}

              {/* Error Callout */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

            </div>

            {/* Right Column: Context Claims & Action Trigger */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Narrative Claim / Context</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provide the caption, tweet headline, or statement associated with this media
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Reported Caption or News Claim
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. 'Viral video showing leaked military drone footage over disputed border.'"
                    rows={3}
                    className="w-full bg-cyber-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Source Channel or Origin
                  </label>
                  <input
                    type="text"
                    value={sourceContext}
                    onChange={(e) => setSourceContext(e.target.value)}
                    placeholder="e.g. 'Telegram channel', 'X (Twitter)', 'Deepfake forum'"
                    className="w-full bg-cyber-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Modality Specific Highlights */}
                <div className="p-3.5 rounded-xl bg-cyber-950/50 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                  <span className="font-semibold text-cyan-400 block">Active Pipeline Features:</span>
                  {selectedModality === 'video' && <span>• Motion Jitter • Face Boundary Gradient • Gemini Deepfake</span>}
                  {selectedModality === 'audio' && <span>• Acoustic Spectrum • Speech/Pause Ratio • Voice Cloning Timbre</span>}
                  {selectedModality === 'text' && <span>• Type-Token Ratio • Syntactic Burstiness • LLM Token Markers</span>}
                  {selectedModality === 'image' && <span>• EXIF Inspection • Error Level Analysis (ELA) • Gemini Vision</span>}
                </div>

                {/* Submit Button */}
                <button
                  disabled={(!selectedFile && !directText.trim()) || isAnalyzing}
                  onClick={handleStartAnalysis}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition shadow-md ${
                    (selectedFile || directText.trim()) && !isAnalyzing
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Analyzing {selectedModality.toUpperCase()} Evidence...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-blue-300" />
                      <span>Commence Forensic Examination</span>
                      <ArrowRight className="w-4 h-4 text-blue-300" />
                    </>
                  )}
                </button>

              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Results Mode */
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>New Case Investigation</span>
              </button>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Case: <strong className="text-white">{analysisResult.image_name}</strong> ({analysisResult.modality.toUpperCase()})
              </span>
            </div>

            {/* Diagnostic View Tabs */}
            <div className="flex items-center flex-wrap gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('scorecard')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'scorecard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Evidence Scorecard
              </button>

              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'diagnostics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {analysisResult.modality === 'video' ? 'Video Deepfake Diagnostics' :
                 analysisResult.modality === 'audio' ? 'Acoustic Voice Diagnostics' :
                 analysisResult.modality === 'text' ? 'Text Stylometry Diagnostics' :
                 'Image Technical Diagnostics'}
              </button>

              <button
                onClick={() => setActiveTab('metadata')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'metadata' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Provenance & EXIF
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'ai' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AI Semantic Reasoning
              </button>

              {analysisResult.caption_comparison?.caption_provided && (
                <button
                  onClick={() => setActiveTab('caption')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'caption' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Claim Alignment Check
                </button>
              )}
            </div>
          </div>

          {/* Active Diagnostic Views */}
          {activeTab === 'scorecard' && (
            <EvidenceScorecardView analysis={analysisResult} />
          )}

          {activeTab === 'diagnostics' && (
            <>
              {analysisResult.modality === 'video' && analysisResult.video_diagnostics && (
                <VideoViewer video={analysisResult.video_diagnostics} />
              )}
              {analysisResult.modality === 'audio' && analysisResult.audio_diagnostics && (
                <AudioViewer audio={analysisResult.audio_diagnostics} />
              )}
              {analysisResult.modality === 'text' && analysisResult.text_diagnostics && (
                <TextViewer text={analysisResult.text_diagnostics} />
              )}
              {analysisResult.modality === 'image' && (
                <TechnicalViewer technical={analysisResult.technical} />
              )}
            </>
          )}

          {activeTab === 'metadata' && (
            <MetadataViewer metadata={analysisResult.metadata} />
          )}

          {activeTab === 'ai' && (
            <AIVisionViewer aiResult={analysisResult.ai_analysis} />
          )}

          {activeTab === 'caption' && (
            <CaptionCrossVerifier captionResult={analysisResult.caption_comparison} />
          )}

        </div>
      )}

      {/* Corporate Animated Multimodal Progress Stepper Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-[#080c14]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-blue-500/30 space-y-5 shadow-2xl text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center mx-auto shadow-lg shadow-blue-900/30">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                Executing {selectedModality.toUpperCase()} Forensic Pipeline
              </h3>
              <p className="text-xs text-slate-400">
                Synchronized inspection across signal processing and AI reasoning layers
              </p>
            </div>

            {/* Stepper Display */}
            <div className="space-y-2 text-left bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              {MODALITY_STEPS[selectedModality].map((step, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs">
                  {idx < currentStepIndex ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : idx === currentStepIndex ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />
                  )}
                  <span className={idx === currentStepIndex ? 'text-blue-300 font-medium' : idx < currentStepIndex ? 'text-slate-400' : 'text-slate-600'}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 font-mono">
              TruthLens Enterprise Forensics • ISO 27037 Standard
            </p>

          </div>
        </div>
      )}

    </div>
  );
};
