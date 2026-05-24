/**
 * self-contained synthesizer to generate cute, baby-friendly sounds
 * for correct answers, errors, clicks, and game success alerts.
 * Audio is completely synthesized client-side via the Web Audio API.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Play a cute bubble click sound
 */
export function playClickSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Warm triangle wave for bubbly nature
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (error) {
    console.warn('Audio Web API error:', error);
  }
}

/**
 * Play a sweet ascending success chime
 */
export function playCorrectSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle'; // Sweet flute/bell tone
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.005, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Sweet, quick arpeggio (C5 then E5 then G5)
    playTone(523.25, now, 0.15); // C5
    playTone(659.25, now + 0.08, 0.15); // E5
    playTone(783.99, now + 0.16, 0.25); // G5
  } catch (error) {
    console.warn('Audio Web API error:', error);
  }
}

/**
 * Play a harmless cute spring/boing sound
 */
export function playWrongSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    // Pitch slides down like a spring bouncy boing
    osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (error) {
    console.warn('Audio Web API error:', error);
  }
}

/**
 * Play a triumphant cheer melody
 */
export function playVictorySound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const playNote = (freq: number, delay: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.12, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.005, now + delay + dur);
      osc.start(now + delay);
      osc.stop(now + delay + dur);
    };

    // Upbeat happy scale (C5, E5, G5, C6)
    playNote(523.25, 0.0, 0.18);   // C5
    playNote(587.33, 0.15, 0.18);  // D5
    playNote(659.25, 0.3, 0.18);   // E5
    playNote(783.99, 0.45, 0.18);  // G5
    playNote(1046.50, 0.6, 0.4);   // C6 (High and long!)
  } catch (error) {
    console.warn('Audio Web API error:', error);
  }
}
