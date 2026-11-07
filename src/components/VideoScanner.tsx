import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  Play,
  Pause,
  Zap,
  RefreshCw,
  Upload,
  AlertCircle,
  FlaskConical,
  SwitchCamera,
  Scan,
  CheckCircle2,
  XCircle,
  Monitor,
  Smartphone,
  Info,
} from 'lucide-react';

interface VideoScannerProps {
  activeTab: 'camera' | 'screen' | 'upload';
  isAutoScanning: boolean;
  setIsAutoScanning: (val: boolean) => void;
  onAnalyzeFrame: (base64Image: string) => Promise<void>;
  isAnalyzing: boolean;
  autoScanInterval: number;
  lastResponseTimeMs: number | null;
  onSwitchTab?: (tab: 'camera' | 'screen' | 'upload') => void;
}

export const VideoScanner: React.FC<VideoScannerProps> = ({
  activeTab,
  isAutoScanning,
  setIsAutoScanning,
  onAnalyzeFrame,
  isAnalyzing,
  autoScanInterval,
  lastResponseTimeMs,
  onSwitchTab,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Feature detection
  const isDisplayMediaSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');

  const isGetUserMediaSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');

  // Stop current active media stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopStream();
    setStreamError(null);

    if (!isGetUserMediaSupported) {
      setStreamError('Camera is not supported on this device/browser. Please use Screenshot Drop/Paste or Screen Live.');
      return;
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setStreamError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access in your browser or switch to Screenshot mode.'
          : `Camera error: ${err.message || 'Unable to start camera'}`
      );
    }
  }, [facingMode, stopStream, isGetUserMediaSupported]);

  // Start Screen Share - only invoked on direct user click/gesture
  const startScreenShare = useCallback(async () => {
    stopStream();
    setStreamError(null);

    if (!isDisplayMediaSupported) {
      setStreamError(
        'Screen capture is not supported in this mobile browser or webview. On mobile phones, browsers prevent web apps from recording other apps directly. Point your Camera at your phone mount, take a screenshot and drop it here, or use PC screen share to capture your mirrored phone.'
      );
      return;
    }

    try {
      const media = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
        },
        audio: false,
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }

      // Handle user stopping share from browser floating toolbar
      if (media.getVideoTracks().length > 0) {
        media.getVideoTracks()[0].onended = () => {
          stopStream();
          setIsAutoScanning(false);
        };
      }
    } catch (err: any) {
      console.error('Screen share error:', err);
      if (err.name !== 'AbortError') {
        setStreamError(
          err.name === 'NotAllowedError'
            ? 'Screen share cancelled or permission not granted.'
            : `Screen share error: ${err.message || 'Unable to capture screen'}`
        );
      }
    }
  }, [stopStream, setIsAutoScanning, isDisplayMediaSupported]);

  // Handle Tab Switch - safely start camera or stop streams, NEVER auto-invoke getDisplayMedia in useEffect
  useEffect(() => {
    setStreamError(null);
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [activeTab]);

  // Extract current video frame or uploaded screenshot
  const captureCurrentFrame = useCallback((): string | null => {
    if (activeTab === 'upload') {
      return uploadedImage;
    }

    // Video stream (camera or screen)
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    // Capture at optimal processing resolution for sub-second Gemini flash analysis
    const maxDim = 960;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.88);
  }, [activeTab, uploadedImage]);

  // Single Manual Trigger
  const handleManualScan = async () => {
    const frame = captureCurrentFrame();
    if (frame) {
      await onAnalyzeFrame(frame);
    }
  };

  // Continuous Auto-Scan Interval Loop
  useEffect(() => {
    if (!isAutoScanning) return;

    let timerId: NodeJS.Timeout;

    const runScanLoop = async () => {
      if (!isAnalyzing) {
        const frame = captureCurrentFrame();
        if (frame) {
          try {
            await onAnalyzeFrame(frame);
          } catch (e) {
            console.error('Scan loop error:', e);
          }
        }
      }
      timerId = setTimeout(runScanLoop, autoScanInterval);
    };

    timerId = setTimeout(runScanLoop, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [isAutoScanning, isAnalyzing, autoScanInterval, captureCurrentFrame, onAnalyzeFrame]);

  // Clipboard paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              const res = loadEvt.target?.result as string;
              setUploadedImage(res);
              // auto trigger analysis
              onAnalyzeFrame(res);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onAnalyzeFrame]);

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = evt.target?.result as string;
        setUploadedImage(res);
        onAnalyzeFrame(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = evt.target?.result as string;
        setUploadedImage(res);
        onAnalyzeFrame(res);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Video Viewport Card */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-center items-center min-h-[380px] lg:min-h-[460px]">
        {/* Source Content: Camera / Screen / Simulator / Upload */}
        {activeTab === 'camera' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain max-h-[500px]"
            />

            {streamError && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
                <h3 className="text-white font-bold text-lg mb-1">Camera Notice</h3>
                <p className="text-slate-400 text-xs max-w-md mb-4">{streamError}</p>
                <div className="flex gap-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Try Again
                  </button>
                  {onSwitchTab && (
                    <button
                      onClick={() => onSwitchTab('upload')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold"
                    >
                      Switch to Screenshot Mode
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'screen' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black min-h-[380px]">
            {stream ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain max-h-[500px]"
                />
                <button
                  onClick={stopStream}
                  className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
                >
                  Stop Screen Share
                </button>
              </div>
            ) : isDisplayMediaSupported ? (
              <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
                  <Monitor className="w-8 h-8" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1.5">Live Screen Capture</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-5">
                  Share your phone screen mirror (Phone Link, scrcpy, or browser tab) to analyze Uber Eats and Spark Driver offers live.
                </p>
                <button
                  onClick={startScreenShare}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Start Screen Sharing</span>
                </button>
                {streamError && (
                  <p className="text-rose-400 text-xs mt-4 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                    {streamError}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="text-white font-bold text-base mb-1.5">Mobile Screen Capture Notice</h3>
                <p className="text-slate-300 text-xs leading-relaxed mb-4">
                  Mobile browsers (Android Chrome, iOS Safari) do not allow web pages to capture other apps directly with getDisplayMedia.
                </p>
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-left space-y-2 mb-5 w-full text-[11px] text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">1.</span>
                    <span><strong className="text-white">Camera Mode</strong> (Recommended for car mounts): Point camera directly at your mounted phone.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">2.</span>
                    <span><strong className="text-white">Drop/Paste Screenshot</strong>: Take a phone screenshot and drop or paste it (Ctrl+V) for instant evaluation.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">3.</span>
                    <span><strong className="text-white">Desktop Phone Mirror</strong>: On PC/Mac with Phone Link or scrcpy, screen share is fully supported.</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {onSwitchTab && (
                    <>
                      <button
                        onClick={() => onSwitchTab('camera')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Use Camera Mode</span>
                      </button>
                      <button
                        onClick={() => onSwitchTab('upload')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Drop Screenshot</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Drop / Paste Tab */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`w-full h-full min-h-[380px] flex flex-col items-center justify-center p-6 border-2 border-dashed transition-all ${
              isDragging
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            }`}
          >
            {uploadedImage ? (
              <div className="relative max-h-[460px] flex flex-col items-center">
                <img
                  src={uploadedImage}
                  alt="Uploaded gig screen"
                  className="max-h-[400px] w-auto rounded-xl shadow-2xl border border-slate-800 object-contain"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-white font-bold text-base mb-1">
                  Drop Gig Offer Screenshot Here
                </h3>
                <p className="text-slate-400 text-xs max-w-sm mb-4">
                  Take a screenshot on your phone (DoorDash, Uber, Instacart, etc.) and drop it here or press{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[11px]">
                    Ctrl+V
                  </kbd>{' '}
                  to paste from clipboard.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  Browse Files
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* HUD Scanner Reticle & Laser Sweep Animation */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400/80 rounded-tl-sm"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400/80 rounded-tr-sm"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400/80 rounded-bl-sm"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400/80 rounded-br-sm"></div>

          {/* Active Scanning Laser Line */}
          {(isAutoScanning || isAnalyzing) && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-[bounce_2.5s_infinite]"></div>
          )}
        </div>

        {/* Top Floating Status Indicators */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {lastResponseTimeMs && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-emerald-400 flex items-center gap-1 shadow-md">
              <Zap className="w-3 h-3 text-amber-400" />
              {lastResponseTimeMs}ms
            </span>
          )}

          {activeTab === 'camera' && (
            <button
              onClick={() => {
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                startCamera();
              }}
              className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all"
              title="Flip Camera (Front/Rear)"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Execution Controls: Instant Fast Scan & Auto Scan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Instant 1-Tap Fast Scan */}
        <button
          onClick={handleManualScan}
          disabled={isAnalyzing}
          className={`relative overflow-hidden group flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-black text-sm transition-all shadow-lg ${
            isAnalyzing
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing Gig Screen...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>Instant AI Scan Now</span>
              <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-slate-950/20 rounded">
                ⚡ Fastest
              </span>
            </>
          )}
        </button>

        {/* Live Auto-Scan Toggle */}
        <button
          onClick={() => setIsAutoScanning(!isAutoScanning)}
          className={`flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-sm border transition-all ${
            isAutoScanning
              ? 'bg-rose-950/40 text-rose-300 border-rose-500/50 hover:bg-rose-900/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
          }`}
        >
          {isAutoScanning ? (
            <>
              <Pause className="w-4 h-4 fill-current text-rose-400" />
              <span>Stop Continuous Auto-Scan</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-emerald-400" />
              <span>Start Continuous Auto-Scan (2s loop)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
