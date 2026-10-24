/**
 * Web Audio API Sound Synthesizer for ULTIMATE FC 3D
 * 100% procedural audio: Stadium crowd, kicks, whistle, net, crossbar, pack reveals.
 */

class FootballSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private crowdNoiseNode: AudioBufferSourceNode | null = null;
  private isCrowdPlaying: boolean = false;

  public soundEnabled: boolean = true;
  public masterVolume: number = 0.8;
  public crowdVolume: number = 0.5;
  public sfxVolume: number = 0.8;

  constructor() {
    // Initialized on user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.crowdGain = this.ctx.createGain();
      this.crowdGain.gain.value = this.crowdVolume;
      this.crowdGain.connect(this.masterGain);

      this.setupCrowdSound();
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Continuous realistic stadium crowd atmosphere
  private setupCrowdSound() {
    if (!this.ctx || !this.crowdGain) return;

    // Pink/Brown noise buffer for crowd murmurs
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
    }

    this.crowdNoiseNode = this.ctx.createBufferSource();
    this.crowdNoiseNode.buffer = noiseBuffer;
    this.crowdNoiseNode.loop = true;

    // Filter to sound like distant roar in stadium bowl
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 1.2;

    this.crowdNoiseNode.connect(filter);
    filter.connect(this.crowdGain);
    this.crowdNoiseNode.start();
    this.isCrowdPlaying = true;
  }

  public cheerGoal() {
    if (!this.ctx || !this.soundEnabled || !this.crowdGain) return;
    const now = this.ctx.currentTime;
    // Roar swelling
    this.crowdGain.gain.cancelScheduledValues(now);
    this.crowdGain.gain.setValueAtTime(this.crowdVolume, now);
    this.crowdGain.gain.exponentialRampToValueAtTime(this.crowdVolume * 2.8, now + 0.5);
    this.crowdGain.gain.exponentialRampToValueAtTime(this.crowdVolume, now + 4.5);
  }

  public playKick(power: number = 0.5) {
    if (!this.ctx || !this.soundEnabled || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const p = Math.max(0.2, Math.min(power, 1.0));
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 * p + 40, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.12);

      gain.gain.setValueAtTime(0.7 * p * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // fallback
    }
  }

  public playWhistle(type: 'short' | 'double' | 'long' = 'short') {
    if (!this.ctx || !this.soundEnabled || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const playTone = (startOffset: number, duration: number) => {
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2500, now + startOffset);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(2850, now + startOffset);

      gain.gain.setValueAtTime(0.35 * this.sfxVolume, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + startOffset + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain!);

      osc1.start(now + startOffset);
      osc2.start(now + startOffset);
      osc1.stop(now + startOffset + duration + 0.02);
      osc2.stop(now + startOffset + duration + 0.02);
    };

    if (type === 'short') {
      playTone(0, 0.22);
    } else if (type === 'double') {
      playTone(0, 0.15);
      playTone(0.22, 0.3);
    } else {
      // Long full-time
      playTone(0, 0.15);
      playTone(0.22, 0.15);
      playTone(0.45, 0.65);
    }
  }

  public playNetRattle() {
    if (!this.ctx || !this.soundEnabled || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // White noise flutter
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playCrossbarDing() {
    if (!this.ctx || !this.soundEnabled || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

    gain.gain.setValueAtTime(0.55 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playPackReveal() {
    if (!this.ctx || !this.soundEnabled || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Fanfare chords (C - E - G - B - High C)
    const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.42);
    });
  }

  public playClick() {
    if (!this.ctx || !this.soundEnabled || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }
}

export const footballAudio = new FootballSoundEngine();
