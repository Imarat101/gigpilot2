import React from 'react';
import { Minimize2, Volume2, Zap, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { GigAnalysisResult } from '../types';
import { soundController } from '../utils/audio';

interface HudOverlayProps {
  analysis: GigAnalysisResult | null;
  isAnalyzing: boolean;
  onCloseHud: () => void;
  onScanNow: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  analysis,
  isAnalyzing,
  onCloseHud,
  onScanNow,
}) => {
  const isAccept = analysis?.verdict === 'ACCEPT';
  const isDecline = analysis?.verdict === 'DECLINE';
  const isCaution = analysis?.verdict === 'CAUTION';

  const bgColor = isAccept
    ? 'bg-emerald-950 text-white'
    : isDecline
    ? 'bg-rose-950 text-white'
    : isCaution
    ? 'bg-amber-950 text-white'
    : 'bg-black text-white';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 ${bgColor} select-none overflow-hidden transition-colors duration-300`}
    >
      {/* Top HUD Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-mono font-bold tracking-widest uppercase">
            HUD MODE
          </span>
          <span className="text-sm font-semibold opacity-80">
            {analysis?.platform || 'GigPilot Scanner'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {analysis?.spokenVerdict && (
            <button
              onClick={() => soundController.speak(analysis.spokenVerdict)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={onCloseHud}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Exit HUD"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Center Giant Verdict */}
      <div className="text-center my-auto flex flex-col items-center">
        {analysis && analysis.hasOffer ? (
          <>
            <div className="flex items-center justify-center gap-3 mb-4">
              {isAccept && <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-400" />}
              {isDecline && <XCircle className="w-16 h-16 sm:w-20 sm:h-20 text-rose-400" />}
              {isCaution && <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400" />}
            </div>

            <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase mb-4 drop-shadow-md">
              {analysis.verdict}
            </h1>

            <p className="text-xl sm:text-3xl font-bold max-w-2xl opacity-90 mb-8 leading-snug">
              {analysis.headline}
            </p>

            {/* Giant Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-center bg-black/40 backdrop-blur-md px-8 py-5 rounded-3xl border border-white/10">
              <div>
                <div className="text-xs sm:text-sm font-medium opacity-70">PAYOUT</div>
                <div className="text-3xl sm:text-5xl font-mono font-black">
                  {analysis.offerDetails?.payout ? `$${analysis.offerDetails.payout.toFixed(2)}` : 'N/A'}
                </div>
              </div>

              <div className="w-px h-12 bg-white/20 hidden sm:block"></div>

              <div>
                <div className="text-xs sm:text-sm font-medium opacity-70">RATE / MILE</div>
                <div className="text-3xl sm:text-5xl font-mono font-black text-emerald-400">
                  {analysis.metrics?.dollarsPerMile ? `$${analysis.metrics.dollarsPerMile.toFixed(2)}` : 'N/A'}
                </div>
              </div>

              <div className="w-px h-12 bg-white/20 hidden sm:block"></div>

              <div>
                <div className="text-xs sm:text-sm font-medium opacity-70">HOURLY PACE</div>
                <div className="text-3xl sm:text-5xl font-mono font-black text-cyan-400">
                  {analysis.metrics?.dollarsPerHour ? `$${Math.round(analysis.metrics.dollarsPerHour)}/hr` : 'N/A'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-white/20 border-t-white animate-spin mb-6"></div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-2">
              Waiting for Offer
            </h2>
            <p className="text-base sm:text-lg opacity-70 max-w-md">
              Point phone camera or mirror gig app screen.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="flex justify-center">
        <button
          onClick={onScanNow}
          disabled={isAnalyzing}
          className="w-full max-w-md py-5 rounded-2xl bg-white text-slate-950 font-black text-xl shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <Zap className="w-6 h-6 fill-current text-emerald-600" />
          <span>{isAnalyzing ? 'Scanning...' : 'Scan Screen Now'}</span>
        </button>
      </div>
    </div>
  );
};
