// components/VolumeSlider.jsx
import { useState } from 'react';
import './VolumeSlider.css';

export default function VolumeSlider({ volume, setVolume, className = '' }) {
  const [muted, setMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const toggleMute = () => {
    if (muted) {
      setVolume(previousVolume);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
    }
    setMuted(!muted);
  };

  const handleSliderChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && muted) setMuted(false);
  };

  return (
    <div className={`volume-slider ${className}`}>
    <label htmlFor="volume-range" className="slider">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="icon"
        onClick={toggleMute}
      >
        <path d="M15 8a5 5 0 0 1 0 8" />
        <path d="M17.7 5a9 9 0 0 1 0 14" />
        <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
      </svg>

      <input
          id="volume-range"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="level"
        />
    </label>
    </div>
  );
}
