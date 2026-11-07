import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Cpu,
  Flame,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'native' | 'floating' | 'chrome'>('native');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
              <Smartphone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Native Android App (APK / Studio)</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                  v1.0 Native
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real standalone app with floating overlay for Uber Eats & Spark Driver
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('native')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'native'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Download Native Project & APK</span>
          </button>

          <button
            onClick={() => setActiveTab('floating')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'floating'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Floating HUD (PiP)</span>
          </button>

          <button
            onClick={() => setActiveTab('chrome')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'chrome'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Why Chrome Said "Shortcut"</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-300 flex-1">
          {activeTab === 'native' && (
            <div className="space-y-5">
              {/* Main Download Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download Ready-to-Build Android Project (.zip)</span>
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Contains the full native Android Gradle project, preconfigured with{' '}
                      <code className="text-emerald-300 font-mono">SYSTEM_ALERT_WINDOW</code> (Draw over other apps),{' '}
                      <code className="text-emerald-300 font-mono">FOREGROUND_SERVICE</code>, and native camera bindings.
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    Capacitor + Gradle
                  </span>
                </div>

                <a
                  href="/api/download-android-project"
                  download="GigPilot-Android-Native-App.zip"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.99]"
                >
                  <Download className="w-5 h-5" />
                  <span>Download GigPilot-Android-Native-App.zip</span>
                </a>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Package ID: <strong className="text-slate-200">com.gigpilot.ai</strong></span>
                  <span>Target SDK: <strong className="text-slate-200">Android 14+ (API 34)</strong></span>
                </div>
              </div>

              {/* 2 Ways to Get APK */}
              <div className="space-y-3">
                <h4 className="font-black text-white text-xs uppercase tracking-wider text-slate-400">
                  Two Ways to Build the .apk:
                </h4>

                {/* Option 1: GitHub Actions (No local install needed) */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-[11px]">
                        A
                      </div>
                      <span>Automated Cloud Build via GitHub Actions (Fastest)</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Zero Setup
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    We included <code className="text-cyan-300 font-mono">.github/workflows/build-apk.yml</code> in this project. When pushed to GitHub, GitHub automatically compiles the native APK in ~2 minutes using cloud runners.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                    <span className="truncate">GitHub Repo → Actions tab → "Build Android APK" → Artifacts: app-debug.apk</span>
                  </div>
                </div>

                {/* Option 2: Local Android Studio / CLI */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[11px]">
                        B
                      </div>
                      <span>Local Android Studio or Gradle Terminal</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">CLI / IDE</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-400">
                    <li>Unzip <strong className="text-slate-200">GigPilot-Android-Native-App.zip</strong>.</li>
                    <li>Open the <strong className="text-slate-200">android/</strong> directory in Android Studio.</li>
                    <li>Click <strong className="text-slate-200">Build → Build APK(s)</strong> or run the terminal command below:</li>
                  </ol>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 flex items-center justify-between">
                    <span>cd android && ./gradlew assembleDebug</span>
                    <button
                      onClick={() => copyToClipboard('cd android && ./gradlew assembleDebug', 'gradle')}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copy command"
                    >
                      {copiedCmd === 'gradle' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Output: <code className="text-slate-400">android/app/build/outputs/apk/debug/app-debug.apk</code>. Transfer to your phone and tap to install!
                  </div>
                </div>
              </div>

              {/* Native Capabilities Badge Grid */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SYSTEM_ALERT_WINDOW (Overlay)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>FOREGROUND_SERVICE (Won't sleep)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Zero-Latency Hardware Camera</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SpeechSynthesis Audio Readout</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'floating' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Instant Floating HUD Overlay (Zero Compilation Needed)</span>
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  If you are in your car right now and don't want to compile an APK, you can use the built-in <strong>Picture-in-Picture (PiP) Floating HUD</strong> right now. It creates a draggable floating badge that stays on top of Uber Eats Driver and Spark Driver!
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Point Camera at Mounted Phone or Mount This Phone</div>
                    <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      Use the <strong>Camera Scanner</strong> tab. Keep the camera pointed at your driver phone, or point it at your second phone or dash mount.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Tap "Pop-Out Floating HUD"</div>
                    <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      Click the <strong>Pop-Out Floating HUD</strong> button in the top bar. A compact widget will pop out and stay pinned to your screen while you open any other app.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex gap-3.5 items-start">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Turn On Voice Announcements</div>
                    <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      Keep the volume turned up! GigPilot will speak the verdict aloud (<em>"Accept! $24 for 3 miles with Spark Driver"</em>) so you never even have to look down at your screen while driving.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chrome' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Why Chrome Said "Install a shortcut"</span>
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  On Android, Google Chrome only enables the native <strong>"Install app" (WebAPK)</strong> button when strict criteria are met:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-400">
                  <li>The site must be served over HTTPS with valid SSL certificates.</li>
                  <li>A registered Service Worker (<code className="text-slate-200">sw.js</code>) and Web Manifest must be cached.</li>
                  <li>Google's WebAPK Minting Service must communicate with your device.</li>
                </ul>
                <p className="text-slate-300 text-xs leading-relaxed">
                  If any of those checks are delayed, Chrome defaults to "Install a shortcut" (a simple URL bookmark on your home screen), which cannot draw overlays over other apps.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 space-y-2">
                <div className="font-bold text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>The Real Business Solution: Use the Native Android APK</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  To get a real business-grade tool that runs as a true installed application with overlay permissions over Uber Eats Driver and Spark Driver, switch to the <strong>"Download Native Project & APK"</strong> tab above!
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

