import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { ProgressContext } from '../../context/ProgressContext';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import AudioPlayer from '../../components/AudioPlayer/AudioPlayer';
import Modal from '../../components/Modal/Modal';
import styles from './Stories.module.css';
import { STORIES } from '../../utils/constants';

const Stories = () => {
  const { user } = useContext(AuthContext);
  const { recordStoryCompleted } = useContext(ProgressContext);
  const [selectedStory, setSelectedStory] = useState(null);
  const [completedStories, setCompletedStories] = useState(new Set());

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📖</div>
          <h2>Please log in to read stories</h2>
          <p>Sign in to unlock amazing stories!</p>
        </div>
      </div>
    );
  }

  const handleStoryComplete = () => {
    if (selectedStory && !completedStories.has(selectedStory.id)) {
      setCompletedStories(new Set(completedStories).add(selectedStory.id));
      recordStoryCompleted();
    }
  };

  return (
    <div className={styles.storiesPage}>
      <motion.section
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.title}>📖 Story Library</h1>
        <p className={styles.subtitle}>Enjoy wonderful stories with audio support</p>
      </motion.section>

      <motion.div
        className={styles.storiesGrid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {STORIES.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              interactive
              className={styles.storyCard}
              onClick={() => setSelectedStory(story)}
            >
              <div className={styles.storyIcon}>📚</div>
              <h3 className={styles.storyTitle}>{story.title}</h3>
              <p className={styles.author}>by {story.author}</p>
              <p className={styles.description}>{story.description}</p>
              
              <div className={styles.storyMeta}>
                <span className={styles.duration}>{story.duration}</span>
                <span className={styles.level}>{story.readingLevel}</span>
              </div>

              <Button
                variant="primary"
                size="md"
                className={styles.readButton}
              >
                {completedStories.has(story.id) ? '✓ Completed' : 'Read Now'}
              </Button>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Modal
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
        title={selectedStory?.title}
        size="lg"
      >
        {selectedStory && (
          <div className={styles.storyContent}>
            <AudioPlayer
              audioUrl={`/audio/story-${selectedStory.id}.mp3`}
              title={selectedStory.title}
            />

            <div className={styles.storyText}>
              <p>
                {selectedStory.id === 1 && 'Benny the Robot woke up one sunny morning in his digital workshop. He was excited for the day ahead because he had a special mission - to explore the magical digital kingdom and help all the friends he would meet along the way...'}
                {selectedStory.id === 2 && 'Luna looked up at the night sky and noticed something peculiar. The stars were shining brighter than usual, and they seemed to be telling a story. She decided to follow their light and discover the mystery hidden in the starlight...'}
                {selectedStory.id === 3 && 'Deep in a hidden valley, there lay a city unlike any other. Every building was painted in brilliant colors, and the streets glowed with rainbow lights. The Lost City of Colors held secrets that only the bravest adventurers could uncover...'}
              </p>
            </div>

            <div className={styles.storyActions}>
              <Button
                variant="success"
                onClick={() => {
                  handleStoryComplete();
                  setSelectedStory(null);
                }}
              >
                Mark as Complete
              </Button>
              <Button variant="outline" onClick={() => setSelectedStory(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Stories;
