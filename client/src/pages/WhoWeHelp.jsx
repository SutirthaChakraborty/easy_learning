import { Link, useParams } from "react-router-dom";
import SEO, { SITE_URL } from "../components/SEO/SEO";
import { audienceGuideBySlug, audienceGuides } from "../data/audienceGuides";
import styles from "./LearningSupportByCountry.module.css";

const pageUrl = "/who-we-help";
const DEFAULT_NOTE = "Learningo is an educational practice platform, not a diagnostic or medical service. A qualified local professional should guide any assessment, accommodation or individual support plan.";

function AudienceCard({ item }) {
  return (
    <article className={styles.card}>
      <span className={styles.code}>{item.code}</span>
      <h2>{item.name}</h2>
      <p>{item.issue}</p>
      <Link to={`${pageUrl}/${item.slug}`} className={styles.link}>See how Learningo helps {item.name} <span aria-hidden="true">-&gt;</span></Link>
    </article>
  );
}

export default function WhoWeHelp() {
  const { audience } = useParams();
  const item = audience ? audienceGuideBySlug[audience] : null;

  if (audience && !item) {
    return <AudienceNotFound />;
  }

  if (item) {
    const path = `${pageUrl}/${item.slug}`;
    return (
      <main className={styles.page}>
        <SEO
          title={`Learningo for ${item.name} | Accessible Gamified Learning`}
          description={`How Learningo helps ${item.name.toLowerCase()}: ${item.issue}`}
          path={path}
          structuredData={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `Learningo for ${item.name}`,
            description: item.issue,
            author: { "@type": "Organization", name: "Learningo", url: SITE_URL },
            publisher: { "@type": "Organization", name: "Learningo", url: SITE_URL },
            mainEntityOfPage: `${SITE_URL}${path}`,
          }}
        />
        <Link to={pageUrl} className={styles.backLink}>&lt;- Who we help</Link>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>{item.code} | For {item.name}</span>
          <h1>Learningo for {item.name}</h1>
          <p>{item.issue}</p>
        </header>
        <section className={styles.content}>
          <h2>How Learningo helps</h2>
          <p>{item.context}</p>
          <h2>Getting started</h2>
          <ul>{item.approach.map((line) => <li key={line}>{line}</li>)}</ul>
          <aside className={styles.note}>
            <strong>A note for {item.name.toLowerCase()}</strong>
            <p>{item.note || DEFAULT_NOTE}</p>
          </aside>
          <Link to="/learning-differences" className={styles.cta} style={{ display: "block", marginTop: 8 }}>Explore guides by learning difference <span aria-hidden="true">-&gt;</span></Link>
          <Link to="/about-us" className={styles.cta}>See how Learningo turns practice into play <span aria-hidden="true">-&gt;</span></Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <SEO
        title="Who We Help | Learningo for Parents, Schools, NGOs & Therapists"
        description="Learningo supports parents, schools and tutors, NGOs and nonprofits, and therapists and healthcare professionals working with children who learn differently."
        path={pageUrl}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Who We Help",
          description: "How Learningo supports parents, schools, NGOs and healthcare professionals.",
          url: `${SITE_URL}${pageUrl}`,
          isPartOf: { "@type": "WebSite", name: "Learningo", url: SITE_URL },
        }}
      />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Learningo | Inclusive learning</span>
        <h1>Who we help</h1>
        <p>Learningo supports every adult around a child who learns differently — not just the child. Here's how it fits each role.</p>
      </header>
      <section className={styles.intro}>
        <h2>One platform, several roles</h2>
        <p>Students, parents, teachers and admins each get tools suited to what they actually need to do, rather than one generic account for everyone.</p>
      </section>
      <section className={styles.grid} aria-label="Who Learningo helps">
        {audienceGuides.map((item) => <AudienceCard key={item.slug} item={item} />)}
      </section>
    </main>
  );
}

function AudienceNotFound() {
  return <main className={styles.page}><h1>Guide not found</h1><Link to={pageUrl} className={styles.link}>Browse who we help</Link></main>;
}
