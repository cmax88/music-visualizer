import { useRef, useState } from 'react';

export default function AudioUploader({ onAudioReady }) {
  const audioRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const sourceRef = useRef(null);
  const contextRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    audioRef.current.src = url;

    audioRef.current.oncanplay = () => {
      if (!contextRef.current) {
        contextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (!sourceRef.current) {
        const source = contextRef.current.createMediaElementSource(audioRef.current);
        const analyser = contextRef.current.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);
        analyser.connect(contextRef.current.destination);

        sourceRef.current = source;
        onAudioReady(audioRef.current, analyser);
      }
    };
  };

  return (
    <div>
      <input type="file" accept="audio/mp3" onChange={handleUpload} />
      <p>{fileName}</p>
      <audio ref={audioRef} controls style={{ marginTop: '1rem' }} />
    </div>
  );
}
