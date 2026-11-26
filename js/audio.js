// Retro Web Audio API Synthesizer for SFX & Chiptune BGM
class RetroAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmEnabled = true;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.currentBiome = 'beach';
    this.masterGain = null;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.35;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.muted;
  }

  playTone(freq, duration, type = 'square', volume = 0.25, slideTo = null, delay = 0) {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playNoise(duration, volume = 0.2, filterFreq = 1200, delay = 0) {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + duration + 0.01);
  }

  sfx(name) {
    this.unlock();
    switch (name) {
      case 'jump':
        this.playTone(220, 0.13, 'square', 0.2, 520);
        break;
      case 'bounce':
        this.playTone(180, 0.18, 'triangle', 0.3, 720);
        break;
      case 'slash':
        this.playNoise(0.09, 0.25, 2100);
        this.playTone(420, 0.08, 'sawtooth', 0.12, 140);
        break;
      case 'hit':
        this.playNoise(0.08, 0.3, 700);
        this.playTone(160, 0.1, 'square', 0.22, 70);
        break;
      case 'hurt':
        this.playTone(240, 0.18, 'sawtooth', 0.28, 85);
        this.playNoise(0.14, 0.22, 500);
        break;
      case 'gem':
        this.playTone(660, 0.07, 'square', 0.18);
        this.playTone(990, 0.11, 'square', 0.18, null, 0.06);
        break;
      case 'heal':
        this.playTone(440, 0.08, 'triangle', 0.24);
        this.playTone(554, 0.08, 'triangle', 0.24, null, 0.07);
        this.playTone(659, 0.14, 'triangle', 0.24, null, 0.14);
        break;
      case 'relic':
        [523, 659, 784, 1046].forEach((f, i) => {
          this.playTone(f, 0.13, 'square', 0.2, null, i * 0.07);
        });
        break;
      case 'secret':
        [392, 494, 587, 784, 988].forEach((f, i) => {
          this.playTone(f, 0.14, 'triangle', 0.24, null, i * 0.08);
        });
        break;
      case 'splash':
        this.playNoise(0.18, 0.24, 950);
        this.playTone(300, 0.12, 'sine', 0.14, 140);
        break;
      case 'waterPower':
        this.playTone(420, 0.11, 'sine', 0.22, 860);
        this.playNoise(0.11, 0.18, 1600, 0.02);
        this.playTone(680, 0.09, 'triangle', 0.15, 360, 0.05);
        break;
      case 'tongue':
        this.playTone(340, 0.08, 'triangle', 0.22, 680);
        this.playTone(620, 0.07, 'square', 0.12, 420, 0.05);
        break;
      case 'burrow':
        this.playNoise(0.14, 0.22, 600);
        this.playTone(280, 0.09, 'triangle', 0.18, 170);
        break;
      case 'glow':
        this.playTone(587, 0.16, 'sine', 0.2, 880);
        this.playTone(880, 0.2, 'triangle', 0.15, 1175, 0.06);
        break;
      case 'checkpoint':
        this.playTone(440, 0.09, 'square', 0.18);
        this.playTone(587, 0.09, 'square', 0.18, null, 0.08);
        this.playTone(880, 0.18, 'square', 0.18, null, 0.16);
        break;
      case 'victory':
        [523, 659, 784, 659, 784, 1046].forEach((f, i) => {
          this.playTone(f, 0.16, 'square', 0.2, null, i * 0.1);
        });
        break;
      case 'gameover':
        [392, 349, 311, 261].forEach((f, i) => {
          this.playTone(f, 0.2, 'sawtooth', 0.2, null, i * 0.14);
        });
        break;
    }
  }

  startBgm(biome) {
    this.currentBiome = biome || 'beach';
    this.stopBgm();
    this.bgmStep = 0;

    // Gentle retro pentatonic / modal melodies per biome
    const patterns = {
      beach: {
        tempo: 195,
        wave: 'triangle',
        bassWave: 'sine',
        lead: [523, 0, 659, 784, 659, 0, 587, 523, 440, 0, 523, 659, 587, 0, 392, 0],
        bass: [131, 0, 196, 0, 175, 0, 196, 0, 110, 0, 165, 0, 196, 0, 147, 0]
      },
      jungle: {
        tempo: 180,
        wave: 'square',
        bassWave: 'triangle',
        lead: [440, 523, 587, 0, 659, 587, 523, 440, 392, 440, 523, 0, 587, 0, 494, 0],
        bass: [110, 0, 165, 110, 147, 0, 196, 0, 131, 0, 165, 0, 147, 0, 123, 0]
      },
      cave: {
        tempo: 230,
        wave: 'sine',
        bassWave: 'triangle',
        lead: [330, 0, 392, 0, 494, 0, 392, 330, 294, 0, 330, 0, 392, 0, 247, 0],
        bass: [82, 0, 123, 0, 98, 0, 123, 0, 73, 0, 110, 0, 98, 0, 62, 0]
      },
      temple: {
        tempo: 175,
        wave: 'square',
        bassWave: 'sawtooth',
        lead: [330, 330, 392, 440, 494, 0, 440, 392, 330, 294, 330, 0, 440, 392, 311, 0],
        bass: [82, 82, 98, 110, 123, 0, 110, 98, 82, 73, 82, 0, 110, 98, 78, 0]
      }
    };

    const pat = patterns[this.currentBiome] || patterns.beach;
    this.bgmTimer = setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running' || !this.bgmEnabled) return;
      const idx = this.bgmStep % pat.lead.length;
      const leadNote = pat.lead[idx];
      const bassNote = pat.bass[idx];
      if (leadNote > 0) {
        this.playTone(leadNote, pat.tempo / 1100, pat.wave, 0.055);
      }
      if (bassNote > 0) {
        this.playTone(bassNote, pat.tempo / 950, pat.bassWave, 0.05);
      }
      this.bgmStep++;
    }, pat.tempo);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.retroAudio = new RetroAudio();
