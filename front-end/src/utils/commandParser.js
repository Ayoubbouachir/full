/**
 * Parse voice command from transcript (French + English).
 * Commands: envoie, efface, stop, répète, mute, unmute
 * @param {string} transcript
 * @returns {{ command: string | null, rest: string }}
 */
export function parseVoiceCommand(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return { command: null, rest: '' };
  }
  const t = transcript.trim().toLowerCase();
  const first = t.split(/\s+/)[0] || '';

  const map = {
    envoie: 'envoie',
    envoyer: 'envoie',
    send: 'envoie',
    efface: 'efface',
    effacer: 'efface',
    clear: 'efface',
    stop: 'stop',
    arrête: 'stop',
    arrêter: 'stop',
    répète: 'répète',
    repete: 'répète',
    répéter: 'répète',
    repeat: 'répète',
    mute: 'mute',
    coupe: 'mute',
    couper: 'mute',
    unmute: 'unmute',
    réactive: 'unmute',
    réactiver: 'unmute',
    sound: 'unmute',
    son: 'unmute',
  };

  const command = map[first] || map[t] || null;
  if (command) {
    const rest = t.slice(first.length).trim();
    return { command, rest };
  }
  return { command: null, rest: t };
}
