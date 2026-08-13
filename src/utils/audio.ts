export class RetroSynth {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: any = null;

  private notes = [
    523.25, // C5
    659.25, // E5
    783.99, // G5
    1046.50, // C6
    783.99, // G5
    659.25, // E5
    523.25, // C5
    392.00  // G4
  ];

  public play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    // Initialize AudioContext on first user interaction
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    let noteIndex = 0;
    const playNote = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(this.notes[noteIndex], this.audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.15);

      noteIndex = (noteIndex + 1) % this.notes.length;
    };

    // Upbeat tempo
    this.intervalId = setInterval(playNote, 150);
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const gameAudio = new RetroSynth();
