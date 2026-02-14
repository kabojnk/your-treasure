import { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/music.css';

const STORAGE_KEY = 'your-treasure-music-stopped';
const VOLUME_KEY = 'your-treasure-music-volume';
const DEFAULT_VOLUME = 0.5;

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(VOLUME_KEY);
    return saved !== null ? parseFloat(saved) : DEFAULT_VOLUME;
  });

  // On mount: set volume and autoplay only if user hasn't previously stopped it
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }

    const wasStopped = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!wasStopped && audioRef.current) {
      audioRef.current.play().then(() => {
        setPlaying(true);
      }).catch(() => {
        // Browser blocked autoplay — leave it stopped
        setPlaying(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      audio.play().then(() => {
        setPlaying(true);
        localStorage.removeItem(STORAGE_KEY);
      }).catch(() => {
        // playback failed
      });
    }
  }, [playing]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    localStorage.setItem(VOLUME_KEY, String(newVolume));
  }, []);

  return (
    <div className="music-player">
      <audio ref={audioRef} src="/field-guide-theme.m4a" loop />
      <button className="music-player-btn" onClick={handleToggle}>
        <span className="music-player-icon">{playing ? '■' : '▶'}</span>
        <span className="music-player-label">
          {playing ? 'Stop Music' : 'Restart Music'}
        </span>
      </button>
      <input
        type="range"
        className="music-player-volume"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={handleVolumeChange}
        aria-label="Volume"
      />
    </div>
  );
}
