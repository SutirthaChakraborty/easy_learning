import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '../../hooks/useAudio';
import styles from './AudioPlayer.module.css';

const AudioPlayer = ({ audioUrl, title = 'Audio' }) => {
  const {
    isPlaying,
    play,
    pause,
    togglePlay,
    duration,
    currentTime,
    volume,
    setVolume,
    seek,
    getFormattedTime,
    progress
  } = useAudio(audioUrl);

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    seek(percentage * duration);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className={styles.audioPlayer}>
      <div className={styles.playerHeader}>
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.playerControls}>
        <motion.button
          className={styles.playButton}
          onClick={togglePlay}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </motion.button>

        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Audio progress"
          >
            <div className={styles.progress} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.timeDisplay}>
            <span>{getFormattedTime(currentTime)}</span>
            <span>{getFormattedTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className={styles.volumeControl}>
        <label htmlFor="volume-slider" className={styles.volumeLabel}>
          Volume
        </label>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className={styles.volumeSlider}
          aria-label="Volume control"
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
