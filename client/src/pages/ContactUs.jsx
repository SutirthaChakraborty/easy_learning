import * as FramerMotion from "framer-motion";
import { useTranslation } from "react-i18next";
import { MdSupportAgent } from "react-icons/md";
import { FaClock, FaSmileBeam, FaHeadset } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import ContactForm from "../components/ContactForm/ContactForm";
import SEO from "../components/SEO/SEO";
import styles from "./ContactUs.module.css";

const { motion } = FramerMotion;

const reassurances = [
  { key: "support", color: "purple", icon: FaHeadset },
  { key: "quick", color: "blue", icon: FaClock },
  { key: "noQuestion", color: "green", icon: FaSmileBeam },
];

const ContactUs = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <SEO
        title="Contact Learningo | We're Here to Help"
        description="Questions, feedback or a bug to report? Get in touch with the Learningo team and we'll usually reply within 24 hours."
        path="/contact-us"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Learningo",
          url: "https://www.learnigo.eu/contact-us",
          isPartOf: { "@type": "WebSite", name: "Learningo", url: "https://www.learnigo.eu" },
        }}
      />
      <VideoBackground />

      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className={styles.badge}><MdSupportAgent /> {t("contactUs.badge")}</span>
        <h1 className={styles.heroTitle}>{t("contactUs.heroTitle")}</h1>
        <p className={styles.heroSubtitle}>
          {t("contactUs.heroSubtitle")} Looking for a quick answer? Check our{" "}
          <a href="/faq" className={styles.faqLink}>FAQ</a>.
        </p>
      </motion.section>

      <motion.div
        className={styles.reassurances}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        {reassurances.map((r) => (
          <div key={r.key} className={`${styles.reassureCard} ${styles[r.color]}`}>
            <span className={styles.reassureIconWrap}><r.icon className={styles.reassureIcon} /></span>
            <div>
              <h3>{t(`contactUs.reassurances.${r.key}.title`)}</h3>
              <p>{t(`contactUs.reassurances.${r.key}.text`)}</p>
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
