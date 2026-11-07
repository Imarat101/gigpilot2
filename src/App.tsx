/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoScanner } from './components/VideoScanner';
import { VerdictCard } from './components/VerdictCard';
import { DriverSettingsModal } from './components/DriverSettingsModal';
import { SessionStats } from './components/SessionStats';
import { HudOverlay } from './components/HudOverlay';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { DriverPreferences, GigAnalysisResult, SessionOfferLog } from './types';
import { soundController } from './utils/audio';
import { pipController } from './utils/pip';
import { AlertCircle, Zap, ShieldCheck, Smartphone, Layers } from 'lucide-react';

const DEFAULT_PREFERENCES: DriverPreferences = {
  minDollarsPerMile: 1.5,
  minDollarsPerHour: 22.0,
  minPayout: 5.0,
  gasPrice: 3.65,
  vehicleMpg: 26,
  blacklistedStores: ['Popeyes', 'Wingstop', 'Walmart Curbside', 'Dollar General'],
  maxDistance: 14,
  voiceAnnouncements: true,
  soundEffects: true,
  autoScanInterval: 2200,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'screen' | 'upload'>('camera');
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<GigAnalysisResult | null>(null);
  const [lastResponseTimeMs, setLastResponseTimeMs] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals & HUD & PiP
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isHudMode, setIsHudMode] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);

  // Driver rules & session log state with localStorage persistence
  const [preferences, setPreferences] = useState<DriverPreferences>(() => {
    try {
      const saved = localStorage.getItem('gigpilot_preferences');
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [logs, setLogs] = useState<SessionOfferLog[]>(() => {
    try {
      const saved = localStorage.getItem('gigpilot_session_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem('gigpilot_preferences', JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  // Save logs
  useEffect(() => {
    try {
      localStorage.setItem('gigpilot_session_logs', JSON.stringify(logs));
    } catch {}
  }, [logs]);

  // Core Frame Analysis Function
  const handleAnalyzeFrame = useCallback(
    async (base64Image: string) => {
      if (isAnalyzing) return;
      setIsAnalyzing(true);
      setApiError(null);

      try {
        const res = await fetch('/api/analyze-gig', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            mimeType: 'image/jpeg',
            userPreferences: preferences,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server error (${res.status})`);
        }

        const data = await res.json();
        const result: GigAnalysisResult = data.analysis;
        const responseTime = data.responseTimeMs;

        setAnalysis(result);
        setLastResponseTimeMs(responseTime);
        pipController.drawOverlay(result);

        // Sound & Speech synthesis feedback
        if (result.hasOffer && preferences.soundEffects) {
          if (result.verdict === 'ACCEPT') {
            soundController.playAcceptChime();
          } else if (result.verdict === 'DECLINE') {
            soundController.playDeclineBuzz();
          } else if (result.verdict === 'CAUTION') {
            soundController.playCautionBeep();
          }
        }

        if (result.hasOffer && preferences.voiceAnnouncements && result.spokenVerdict) {
          soundController.speak(result.spokenVerdict);
        }

        // Add to session log
        if (result.hasOffer) {
          const newLog: SessionOfferLog = {
            id: String(Date.now()),
            timestamp: Date.now(),
            platform: result.platform,
            payout: result.offerDetails?.payout ?? null,
            miles: result.offerDetails?.distanceMiles ?? null,
            verdict: result.verdict as any,
            headline: result.headline,
            responseTimeMs: responseTime,
          };
          setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
        }
      } catch (err: any) {
        console.error('Failed to analyze frame:', err);
        setApiError(err.message || 'Analysis failed');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [isAnalyzing, preferences]
  );

  const handleTogglePip = async () => {
    const active = await pipController.togglePictureInPicture(analysis);
    setIsPipActive(active);
  };

  // User records their action (took order or passed)
  const handleRecordAction = (action: 'accepted' | 'declined') => {
    if (logs.length > 0) {
      setLogs((prev) => {
        const copy = [...prev];
        copy[0] = { ...copy[0], userAction: action };
        return copy;
      });
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const scanBtn = document.querySelector('button[title*="Instant"]') as HTMLButtonElement;
        scanBtn?.click();
      } else if (e.key === 'h' || e.key === 'H') {
        setIsHudMode((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setPreferences((prev) => ({
          ...prev,
          voiceAnnouncements: !prev.voiceAnnouncements,
          soundEffects: !prev.soundEffects,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAutoScanning={isAutoScanning}
        preferences={preferences}
        setPreferences={setPreferences}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onTogglePip={handleTogglePip}
        isPipActive={isPipActive}
        isHudMode={isHudMode}
        setIsHudMode={setIsHudMode}
        historyCount={logs.length}
      />

      {/* Android Live Driver Quick Banner */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-950 to-emerald-950/70 border-b border-slate-800/80 px-4 py-2 text-xs flex items-center justify-between gap-3">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-semibold text-white">Android Live Co-Pilot:</span>
            <span className="text-slate-400">
              Ready for <strong className="text-emerald-400">Uber Eats Driver</strong> & <strong className="text-cyan-400">Spark Driver (Walmart)</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePip}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
                isPipActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/40'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{isPipActive ? 'Floating PiP Active' : 'Pop-Out Floating HUD'}</span>
            </button>

            <button
              onClick={() => setIsAndroidModalOpen(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
            >
              <Smartphone className="w-3 h-3 text-emerald-400" />
              <span>Download Native APK</span>
            </button>
          </div>
        </div>
      </div>

      {/* API Error Alert Banner */}
      {apiError && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-4 py-2.5 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Analysis Alert:</strong> {apiError}
            </span>
          </div>
          <button
            onClick={() => setApiError(null)}
            className="text-rose-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        {/* Left Column: Live Video Scanner & Source Feeds */}
        <div className="lg:col-span-7 flex flex-col">
          <VideoScanner
            activeTab={activeTab}
            isAutoScanning={isAutoScanning}
            setIsAutoScanning={setIsAutoScanning}
            onAnalyzeFrame={handleAnalyzeFrame}
            isAnalyzing={isAnalyzing}
            autoScanInterval={preferences.autoScanInterval}
            lastResponseTimeMs={lastResponseTimeMs}
            onSwitchTab={(tab) => setActiveTab(tab)}
          />
        </div>

        {/* Right Column: Instant Verdict & Intelligence Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <VerdictCard
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            preferences={preferences}
            onRecordAction={handleRecordAction}
          />
        </div>
      </main>

      {/* Bottom Driver Tips & Status Bar */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-2.5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Gemini 3.8 Flash Vision Engine
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline text-slate-400">
              Target: ${preferences.minDollarsPerMile.toFixed(2)}/mi & ${preferences.minDollarsPerHour.toFixed(0)}/hr
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Shortcuts: <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-800 text-slate-300">Space</kbd> Scan • <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-800 text-slate-300">H</kbd> HUD • <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-800 text-slate-300">M</kbd> Mute
            </span>
          </div>
        </div>
      </footer>

      {/* Android Installation Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Driver Rules Settings Modal */}
      <DriverSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSave={(newPrefs) => setPreferences(newPrefs)}
      />

      {/* Session History & Shift Profit Modal */}
      <SessionStats
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* Fullscreen HUD Mode */}
      {isHudMode && (
        <HudOverlay
          analysis={analysis}
          isAnalyzing={isAnalyzing}
          onCloseHud={() => setIsHudMode(false)}
          onScanNow={() => {
            const scanBtn = document.querySelector('button[title*="Instant"]') as HTMLButtonElement;
            scanBtn?.click();
          }}
        />
      )}
    </div>
  );
}
