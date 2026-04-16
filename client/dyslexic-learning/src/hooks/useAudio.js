import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudio = (audioUrl) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.src = audioUrl;
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [audioUrl]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setAudioVolume = useCallback((vol) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolume(vol);
    }
  }, []);

  const getFormattedTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return {
    isPlaying,
    play,
    pause,
    togglePlay,
    duration,
    currentTime,
    volume,
    setVolume: setAudioVolume,
    seek,
    getFormattedTime,
    progress: duration > 0 ? (currentTime / duration) * 100 : 0
  };
};
