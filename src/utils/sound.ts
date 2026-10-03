class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public hapticsEnabled: boolean = true;

  constructor() {
    try {
      const savedSound = localStorage.getItem('arrow_puzzle_sound');
      const savedHaptics = localStorage.getItem('arrow_puzzle_haptics');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';
      if (savedHaptics !== null) this.hapticsEnabled = savedHaptics === 'true';
    } catch {
      // ignore
    }
  }

  private getContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(val: boolean) {
    this.soundEnabled = val;
    try {
      localStorage.setItem('arrow_puzzle_sound', String(val));
    } catch {}
  }

  public setHapticsEnabled(val: boolean) {
    this.hapticsEnabled = val;
    try {
      localStorage.setItem('arrow_puzzle_haptics', String(val));
    } catch {}
  }

  public vibrate(pattern: number | number[]) {
    if (!this.hapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  public playArrowSlide(comboIndex: number = 0) {
    this.vibrate(12);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 360 + Math.min(comboIndex * 28, 280);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.65, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playArrowBlocked() {
    this.vibrate([35, 40, 35]);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.22);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playClick() {
    this.vibrate(8);
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.045);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playPraise() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    });
  }

  public playVictoryFanfare() {
    this.vibrate([25, 50, 45]);
    const ctx = this.getContext();
    if (!ctx) return;

    const chordNotes = [
      { freq: 523.25, delay: 0.0, duration: 0.35 },
      { freq: 659.25, delay: 0.08, duration: 0.35 },
      { freq: 783.99, delay: 0.16, duration: 0.35 },
      { freq: 1046.5, delay: 0.24, duration: 0.75 },
      { freq: 783.99, delay: 0.24, duration: 0.75 },
      { freq: 659.25, delay: 0.24, duration: 0.75 },
    ];

    chordNotes.forEach(({ freq, delay, duration }) => {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    });
  }
}

export const sound = new SoundManager();
