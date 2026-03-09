// public/sounds/generate-sounds.js
// Run this in browser console to generate base64 sound

function generateBeep(frequency, duration) {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Success sound: 800Hz
generateBeep(800, 0.2);

// Error sound: 400Hz
generateBeep(400, 0.3);

// Bonus sound: 1000Hz
generateBeep(1000, 0.15);