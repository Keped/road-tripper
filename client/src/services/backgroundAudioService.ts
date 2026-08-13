/**
 * Maintains an active audio context session & MediaSession state
 * so iOS Safari / Android Chrome do not suspend JavaScript execution or Geolocation API
 * when the app goes into the background or Waze is active.
 */

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let wakeLock: WakeLockSentinel | null = null;

export async function enableBackgroundPersistence(): Promise<void> {
  // 1. Audio Session Lock
  try {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioCtx();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (!oscillator) {
      // Create a virtually silent oscillator pulse (0.0001 volume at 20Hz sub-bass)
      oscillator = audioContext.createOscillator();
      gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(20, audioContext.currentTime); // 20Hz sub-audible tone
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
    }

    // Set MediaSession metadata to appear as active audio session
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'RoadPulse Navigation Co-Pilot',
        artist: 'RoadPulse Live GPS',
        album: 'Route Intelligence',
      });
      navigator.mediaSession.playbackState = 'playing';
    }
  } catch (err) {
    console.warn('Could not initialize background audio session:', err);
  }

  // 2. Screen Wake Lock API (keeps screen active when mounted in car)
  requestWakeLock();
}

export function disableBackgroundPersistence(): void {
  try {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      oscillator = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    releaseWakeLock();
  } catch (err) {
    console.warn('Error stopping background persistence:', err);
  }
}

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
    }
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(console.error);
    wakeLock = null;
  }
}
