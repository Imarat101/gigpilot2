import React, { useState } from 'react';
import { X, Sliders, DollarSign, Fuel, ShieldX, Volume2, Plus, Trash2 } from 'lucide-react';
import { DriverPreferences } from '../types';

interface DriverSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: DriverPreferences;
  onSave: (newPrefs: DriverPreferences) => void;
}

export const DriverSettingsModal: React.FC<DriverSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSave,
}) => {
  const [prefs, setPrefs] = useState<DriverPreferences>(preferences);
  const [newStoreInput, setNewStoreInput] = useState('');

  if (!isOpen) return null;

  const handleAddStore = () => {
    if (newStoreInput.trim()) {
      setPrefs((prev) => ({
        ...prev,
        blacklistedStores: [...prev.blacklistedStores, newStoreInput.trim()],
      }));
      setNewStoreInput('');
    }
  };

  const handleRemoveStore = (index: number) => {
    setPrefs((prev) => ({
      ...prev,
      blacklistedStores: prev.blacklistedStores.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(prefs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Driver Profit Rules & Vehicle Setup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {/* Target Min $/Mile */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-white">Minimum Target Pay Per Mile:</span>
              <span className="text-emerald-400 font-mono text-sm">
                ${prefs.minDollarsPerMile.toFixed(2)}/mi
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="3.50"
              step="0.05"
              value={prefs.minDollarsPerMile}
              onChange={(e) =>
                setPrefs({ ...prefs, minDollarsPerMile: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Orders below this rate trigger an automatic DECLINE recommendation.
            </p>
          </div>

          {/* Target Min $/Hour */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-white">Minimum Hourly Pace:</span>
              <span className="text-cyan-400 font-mono text-sm">
                ${prefs.minDollarsPerHour.toFixed(0)}/hr
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="1"
              value={prefs.minDollarsPerHour}
              onChange={(e) =>
                setPrefs({ ...prefs, minDollarsPerHour: parseInt(e.target.value, 10) })
              }
              className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Absolute Payout Floor & Max Distance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-semibold text-white">Minimum Payout Floor ($)</label>
              <input
                type="number"
                min="2"
                max="20"
                step="0.5"
                value={prefs.minPayout}
                onChange={(e) => setPrefs({ ...prefs, minPayout: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Auto-decline small $2-$4 trips</span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-white">Max Distance (miles)</label>
              <input
                type="number"
                min="5"
                max="40"
                value={prefs.maxDistance}
                onChange={(e) => setPrefs({ ...prefs, maxDistance: parseInt(e.target.value, 10) || 15 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Avoid excessive long drives</span>
            </div>
          </div>

          {/* Vehicle Fuel & MPG for Net Profit Accuracy */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Fuel className="w-4 h-4 text-amber-400" />
              <span>Real Vehicle Cost Calculator</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Local Gas Price ($/gal)</label>
                <input
                  type="number"
                  min="2.00"
                  max="7.00"
                  step="0.05"
                  value={prefs.gasPrice}
                  onChange={(e) =>
                    setPrefs({ ...prefs, gasPrice: parseFloat(e.target.value) || 3.5 })
                  }
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Vehicle MPG</label>
                <input
                  type="number"
                  min="10"
                  max="70"
                  value={prefs.vehicleMpg}
                  onChange={(e) =>
                    setPrefs({ ...prefs, vehicleMpg: parseInt(e.target.value, 10) || 25 })
                  }
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div className="text-[11px] text-amber-300 font-mono">
              Est. Fuel Cost: ${(prefs.gasPrice / prefs.vehicleMpg).toFixed(2)}/mile (+ $0.10/mi wear)
            </div>
          </div>

          {/* Blacklisted High-Delay Merchants */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <ShieldX className="w-4 h-4 text-rose-400" />
              <span>Blacklisted / Slow Merchants:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Popeyes, Walmart Curbside..."
                value={newStoreInput}
                onChange={(e) => setNewStoreInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStore();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddStore}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {prefs.blacklistedStores.map((store, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/30 text-xs"
                >
                  <span>{store}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStore(idx)}
                    className="hover:text-rose-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Audio & Feedback settings */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Text-to-Speech Voice</div>
              <div className="text-[11px] text-slate-400">Speaks Accept/Decline over car speakers</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.voiceAnnouncements}
              onChange={(e) => setPrefs({ ...prefs, voiceAnnouncements: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
