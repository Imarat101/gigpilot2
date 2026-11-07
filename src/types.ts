export interface OfferDetails {
  payout: number | null;
  distanceMiles: number | null;
  durationMinutes: number | null;
  pickupName: string | null;
  pickupAddress?: string | null;
  dropoffArea?: string | null;
  itemCount?: number | null;
  stopCount?: number | null;
  timerSecondsRemaining?: number | null;
}

export interface OfferMetrics {
  dollarsPerMile: number | null;
  dollarsPerHour: number | null;
  estimatedGasCost: number | null;
  netProfit: number | null;
  isProfitable: boolean;
  deadheadRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  merchantWaitRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  hasBlacklistedMerchant: boolean;
}

export interface GigAnalysisResult {
  hasOffer: boolean;
  platform: string;
  verdict: 'ACCEPT' | 'DECLINE' | 'CAUTION' | 'IDLE';
  confidenceScore: number;
  headline: string;
  spokenVerdict: string;
  quickReason: string;
  offerDetails?: OfferDetails;
  metrics?: OfferMetrics;
  positiveFactors?: string[];
  riskFactors?: string[];
  actionAdvice?: string;
}

export interface DriverPreferences {
  minDollarsPerMile: number;
  minDollarsPerHour: number;
  minPayout: number;
  gasPrice: number;
  vehicleMpg: number;
  blacklistedStores: string[];
  maxDistance: number;
  voiceAnnouncements: boolean;
  soundEffects: boolean;
  autoScanInterval: number; // in milliseconds (e.g. 2000)
}

export interface SessionOfferLog {
  id: string;
  timestamp: number;
  platform: string;
  payout: number | null;
  miles: number | null;
  verdict: 'ACCEPT' | 'DECLINE' | 'CAUTION';
  userAction?: 'accepted' | 'declined' | 'ignored';
  headline: string;
  thumbnail?: string;
  responseTimeMs: number;
}
