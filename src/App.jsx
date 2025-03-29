import { useState, useRef, useEffect } from 'react'; // <-- React hooks FIRST
import ParticleVisualizer from "./components/ParticleVisualizer";
import { extractMetadataFromFile } from './components/parseMp3';
import VolumeSlider from "./components/VolumeSlider";
import './App.css'; // CSS last is fine


export default function App() {
  const [analyser, setAnalyser] = useState(null);
  const [albumArt, setAlbumArt] = useState(null);
  const [trackInfo, setTrackInfo] = useState({ title: '', artist: '' });
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [sliderValue, setSliderValue] = useState(1); // max is 1, but represents 0.5 volume
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [showUI, setShowUI] = useState(true);
  const inactivityTimer = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      setShowUI(true);
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        setShowUI(false);
      }, 5000);
    };
  
    window.addEventListener('mousemove', resetTimer);
    resetTimer(); // Start the timer immediately
  
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      clearTimeout(inactivityTimer.current);
    };
  }, []);
  


  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Get album art
    const metadata = await extractMetadataFromFile(file);
    if (metadata.albumArt) setAlbumArt(metadata.albumArt);
    setTrackInfo({ title: metadata.title, artist: metadata.artist });    
    

    // Create audio context + analyser
    const audio = new Audio(URL.createObjectURL(file));
    audioRef.current = audio;
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    audio.volume = volume;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.play();
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    const analyserNode = audioContext.createAnalyser();
    source.connect(analyserNode);
    analyserNode.connect(audioContext.destination);

    setAnalyser(analyserNode);
  };

  const handleVolumeChange = (newVolume) => {
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

  const togglePlayPause = () => {
    if (!audioRef.current) return;
  
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };  

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  

  return (
    <div>
      <div className={`track-info ${!showUI ? 'fade-info' : ''}`}>
        <h1>{trackInfo.title}</h1>
        <h2>{trackInfo.artist}</h2>
      </div>

  <VolumeSlider
    volume={volume}
    setVolume={handleVolumeChange}
    className={!showUI ? 'hidden-ui' : ''}
  />


<div className={`bottom-controls ${!showUI ? 'hidden-ui' : ''}`}>
<button
    className={`play-pause-btn ${!showUI ? 'hidden-ui' : ''}`}
    onClick={togglePlayPause}
  >
    {isPlaying ? '⏸' : '▶'}
  </button>
  <input
    type="file"
    accept="audio/mpeg"
    onChange={handleFileChange}
    className="file-input"
  />
</div>

<div className={`scrub-container ${!showUI ? 'hidden-ui' : ''}`}>
  <span className="time-label">{formatTime(currentTime)}</span>
  <input
    type="range"
    min="0"
    max={duration || 0}
    step="0.1"
    value={currentTime}
    onChange={handleScrub}
    className="scrub-bar"
  />
  <span className="time-label">{formatTime(duration)}</span>
</div>

      <ParticleVisualizer analyser={analyser} albumArt={albumArt} />
    </div>
  );
}