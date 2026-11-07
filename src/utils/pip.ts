/**
 * Picture-in-Picture (PiP) Floating HUD Controller for Android and desktop.
 * Renders a compact, high-contrast overlay onto a canvas and streams it to a PiP video
 * so it floats on top of Uber Eats Driver and Spark Driver apps.
 */

import { GigAnalysisResult } from '../types';

class PipController {
  private canvas: HTMLCanvasElement | null = null;
  private video: HTMLVideoElement | null = null;
  private isPiPActive = false;

  private init() {
    if (typeof document === 'undefined') return;

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 480;
      this.canvas.height = 240;
    }

    if (!this.video) {
      this.video = document.createElement('video');
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.autoplay = true;

      // Stream canvas to video
      const stream = (this.canvas as any).captureStream ? (this.canvas as any).captureStream(15) : null;
      if (stream) {
        this.video.srcObject = stream;
        this.video.play().catch(() => {});
      }

      this.video.addEventListener('leavepictureinpicture', () => {
        this.isPiPActive = false;
      });
    }
  }

  drawOverlay(analysis: GigAnalysisResult | null) {
    this.init();
    if (!this.canvas) return;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    if (!analysis || !analysis.hasOffer) {
      // Idle standby radar screen
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(40, 40, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('GigPilot Android HUD', 65, 48);

      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Watching Uber Eats & Spark screen...', 30, 110);
      ctx.fillText('Keep offer on screen to auto-evaluate', 30, 145);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('● Floating Overlay Active', 30, 205);
      return;
    }

    const isAccept = analysis.verdict === 'ACCEPT';
    const isDecline = analysis.verdict === 'DECLINE';

    // Background color based on decision
    ctx.fillStyle = isAccept ? '#022c22' : isDecline ? '#4c0519' : '#451a03';
    ctx.fillRect(0, 0, w, h);

    // Glowing border
    ctx.strokeStyle = isAccept ? '#10b981' : isDecline ? '#f43f5e' : '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);

    // Platform tag
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(20, 16, 170, 36, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(analysis.platform || 'Gig App', 30, 40);

    // Giant Verdict Badge
    ctx.fillStyle = isAccept ? '#34d399' : isDecline ? '#fb7185' : '#fbbf24';
    ctx.font = '900 48px sans-serif';
    ctx.fillText(analysis.verdict, 20, 105);

    // Big Payout & Rate/Mile
    const payoutStr = analysis.offerDetails?.payout ? `$${analysis.offerDetails.payout.toFixed(2)}` : '';
    const rateStr = analysis.metrics?.dollarsPerMile ? `$${analysis.metrics.dollarsPerMile.toFixed(2)}/mi` : '';

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(payoutStr, w - 24, 85);

    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(rateStr, w - 24, 125);
    ctx.textAlign = 'start';

    // Headline / Store Name
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px sans-serif';
    const storeText = analysis.offerDetails?.pickupName || analysis.headline;
    ctx.fillText(storeText.slice(0, 34), 20, 160);

    // Quick Reason
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText(analysis.quickReason.slice(0, 48), 20, 195);
  }

  async togglePictureInPicture(analysis: GigAnalysisResult | null): Promise<boolean> {
    this.init();
    if (!this.video) return false;

    try {
      this.drawOverlay(analysis);

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        this.isPiPActive = false;
        return false;
      } else if (document.pictureInPictureEnabled && this.video.requestPictureInPicture) {
        // Ensure video is playing
        await this.video.play().catch(() => {});
        await this.video.requestPictureInPicture();
        this.isPiPActive = true;
        return true;
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
    return false;
  }

  get isActive() {
    return this.isPiPActive || Boolean(document.pictureInPictureElement);
  }
}

export const pipController = new PipController();
