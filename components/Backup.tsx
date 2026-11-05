'use client';

import { useRef, useState } from 'react';
import { useProgress } from '@/lib/store';

/** Local data can be wiped by a browser clean-up. This is the parachute. */
export default function Backup() {
  const { done, setMany } = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const exportAll = () => {
    const payload = {
      app: 'bcyber-2027',
      version: 1,
      exportedAt: new Date().toISOString(),
      progress: done,
      hours: JSON.parse(localStorage.getItem('bcyber.hours.v1') || '{}'),
      info: JSON.parse(localStorage.getItem('bcyber.progress.v1') || '{}'),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bcyber-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Backup downloaded.');
    setTimeout(() => setMsg(''), 4000);
  };

  const importAll = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as {
        app?: string;
        progress?: Record<string, boolean>;
        hours?: Record<string, number>;
        info?: { streak?: number; lastTick?: string };
      };
      if (data.app !== 'bcyber-2027' || !data.progress) {
        setMsg('That is not a tracker backup.');
        return;
      }
      const ids = Object.entries(data.progress)
        .filter(([, v]) => v)
        .map(([k]) => k);
      setMany(ids, true);
      if (data.hours) localStorage.setItem('bcyber.hours.v1', JSON.stringify(data.hours));
      if (data.info) localStorage.setItem('bcyber.progress.v1', JSON.stringify({ ...data.info, done: data.progress }));
      setMsg(`${ids.length} ticks restored. Reloading…`);
      setTimeout(() => window.location.reload(), 900);
    } catch {
      setMsg('Could not read that file.');
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button onClick={exportAll} className="btn text-[12px]">
        Export backup
      </button>
      <button onClick={() => file.current?.click()} className="btn text-[12px]">
        Restore backup
      </button>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importAll(f);
          e.target.value = '';
        }}
      />
      {msg && <span className="text-[11px] text-cyan-300">{msg}</span>}
    </div>
  );
}
