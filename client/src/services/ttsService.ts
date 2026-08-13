/**
 * Web Speech API Text-To-Speech Service for hands-free driving voice callouts
 */

let synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

export function speakText(text: string, speed: 'slow' | 'normal' | 'fast' = 'normal'): void {
  if (!synth) {
    console.warn('Web Speech API is not supported on this browser.');
    return;
  }

  // Cancel any ongoing speech to deliver fresh alert promptly
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Set rate based on settings
  switch (speed) {
    case 'slow':
      utterance.rate = 0.85;
      break;
    case 'fast':
      utterance.rate = 1.25;
      break;
    default:
      utterance.rate = 1.0;
      break;
  }

  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Prefer natural English voice if available
  const voices = synth.getVoices();
  const selectedVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (synth) {
    synth.cancel();
  }
}
