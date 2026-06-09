import btnSoundFile from '../assets/sounds/btn.mp3';
import slideSoundFile from '../assets/sounds/slide.mp3';
import correctSoundFile from '../assets/sounds/correct.mp3';
import wrongSoundFile from '../assets/sounds/wrong.mp3';

const _btn   = new Audio(btnSoundFile);
const _slide = new Audio(slideSoundFile);
const _correct = new Audio(correctSoundFile);
const _wrong = new Audio(wrongSoundFile);

const play = (audio) => {
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

export const playBtn     = () => play(_btn);
export const playSlide   = () => play(_slide);
export const playCorrect = () => play(_correct);
export const playWrong   = () => play(_wrong);
