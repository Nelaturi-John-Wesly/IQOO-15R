/**
 * Web Audio API synthesizer for focus ambient sounds:
 * - Rain simulation (filtered noise + pink noise drops)
 * - White/Pink Noise (soothing constant frequency mask)
 * - Binaural Alpha/Gamma focus tone (stereo frequency offset)
 */

class FocusAudioManager {
  private ctx: AudioContext | null = null;
  private currentMode: 'none' | 'whitenoise' | 'rain' | 'binaural' = 'none';
  private gainNode: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private volume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  stop() {
    this.activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        window.clearInterval(node);
      } else if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
        try {
          (node as AudioScheduledSourceNode).stop();
        } catch {}
      } else if ('disconnect' in node) {
        try {
          node.disconnect();
        } catch {}
      }
    });
    this.activeNodes = [];
    this.currentMode = 'none';
  }

  play(mode: 'none' | 'whitenoise' | 'rain' | 'binaural', volume = 0.5) {
    this.stop();
    if (mode === 'none') return;

    this.initContext();
    if (!this.ctx) return;

    this.volume = volume;
    this.currentMode = mode;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (mode === 'whitenoise') {
      this.startPinkNoise();
    } else if (mode === 'rain') {
      this.startRain();
    } else if (mode === 'binaural') {
      this.startBinauralFocus();
    }
  }

  private startPinkNoise() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Gentle low-pass filter for cozy sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();

    this.activeNodes.push(whiteNoise, filter);
  }

  private startRain() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 3 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    // Bandpass + Lowpass for rain sound
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1200, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(2400, this.ctx.currentTime);

    rainSource.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(this.gainNode);
    rainSource.start();

    this.activeNodes.push(rainSource, bandpass, lowpass);
  }

  private startBinauralFocus() {
    if (!this.ctx || !this.gainNode) return;

    // 200 Hz base carrier with 14 Hz Beta difference (200 Hz left, 214 Hz right) for active focus & cognition
    const merger = this.ctx.createChannelMerger(2);

    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(196, this.ctx.currentTime);

    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(210, this.ctx.currentTime);

    const gainL = this.ctx.createGain();
    const gainR = this.ctx.createGain();
    gainL.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gainR.gain.setValueAtTime(0.18, this.ctx.currentTime);

    oscL.connect(gainL);
    oscR.connect(gainR);

    gainL.connect(merger, 0, 0); // left channel
    gainR.connect(merger, 0, 1); // right channel

    merger.connect(this.gainNode);

    oscL.start();
    oscR.start();

    this.activeNodes.push(oscL, oscR, gainL, gainR, merger);
  }

  getCurrentMode() {
    return this.currentMode;
  }
}

export const focusAudio = new FocusAudioManager();
