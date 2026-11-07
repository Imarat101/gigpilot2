import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Navigation,
  DollarSign,
  Fuel,
  Volume2,
  Store,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from 'lucide-react';
import { GigAnalysisResult, DriverPreferences } from '../types';
import { soundController } from '../utils/audio';

interface VerdictCardProps {
  analysis: GigAnalysisResult | null;
  isAnalyzing: boolean;
  preferences: DriverPreferences;
  onRecordAction: (action: 'accepted' | 'declined') => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  analysis,
  isAnalyzing,
  preferences,
  onRecordAction,
}) => {
  if (isAnalyzing && !analysis) {
    return (
      <div className="h-full rounded-2xl bg-slate-950 border border-slate-800 p-8 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Analyzing Gig Screen...</h3>
        <p className="text-slate-400 text-sm max-w-sm">
          Gemini 3.8 Flash is calculating $/mile, wait times, fuel expense, and profitability.
        </p>
      </div>
    );
  }

  if (!analysis || !analysis.hasOffer) {
    return (
      <div className="h-full rounded-2xl bg-slate-950 border border-slate-800 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
          <Navigation className="w-8 h-8 animate-pulse" />
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 mb-3">
          STANDBY RADAR
        </span>
        <h3 className="text-lg font-bold text-white mb-2">
          {analysis ? analysis.headline || 'No Active Gig Offer Detected' : 'Waiting for Gig Offer Screen'}
        </h3>
        <p className="text-slate-400 text-xs max-w-sm leading-relaxed mb-6">
          Point camera at your mounted phone, mirror your screen, or drop a screenshot to evaluate incoming offers in real time.
        </p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-left">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Target Pay/Mi</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              ${preferences.minDollarsPerMile.toFixed(2)}/mi
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Target Hourly</div>
            <div className="text-sm font-bold text-cyan-400 font-mono">
              ${preferences.minDollarsPerHour.toFixed(2)}/hr
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { verdict, headline, quickReason, spokenVerdict, offerDetails, metrics, positiveFactors, riskFactors } =
    analysis;

  const isAccept = verdict === 'ACCEPT';
  const isDecline = verdict === 'DECLINE';
  const isCaution = verdict === 'CAUTION';

  const badgeTheme = isAccept
    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/30'
    : isDecline
    ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30'
    : 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30';

  const containerGlow = isAccept
    ? 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.12)]'
    : isDecline
    ? 'border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.12)]'
    : 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.12)]';

  return (
    <div
      className={`rounded-2xl bg-slate-950 border ${containerGlow} p-4 sm:p-6 flex flex-col justify-between gap-5 h-full transition-all`}
    >
      <div>
        {/* Top Header: Platform & Verdict Badge */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-bold text-slate-200">
              {analysis.platform || 'Gig App'}
            </span>
            {offerDetails?.timerSecondsRemaining ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {offerDetails.timerSecondsRemaining}s Left
              </span>
            ) : null}
          </div>

          {/* Voice Replay Button */}
          <button
            onClick={() => soundController.speak(spokenVerdict || headline)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
            title="Replay Voice Audio Announcement"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold">Speak Verdict</span>
          </button>
        </div>

        {/* Giant Main Verdict Card */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-xl flex items-center justify-between gap-4 mb-4 ${
            isAccept
              ? 'bg-gradient-to-br from-emerald-950/80 via-emerald-900/30 to-slate-950 border-emerald-500/40'
              : isDecline
              ? 'bg-gradient-to-br from-rose-950/80 via-rose-900/30 to-slate-950 border-rose-500/40'
              : 'bg-gradient-to-br from-amber-950/80 via-amber-900/30 to-slate-950 border-amber-500/40'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-md ${badgeTheme}`}
              >
                {isAccept && <CheckCircle2 className="w-4 h-4" />}
                {isDecline && <XCircle className="w-4 h-4" />}
                {isCaution && <AlertTriangle className="w-4 h-4" />}
                {verdict}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {analysis.confidenceScore}% Confidence
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {headline}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-snug">{quickReason}</p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">Payout</div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-white">
              {offerDetails?.payout ? `$${offerDetails.payout.toFixed(2)}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* 4 Core Driver Metrics KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {/* Rate Per Mile */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Rate / Mile</span>
              <TrendingUp className="w-3 h-3 text-slate-500" />
            </div>
            <div
              className={`text-lg font-black font-mono mt-0.5 ${
                metrics?.dollarsPerMile && metrics.dollarsPerMile >= preferences.minDollarsPerMile
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics?.dollarsPerMile ? `$${metrics.dollarsPerMile.toFixed(2)}` : '—'}
              <span className="text-[11px] text-slate-500 font-normal">/mi</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {offerDetails?.distanceMiles ? `${offerDetails.distanceMiles} total mi` : ''}
            </div>
          </div>

          {/* Rate Per Hour */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Hourly Pace</span>
              <Clock className="w-3 h-3 text-slate-500" />
            </div>
            <div
              className={`text-lg font-black font-mono mt-0.5 ${
                metrics?.dollarsPerHour && metrics.dollarsPerHour >= preferences.minDollarsPerHour
                  ? 'text-cyan-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics?.dollarsPerHour ? `$${Math.round(metrics.dollarsPerHour)}` : '—'}
              <span className="text-[11px] text-slate-500 font-normal">/hr</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {offerDetails?.durationMinutes ? `${offerDetails.durationMinutes} min trip` : ''}
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Net Profit</span>
              <DollarSign className="w-3 h-3 text-slate-500" />
            </div>
            <div
              className={`text-lg font-black font-mono mt-0.5 ${
                metrics?.netProfit && metrics.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics?.netProfit ? `$${metrics.netProfit.toFixed(2)}` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Fuel: -${metrics?.estimatedGasCost?.toFixed(2) ?? '0.00'}
            </div>
          </div>

          {/* Deadhead Risk */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Deadhead Risk</span>
              <Fuel className="w-3 h-3 text-slate-500" />
            </div>
            <div
              className={`text-sm font-black mt-1 uppercase ${
                metrics?.deadheadRisk === 'LOW'
                  ? 'text-emerald-400'
                  : metrics?.deadheadRisk === 'HIGH'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {metrics?.deadheadRisk || 'MEDIUM'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Wait: {metrics?.merchantWaitRisk || 'LOW'}
            </div>
          </div>
        </div>

        {/* Location & Merchant Breakdown */}
        {(offerDetails?.pickupName || offerDetails?.dropoffArea) && (
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs space-y-1.5 mb-4">
            {offerDetails.pickupName && (
              <div className="flex items-start gap-2">
                <Store className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-slate-200">
                  <span className="font-bold text-white">{offerDetails.pickupName}</span>
                  {offerDetails.pickupAddress && (
                    <span className="text-slate-400 text-[11px] ml-1.5">
                      ({offerDetails.pickupAddress})
                    </span>
                  )}
                  {offerDetails.itemCount && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                      {offerDetails.itemCount} items
                    </span>
                  )}
                </div>
              </div>
            )}

            {offerDetails.dropoffArea && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-slate-300">
                  <span>Drop: </span>
                  <span className="font-semibold text-white">{offerDetails.dropoffArea}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pros & Cons / Risk Factors Tags */}
        <div className="space-y-2 mb-2">
          {positiveFactors && positiveFactors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {positiveFactors.map((pro, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {pro}
                </span>
              ))}
            </div>
          )}

          {riskFactors && riskFactors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {riskFactors.map((risk, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-500/30"
                >
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  {risk}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Driver Decision Action Row */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          {analysis.actionAdvice || 'What did you decide?'}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRecordAction('accepted')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Took Offer</span>
          </button>

          <button
            onClick={() => onRecordAction('declined')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Passed / Declined</span>
          </button>
        </div>
      </div>
    </div>
  );
};
