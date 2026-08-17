import * as FramerMotion from "framer-motion";
import { MdSupportAgent } from "react-icons/md";
import { FaClock, FaSmileBeam, FaHeadset } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import ContactForm from "../components/ContactForm/ContactForm";
import styles from "./ContactUs.module.css";

const { motion } = FramerMotion;

const reassurances = [
  { color: "purple", icon: FaHeadset, title: "Friendly Support", text: "A real person from our team reads every message." },
  { color: "blue", icon: FaClock, title: "Quick Replies", text: "We usually get back to you within 24 hours." },
  { color: "green", icon: FaSmileBeam, title: "No Question Too Small", text: "Feedback, bugs, or just saying hi — we love hearing from you." },
];

const ContactUs = () => {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <VideoBackground />

      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className={styles.badge}><MdSupportAgent /> We're Here to Help</span>
        <h1 className={styles.heroTitle}>Let's Talk!</h1>
        <p className={styles.heroSubtitle}>
          Have a question, an idea, or ran into a hiccup? Drop us a message and the
          Learningo team will get back to you soon.
        </p>
      </motion.section>

      <motion.div
        className={styles.reassurances}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        {reassurances.map((r) => (
          <div key={r.title} className={`${styles.reassureCard} ${styles[r.color]}`}>
            <span className={styles.reassureIconWrap}><r.icon className={styles.reassureIcon} /></span>
            <div>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        className={styles.panel}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
      >
        <ContactForm defaultName={user?.name || ""} defaultEmail={user?.email || ""} />
      </motion.div>
    </div>
  );
};

export default ContactUs;
