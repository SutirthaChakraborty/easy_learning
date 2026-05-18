import btnSoundFile from '../assets/sounds/btn.mp3';
import slideSoundFile from '../assets/sounds/slide.mp3';
import correctSoundFile from '../assets/sounds/correct.mp3';
import wrongSoundFile from '../assets/sounds/wrong.mp3';

const sounds = {
  btn: new Audio(btnSoundFile),
  slide: new Audio(slideSoundFile),
  correct: new Audio(correctSoundFile),
  wrong: new Audio(wrongSoundFile),
};

const play = (audio) => {
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

export const playBtn = () => play(sounds.btn);
export const playSlide = () => play(sounds.slide);
export const playCorrect = () => play(sounds.correct);
export const playWrong = () => play(sounds.wrong);
