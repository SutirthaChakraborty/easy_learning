import { FaBook, FaCalculator, FaMicroscope, FaHeart } from "react-icons/fa";
import styles from "./AboutUs.module.css";

const AboutUs = () => {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <FaHeart className={styles.headerIcon} />
          <div>
            <h1>About Us</h1>
            <p>Learningo is a play-first learning platform built for dyslexic and neurodivergent learners.</p>
          </div>
        </div>

        <p className={styles.paragraph}>
          We believe every child learns differently, and reading, writing, and speaking shouldn't
          feel like a struggle. Learningo turns lessons into an adventure — short, encouraging
          rounds with audio support, playful visuals, and instant positive feedback — so kids build
          confidence at their own pace.
        </p>

        <div className={styles.worlds}>
          <div className={styles.world}>
            <FaBook className={styles.worldIcon} />
            <div>
              <h3>English Kingdom</h3>
              <p>Stories, listening and speaking practice designed for dyslexia-friendly reading.</p>
            </div>
          </div>
          <div className={styles.world}>
            <FaCalculator className={styles.worldIcon} />
            <div>
              <h3>Maths Galaxy</h3>
              <p>Bite-sized number practice that builds problem-solving confidence.</p>
            </div>
          </div>
          <div className={styles.world}>
            <FaMicroscope className={styles.worldIcon} />
            <div>
              <h3>Science Lab</h3>
              <p>Curiosity-driven activities that make discovery fun.</p>
            </div>
          </div>
        </div>

        <p className={styles.paragraph}>
          Have feedback or a question about Learningo? Reach out any time on our{" "}
          <a href="/contact-us" className={styles.link}>Contact Us</a> page.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
