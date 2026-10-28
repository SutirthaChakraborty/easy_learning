import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import styles from "./PrivacyPolicy.module.css";

const sections = [
  {
    title: "Acceptance of terms",
    text: "By creating an account or using Learnigo, you agree to these Terms & Conditions. If you are creating or managing an account on behalf of a child, you confirm you have the authority to do so and agree to these terms for that account.",
  },
  {
    title: "Who can use Learnigo",
    text: "Learnigo is intended for students, parents, teachers, organization admins and super-admins. Student accounts are created or approved by a parent, teacher or organization, consistent with Learnigo's role-based access model.",
  },
  {
    title: "Your account",
    list: [
      "You are responsible for keeping your login credentials confidential.",
      "You are responsible for activity that happens under your account.",
      "Organizations are responsible for the batches and students they manage.",
      "Tell us right away if you suspect unauthorized use of an account.",
    ],
  },
  {
    title: "Acceptable use",
    text: "Learnigo is an educational platform for children. You agree not to misuse it: no uploading harmful or inappropriate content, no attempting to access accounts or data that aren't yours, and no interfering with the platform's normal operation.",
  },
  {
    title: "Educational purpose, not a diagnosis",
    text: "Learnigo is a learning and practice platform, not a diagnostic or medical service. It does not replace a professional assessment, accommodation plan or therapy for dyslexia or any other learning difference.",
  },
  {
    title: "Intellectual property",
    text: "All content, branding, game mechanics and software that make up Learnigo belong to Learnigo and its licensors. You may use the platform for personal or organizational learning purposes, but may not copy, resell or redistribute its content without permission.",
  },
  {
    title: "Availability and changes",
    text: "We aim to keep Learnigo available and working well, but we don't guarantee uninterrupted access. Features, content and these terms may change over time as the platform is improved.",
  },
  {
    title: "Limitation of liability",
    text: "Learnigo is provided on an \"as is\" basis. To the extent permitted by law, we are not liable for indirect or incidental losses arising from use of the platform.",
  },
  {
    title: "Contact us",
    text: "Questions about these Terms & Conditions? Reach out through our Contact Us page and we'll usually reply within 24 hours.",
  },
];

const TermsAndConditions = () => {
  return (
    <div className={styles.page}>
      <SEO
        title="Terms & Conditions | Learnigo"
        description="The terms and conditions governing use of Learnigo, the dyslexia-friendly learning platform for kids, by students, parents, teachers and organizations."
        path="/terms-and-conditions"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Terms & Conditions",
          url: "https://www.learnigo.eu/terms-and-conditions",
          isPartOf: { "@type": "WebSite", name: "Learnigo", url: "https://www.learnigo.eu" },
        }}
      />
      <VideoBackground />

      <div className={styles.hero}>
        <span className={styles.badge}>Please Read</span>
        <h1 className={styles.title}>Terms & Conditions</h1>
        <p className={styles.subtitle}>
          The rules for using Learnigo, for students, parents, teachers and organizations.
        </p>
        <p className={styles.updated}>Last updated: October 2026</p>
      </div>

      <div className={styles.panel}>
        {sections.map((section) => (
          <div key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            {section.text && <p className={styles.text}>{section.text}</p>}
            {section.list && (
              <ul className={styles.list}>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <p className={styles.footerNote}>
        Questions about these terms? <a href="/contact-us" className={styles.link}>Get in touch</a>.
      </p>
    </div>
  );
};

export default TermsAndConditions;
