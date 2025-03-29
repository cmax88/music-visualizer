// App.jsx
import { useState, useRef } from 'react';
import ParticleVisualizer from "./components/ParticleVisualizer";
import { extractCoverFromFile } from './components/parseMp3';
import './App.css';

export default function App() {
  const [analyser, setAnalyser] = useState(null);
  const [albumArt, setAlbumArt] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Get album art
    const cover = await extractCoverFromFile(file);
    if (cover?.url) setAlbumArt(cover.url);

    // Create audio context + analyser
    const audio = new Audio(URL.createObjectURL(file));
    audioRef.current = audio;
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    audio.volume = volume;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.play();

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    const analyserNode = audioContext.createAnalyser();
    source.connect(analyserNode);
    analyserNode.connect(audioContext.destination);

    setAnalyser(analyserNode);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleScrub = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div>

{/* VOLUME - Left Vertical */}
<div className="volume-slider">
  <input
    type="range"
    min="0"
    max="1"
    step="0.01"
    value={volume}
    onChange={handleVolumeChange}
    orient="vertical"
  />
</div>

{/* SCRUB & FILE - Bottom Center */}
<div className="bottom-controls">
  <input
    type="file"
    accept="audio/mpeg"
    onChange={handleFileChange}
    className="file-input"
  />
  <input
    type="range"
    min="0"
    max={duration || 0}
    step="0.1"
    value={currentTime}
    onChange={handleScrub}
    className="scrub-bar"
  />
</div>



      <ParticleVisualizer analyser={analyser} albumArt={albumArt} />
    </div>
  );
}