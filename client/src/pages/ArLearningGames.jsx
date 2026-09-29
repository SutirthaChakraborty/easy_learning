import { Link } from "react-router-dom";
import SEO, { SITE_URL } from "../components/SEO/SEO";
import styles from "./LearningSupportByCountry.module.css";

const pageUrl = "/ar-learning-games";

const gameGroups = [
  { code: "BODY", name: "Body & Reach", blurb: "Reaching, aiming, using two hands, crossing the middle." },
  { code: "LOOK", name: "Look & Find", blurb: "Spotting the right one, listening, reading, space words." },
  { code: "STOP", name: "Stop & Think", blurb: "Waiting, freezing, ignoring distractions, changing rules." },
  { code: "MEMORY", name: "Remember", blurb: "Holding things in mind, copying an order, missing items." },
  { code: "ABC 123", name: "Letters & Numbers", blurb: "Sounds, spelling, writing, counting, money." },
  { code: "MOVE", name: "Move & Copy", blurb: "Rhythm, imitation, tracing, drawing in the air." },
  { code: "MY DAY", name: "My Day", blurb: "Washing, dressing, packing, sorting, staying safe." },
  { code: "TOGETHER", name: "Talk & Together", blurb: "Following instructions, feelings, asking for help." },
];

export default function ArLearningGames() {
  return (
    <main className={styles.page}>
      <SEO
        title="AR Learning Games for Kids | Camera-Powered Practice | Learningo"
        description="75 camera-powered AR learning games across 8 developmental groups — no equipment needed, just a webcam. Motor planning, memory, attention and more, worldwide."
        path={pageUrl}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "AR Learning Games for Kids",
          description: "Camera-powered AR learning games organised by developmental domain.",
          url: `${SITE_URL}${pageUrl}`,
          isPartOf: { "@type": "WebSite", name: "Learningo", url: SITE_URL },
        }}
      />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Learningo | Game Zone</span>
        <h1>AR learning games for kids, anywhere in the world</h1>
        <p>75 camera-powered games, organised into 8 developmental groups — no extra equipment, just a webcam and some open floor space.</p>
      </header>
      <section className={styles.intro}>
        <h2>How it works</h2>
        <p>Learningo's Game Zone uses your device's camera to track hand and body movement in real time, turning practice into motion-based play. It works anywhere with a webcam, in any of Learningo's 14 supported languages — no headset, controller or extra hardware required.</p>
      </section>
      <section className={styles.grid} aria-label="AR game groups">
        {gameGroups.map((g) => (
          <article key={g.name} className={styles.card}>
            <span className={styles.code}>{g.code}</span>
            <h2>{g.name}</h2>
            <p>{g.blurb}</p>
          </article>
        ))}
      </section>
      <section className={styles.content} style={{ marginTop: 28 }}>
        <h2>Built around real developmental domains</h2>
        <p>Each game targets specific, plainly-labelled domains — motor planning, working memory, visual attention, sequencing, bilateral coordination and more — so a parent, teacher or therapist can pick a group that matches what a child is working on, rather than guessing.</p>
        <aside className={styles.note}>
          <strong>A note for families and educators</strong>
          <p>Learningo is an educational practice platform, not a diagnostic or medical service. A qualified local professional should guide assessment, accommodations and individual support.</p>
        </aside>
        <Link to="/who-we-help/therapists" className={styles.cta} style={{ display: "block", marginTop: 8 }}>See how therapists use the Game Zone <span aria-hidden="true">-&gt;</span></Link>
        <Link to="/games" className={styles.cta}>Try the Game Zone <span aria-hidden="true">-&gt;</span></Link>
      </section>
    </main>
  );
}
