const KEY = 'bcyber.hours.v1';

export type HourLog = Record<string, number>; // YYYY-MM-DD -> hours

export function todayKey(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function read(): HourLog {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as HourLog;
  } catch {
    return {};
  }
}

export function makeIcs(): string {
  const stamp = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const checkpoints: [string, string][] = [
    ['Foundations done, Bandit complete', '2026-12-31'],
    ['Cryptography done, CUET registered', '2027-01-31'],
    ['Web 40% and first CTF played', '2027-02-28'],
    ['Web done, 3 write-ups live', '2027-03-31'],
    ['API done, network 50%', '2027-04-30'],
    ['Network + OSINT done, CUET sat', '2027-05-31'],
    ['Reverse engineering done, portfolio finalised', '2027-06-30'],
    ['Entrance window — timed mocks twice a week', '2027-07-05'],
  ];

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//B.Cyber 2027//Tracker//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const [title, date] of checkpoints) {
    const d = new Date(`${date}T09:00:00`);
    const end = new Date(d.getTime() + 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${date}-${title.replace(/\W+/g, '-').toLowerCase()}@bcyber2027`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(d)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${title}`,
      'DESCRIPTION:B.Cyber 2027 checkpoint — see the tracker dashboard.',
      'BEGIN:VALARM',
      'TRIGGER:-P2D',
      'ACTION:DISPLAY',
      'DESCRIPTION:B.Cyber checkpoint in 2 days',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
