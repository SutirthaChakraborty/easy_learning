import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import styles from "./Faq.module.css";

const faqs = [
  {
    q: "What is Learningo?",
    a: "Learningo is a gamified learning platform built for children with dyslexia and other neurodivergent learners. It turns English, Maths and Science practice into short, encouraging rounds with audio support, playful visuals and instant positive feedback.",
  },
  {
    q: "Is Learningo designed for children with dyslexia?",
    a: "Yes. Learningo is built specifically with dyslexic and neurodivergent learners in mind — every round is short, uses audio support alongside text, and gives instant, encouraging feedback instead of red marks.",
  },
  {
    q: "What age is Learningo suitable for?",
    a: "Learningo is designed for children roughly aged 5 to 14, though families and educators are best placed to judge whether the pace and content suit an individual child.",
  },
  {
    q: "What subjects can my child practice on Learningo?",
    a: "Three subjects, each with Listen, Read, Write and Speak practice: English (\"English Kingdom\"), Maths (\"Maths Galaxy\") and Science (\"Science Lab\"). There's also a story-based Learn mode and a camera-powered Game Zone.",
  },
  {
    q: "Does Learningo use text-to-speech?",
    a: "Yes. Learningo uses browser-based text-to-speech so a child can complete reading content without needing to decode every word unaided.",
  },
  {
    q: "What languages does Learningo support?",
    a: "Learningo is available in 14 languages, switchable at any time from the navbar: English, Spanish, Portuguese, French, Italian, German, Dutch, Russian, Turkish, Chinese, Japanese, Korean, Indonesian and Vietnamese.",
  },
  {
    q: "Is Learningo a diagnostic tool for dyslexia?",
    a: "No. Learningo is an educational practice platform, not a diagnostic or medical service. A qualified local professional should guide any assessment, accommodation or individual support plan.",
  },
  {
    q: "Can schools and tutors use Learningo?",
    a: "Yes. Schools and coaching centres can sign up as an organization, with Admin and Teacher roles for managing batches, students and question content, alongside the regular Student and Parent accounts.",
  },
  {
    q: "How does my child's progress get tracked?",
    a: "Automatically. Finishing a round updates XP, levels, streaks and unlockable achievement badges, all visible on a personal dashboard with an activity heatmap and progress history — nothing needs to be logged manually.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const Faq = () => {
  return (
    <div className={styles.page}>
      <SEO
        title="FAQ | Dyslexia Learning App Questions Answered | Learningo"
        description="Common questions about Learningo — the dyslexia-friendly, gamified learning platform for kids: age range, languages, subjects, text-to-speech and more."
        path="/faq"
        structuredData={faqSchema}
      />
      <VideoBackground />

      <div className={styles.hero}>
        <span className={styles.badge}>Questions & Answers</span>
        <h1 className={styles.title}>Frequently Asked Questions</h1>
        <p className={styles.subtitle}>
          Everything families and educators usually ask before trying Learningo.
        </p>
      </div>

      <div className={styles.panel}>
        {faqs.map((item) => (
          <details key={item.q} className={styles.item}>
            <summary className={styles.question}>{item.q}</summary>
            <p className={styles.answer}>{item.a}</p>
          </details>
        ))}
      </div>

      <p className={styles.footerNote}>
        Still have a question? <a href="/contact-us" className={styles.link}>Get in touch</a> — we usually reply within 24 hours.
      </p>
    </div>
  );
};

export default Faq;
