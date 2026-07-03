import { MdSupportAgent } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import ContactForm from "../components/ContactForm/ContactForm";
import styles from "./ContactUs.module.css";

const ContactUs = () => {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <MdSupportAgent className={styles.headerIcon} />
          <div>
            <h1>Contact Us</h1>
            <p>Have a question or an issue? Reach out to the Learningo team and we'll get back to you.</p>
          </div>
        </div>
        <ContactForm defaultName={user?.name || ""} defaultEmail={user?.email || ""} />
      </div>
    </div>
  );
};

export default ContactUs;
