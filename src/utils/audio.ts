/**
 * Audio feedback utilities: Web Audio synthesized sound effects & Text-to-Speech
 */

class SoundController {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Upbeat, positive chime for ACCEPT
  playAcceptChime() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Arpeggio chord: C5 -> E5 -> G5
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.setValueAtTime(659.25, now + 0.08);
      osc1.frequency.setValueAtTime(783.99, now + 0.16);

      osc2.frequency.setValueAtTime(1046.5, now + 0.16); // High C6 sparkle

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.16);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  // Low warning buzz for DECLINE
  playDeclineBuzz() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(130, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  // Neutral double alert for CAUTION
  playCautionBeep() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(440, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.setValueAtTime(0.01, now + 0.08);
      gain.gain.setValueAtTime(0.18, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  // Text-To-Speech announcement
  speak(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const cleanText = text.replace(/[*#_~]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.08; // slightly brisk for driving urgency
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Daniel'))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error', err);
    }
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundController = new SoundController();
