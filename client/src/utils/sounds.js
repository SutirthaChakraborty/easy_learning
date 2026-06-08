import btnSoundFile from '../assets/sounds/btn.mp3';
import slideSoundFile from '../assets/sounds/slide.mp3';
import correctSoundFile from '../assets/sounds/correct.mp3';
import wrongSoundFile from '../assets/sounds/wrong.mp3';

const play = (src) => {
  const audio = new Audio(src);
  audio.play().catch(() => {});
};

export const playBtn = () => play(btnSoundFile);
export const playSlide = () => play(slideSoundFile);
export const playCorrect = () => play(correctSoundFile);
export const playWrong = () => play(wrongSoundFile);
