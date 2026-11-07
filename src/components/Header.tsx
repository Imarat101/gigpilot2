import React from 'react';
import {
  ShieldAlert,
  Sliders,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  History,
  Radio,
  Camera,
  Monitor,
  FlaskConical,
  Upload,
  Smartphone,
  Layers,
} from 'lucide-react';
import { DriverPreferences, SessionOfferLog } from '../types';

interface HeaderProps {
  activeTab: 'camera' | 'screen' | 'upload';
  setActiveTab: (tab: 'camera' | 'screen' | 'upload') => void;
  isAutoScanning: boolean;
  preferences: DriverPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<DriverPreferences>>;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenAndroidModal: () => void;
  onTogglePip: () => void;
  isPipActive: boolean;
  isHudMode: boolean;
  setIsHudMode: (val: boolean) => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAutoScanning,
  preferences,
  setPreferences,
  onOpenSettings,
  onOpenHistory,
  onOpenAndroidModal,
  onTogglePip,
  isPipActive,
  isHudMode,
  setIsHudMode,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 font-black text-lg">
            GP
            {isAutoScanning && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                GigPilot <span className="text-emerald-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30">AI</span>
              </h1>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Uber Eats & Spark Driver Co-Pilot
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block">
              Real-time Profit, Fuel & Delay Intelligence for Gig Drivers
            </p>
          </div>
        </div>

        {/* Source Mode Selector - Real Business Tools */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'camera'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Live camera feed pointed at mounted phone in car"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('screen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'screen'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Live screen capture of phone mirror or browser tab"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Screen Live</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Drop phone screenshot or paste directly with Ctrl+V"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Screenshot / Paste</span>
          </button>
        </div>

        {/* Android & Floating HUD Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Android App Button */}
          <button
            onClick={onOpenAndroidModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm"
            title="Download Native Android Project & APK Setup"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Native Android (APK)</span>
          </button>

          {/* Picture-in-Picture Floating Overlay */}
          <button
            onClick={onTogglePip}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              isPipActive
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
            title="Floating Android Mini-Overlay (PiP) on top of Uber Eats / Spark"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Floating PiP</span>
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={() =>
              setPreferences((prev) => ({
                ...prev,
                voiceAnnouncements: !prev.voiceAnnouncements,
                soundEffects: !prev.soundEffects,
              }))
            }
            className={`p-1.5 sm:p-2 rounded-xl border text-xs transition-all ${
              preferences.voiceAnnouncements
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={preferences.voiceAnnouncements ? 'Voice announcements active' : 'Audio muted'}
          >
            {preferences.voiceAnnouncements ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Session History */}
          <button
            onClick={onOpenHistory}
            className="relative p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Session Log & Stats"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          {/* Fullscreen HUD Toggle */}
          <button
            onClick={() => setIsHudMode(!isHudMode)}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
              isHudMode
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
            title="Driver HUD Mode (Fullscreen)"
          >
            {isHudMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Driver Rules Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition-all"
            title="Driver Rules & Preferences"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </header>
  );
};

