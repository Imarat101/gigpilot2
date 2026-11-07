import React from 'react';
import {
  X,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  ShieldCheck,
  Fuel,
  Trash2,
} from 'lucide-react';
import { SessionOfferLog } from '../types';

interface SessionStatsProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SessionOfferLog[];
  onClearLogs: () => void;
}

export const SessionStats: React.FC<SessionStatsProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  const totalOffers = logs.length;
  const acceptedCount = logs.filter((l) => l.userAction === 'accepted' || (!l.userAction && l.verdict === 'ACCEPT')).length;
  const declinedCount = logs.filter((l) => l.userAction === 'declined' || (!l.userAction && l.verdict === 'DECLINE')).length;
  const acceptanceRate = totalOffers > 0 ? Math.round((acceptedCount / totalOffers) * 100) : 0;

  // Potential earnings from accepted offers
  const totalGrossAccepted = logs
    .filter((l) => l.userAction === 'accepted' || (!l.userAction && l.verdict === 'ACCEPT'))
    .reduce((sum, item) => sum + (item.payout || 0), 0);

  // Deadhead / bad miles avoided from declined offers
  const badMilesAvoided = logs
    .filter((l) => l.userAction === 'declined' || (!l.userAction && l.verdict === 'DECLINE'))
    .reduce((sum, item) => sum + (item.miles || 0), 0);

  const estimatedGasSaved = (badMilesAvoided / 25) * 3.65;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Shift Earnings & Decision History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* 4 Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Total Analyzed</div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {totalOffers}
              </div>
              <div className="text-[10px] text-slate-500">Live offer scans</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Acceptance Rate</div>
              <div className="text-2xl font-black text-cyan-400 font-mono mt-0.5">
                {acceptanceRate}%
              </div>
              <div className="text-[10px] text-slate-500">{acceptedCount} taken / {declinedCount} skipped</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Potential Gross</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                ${totalGrossAccepted.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500">From accepted orders</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Bad Miles Saved</div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {badMilesAvoided.toFixed(1)} <span className="text-xs">mi</span>
              </div>
              <div className="text-[10px] text-amber-400/80">~${estimatedGasSaved.toFixed(2)} fuel saved</div>
            </div>
          </div>

          {/* Offer History Log List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Scanned Offers Log</h3>
              {logs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Shift Log
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No offers logged in this session yet. Scan live gig screens or drop screenshots to see real-time profitability results here!
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {logs.map((log) => {
                  const isAcc = log.verdict === 'ACCEPT';
                  const isDec = log.verdict === 'DECLINE';
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] ${
                            isAcc
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isDec
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isAcc ? '✓' : isDec ? '✕' : '!'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{log.platform}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ⚡ {log.responseTimeMs}ms
                            </span>
                          </div>
                          <div className="text-slate-300 text-[11px] truncate max-w-sm mt-0.5">
                            {log.headline}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-white text-sm">
                          {log.payout ? `$${log.payout.toFixed(2)}` : 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.miles ? `${log.miles} mi` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
