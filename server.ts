import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
// @ts-ignore - archiver v8 ESM export
import { ZipArchive } from 'archiver';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    });
  });

  // Analyze Gig Offer API
  app.post('/api/analyze-gig', async (req, res) => {
    const startTime = Date.now();
    try {
      const { image, mimeType = 'image/jpeg', userPreferences = {} } = req.body;

      if (!image) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured in environment or Secrets.',
        });
      }

      // Strip data URL header if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

      const {
        minDollarsPerMile = 1.5,
        minDollarsPerHour = 22.0,
        minPayout = 5.0,
        gasPrice = 3.65,
        vehicleMpg = 26,
        blacklistedStores = ['Popeyes', 'Wingstop', 'Walmart Curbside', 'Dollar General'],
        maxDistance = 15,
      } = userPreferences;

      const systemInstruction = `You are GigPilot AI, the world's fastest, most accurate real-time co-pilot for gig workers (DoorDash, Uber Eats, Uber Rides, Lyft, Instacart, Spark Driver, Amazon Flex, Grubhub).
Your mission: Inspect the screen/camera video frame of a gig app offer and determine in milliseconds whether the gig worker should ACCEPT, DECLINE, or proceed with CAUTION.

Driver Profile & Preferences:
- Minimum acceptable pay per mile: $${minDollarsPerMile}/mi
- Minimum acceptable hourly rate: $${minDollarsPerHour}/hr
- Minimum absolute payout floor: $${minPayout}
- Fuel price: $${gasPrice}/gal | Vehicle efficiency: ${vehicleMpg} MPG (Est. fuel cost: $${(gasPrice / vehicleMpg).toFixed(2)}/mi)
- Blacklisted / High-Delay Merchants: ${JSON.stringify(blacklistedStores)}
- Maximum distance threshold: ${maxDistance} miles

Guidelines:
1. Examine if there is an active offer, trip request, or delivery batch on screen.
2. If NO offer is visible (e.g., driver is looking at GPS navigation, idle looking for orders, phone home screen, or blurred frame), set hasOffer: false with clear friendly status.
3. If an offer IS visible:
   - Extract: platform name, payout amount, total miles, estimated duration minutes, pickup merchant/location, dropoff destination, item/stop count, offer timer remaining if visible.
   - Calculate exact metrics:
     * dollarsPerMile = payout / miles
     * dollarsPerHour = payout / (durationMinutes / 60)
     * estimatedGasCost = (miles / vehicleMpg) * gasPrice
     * estimatedWearAndTear = miles * 0.10
     * netProfit = payout - estimatedGasCost - estimatedWearAndTear
   - Check risks:
     * Is merchant in blacklist or notoriously slow?
     * Is the delivery into deadhead territory (rural/far from merchant clusters requiring empty drive back)?
     * Are there excessive items, heavy batches (e.g. water cases in Instacart), multiple complex stops, or apartment buildings?
     * Is the $/mi below the driver's threshold?
   - Deliver an unambiguous Verdict:
     * 'ACCEPT' -> Highly profitable, beat $/mi and $/hr thresholds, good merchant.
     * 'DECLINE' -> Sub-par pay (< $1.25/mi or below minimums), blacklisted merchant, terrible deadhead, or high labor for low pay.
     * 'CAUTION' -> Marginally acceptable, or high pay but high risk (e.g., 40 min wait time or difficult downtown parking).
   - Provide a spokenVerdict: A crisp, 1-2 sentence audio announcement string written for voice synthesizer. Example: "Accept! $14.50 for 3 miles. That's $36 an hour with Chipotle." or "Decline! Only 50 cents a mile for Popeyes with zero tip."
`;

      const callGeminiWithRetry = async () => {
        const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
        let lastErr: any = null;

        for (const model of modelsToTry) {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              return await ai.models.generateContent({
                model,
                contents: {
                  parts: [
                    {
                      inlineData: {
                        mimeType,
                        data: base64Data,
                      },
                    },
                    {
                      text: 'Analyze this gig screen now. Return complete structured JSON evaluating the offer according to system instructions.',
                    },
                  ],
                },
                config: {
                  systemInstruction,
                  responseMimeType: 'application/json',
                  thinkingConfig: model === 'gemini-3.8-flash' ? {
                    thinkingLevel: ThinkingLevel.LOW,
                  } : undefined,
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      hasOffer: {
                        type: Type.BOOLEAN,
                        description: 'True if an active gig offer/order/batch is detected on screen.',
                      },
                      platform: {
                        type: Type.STRING,
                        description: 'App name: DoorDash, Uber Eats, Uber Rides, Lyft, Instacart, Amazon Flex, Spark, Grubhub, or Other/Unknown',
                      },
                      verdict: {
                        type: Type.STRING,
                        description: 'ACCEPT, DECLINE, CAUTION, or IDLE if no offer',
                      },
                      confidenceScore: {
                        type: Type.INTEGER,
                        description: 'Confidence rating from 0 to 100',
                      },
                      headline: {
                        type: Type.STRING,
                        description: 'Short 3-6 word summary headline e.g. "INSTANT ACCEPT - High Yield"',
                      },
                      spokenVerdict: {
                        type: Type.STRING,
                        description: 'Punchy 1-2 sentence voice announcement for driver audio read-out',
                      },
                      quickReason: {
                        type: Type.STRING,
                        description: 'Clear bullet or 1 sentence explanation of why to take or decline',
                      },
                      offerDetails: {
                        type: Type.OBJECT,
                        properties: {
                          payout: { type: Type.NUMBER, description: 'Offer payout in dollars' },
                          distanceMiles: { type: Type.NUMBER, description: 'Total trip distance in miles' },
                          durationMinutes: { type: Type.NUMBER, description: 'Estimated time in minutes' },
                          pickupName: { type: Type.STRING, description: 'Store, restaurant, or pickup name' },
                          pickupAddress: { type: Type.STRING, description: 'Pickup address or neighborhood' },
                          dropoffArea: { type: Type.STRING, description: 'Dropoff neighborhood, city, or zone' },
                          itemCount: { type: Type.INTEGER, description: 'Items or units count' },
                          stopCount: { type: Type.INTEGER, description: 'Number of stops or deliveries' },
                          timerSecondsRemaining: { type: Type.INTEGER, description: 'Offer countdown seconds if visible' },
                        },
                      },
                      metrics: {
                        type: Type.OBJECT,
                        properties: {
                          dollarsPerMile: { type: Type.NUMBER, description: 'Payout divided by miles' },
                          dollarsPerHour: { type: Type.NUMBER, description: 'Projected hourly rate' },
                          estimatedGasCost: { type: Type.NUMBER, description: 'Estimated fuel expense' },
                          netProfit: { type: Type.NUMBER, description: 'Payout minus fuel and wear' },
                          isProfitable: { type: Type.BOOLEAN, description: 'Whether net profit is positive and good' },
                          deadheadRisk: { type: Type.STRING, description: 'LOW, MEDIUM, or HIGH risk of empty return' },
                          merchantWaitRisk: { type: Type.STRING, description: 'LOW, MEDIUM, or HIGH risk of delay' },
                          hasBlacklistedMerchant: { type: Type.BOOLEAN, description: 'True if merchant matches blacklist' },
                        },
                      },
                      positiveFactors: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Pros of this order (e.g. "Over $3.00/mile", "Short distance")',
                      },
                      riskFactors: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Cons or red flags (e.g. "Long wait at drive-thru", "Deadhead suburb")',
                      },
                      actionAdvice: {
                        type: Type.STRING,
                        description: 'Concrete next action for the worker',
                      },
                    },
                    required: ['hasOffer', 'platform', 'verdict', 'headline', 'spokenVerdict', 'quickReason'],
                  },
                },
              });
            } catch (err: any) {
              lastErr = err;
              console.warn(`Attempt ${attempt + 1} with ${model} failed: ${err.message}`);
              // brief pause before retry
              await new Promise((r) => setTimeout(r, 400));
            }
          }
        }
        throw lastErr;
      };

      const response = await callGeminiWithRetry();

      const responseTimeMs = Date.now() - startTime;
      const parsed = JSON.parse(response.text || '{}');

      res.json({
        success: true,
        responseTimeMs,
        analysis: parsed,
      });
    } catch (err: any) {
      console.error('Error analyzing gig offer:', err);
      res.status(500).json({
        error: err.message || 'Failed to analyze offer',
        details: err.toString(),
      });
    }
  });

  // Serve manifest and service worker with strict PWA headers for Chrome installability
  app.get('/manifest.webmanifest', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, 'public', 'manifest.webmanifest'));
  });

  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, 'public', 'sw.js'));
  });

  // Native Android Studio Project (.zip) Download Endpoint
  app.get('/api/download-android-project', (req, res) => {
    try {
      const androidDir = path.join(__dirname, 'android');
      if (!fs.existsSync(androidDir)) {
        return res.status(404).json({ error: 'Android native project directory not found' });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="GigPilot-Android-Native-App.zip"');

      // @ts-ignore
      const archive = new ZipArchive({
        zlib: { level: 9 },
      });

      archive.on('error', (err: any) => {
        console.error('Archiver error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: err.message });
        }
      });

      archive.pipe(res);
      archive.directory(androidDir, 'android');
      if (fs.existsSync(path.join(__dirname, 'capacitor.config.ts'))) {
        archive.file(path.join(__dirname, 'capacitor.config.ts'), { name: 'capacitor.config.ts' });
      }
      archive.finalize();
    } catch (err: any) {
      console.error('Download Android project error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // In production serve dist, in development mount Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GigPilot AI] Server live on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[GigPilot AI] Server startup error:', err);
  process.exit(1);
});
