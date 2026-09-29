import { Link, useParams } from "react-router-dom";
import SEO, { SITE_URL } from "../components/SEO/SEO";
import { differenceBySlug, learningDifferences } from "../data/learningDifferences";
import styles from "./LearningSupportByCountry.module.css";

const pageUrl = "/learning-differences";

function DifferenceCard({ item }) {
  return (
    <article className={styles.card}>
      <span className={styles.code}>{item.code}</span>
      <h2>{item.name}</h2>
      <p>{item.issue}</p>
      <Link to={`${pageUrl}/${item.slug}`} className={styles.link}>Read about {item.name} <span aria-hidden="true">-&gt;</span></Link>
    </article>
  );
}

export default function LearningDifferences() {
  const { difference } = useParams();
  const item = difference ? differenceBySlug[difference] : null;

  if (difference && !item) {
    return <DifferenceNotFound />;
  }

  if (item) {
    const path = `${pageUrl}/${item.slug}`;
    return (
      <main className={styles.page}>
        <SEO
          title={`${item.name} in Children: A Family Guide | Learningo`}
          description={`A plain-language guide to ${item.name} for families and educators, including how accessible game-based practice can fit alongside qualified support.`}
          path={path}
          structuredData={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${item.name} in Children: A Family Guide`,
            description: item.issue,
            author: { "@type": "Organization", name: "Learningo", url: SITE_URL },
            publisher: { "@type": "Organization", name: "Learningo", url: SITE_URL },
            mainEntityOfPage: `${SITE_URL}${path}`,
          }}
        />
        <Link to={pageUrl} className={styles.backLink}>&lt;- All learning differences</Link>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>{item.code} | Family guide</span>
          <h1>{item.name} in children</h1>
          <p>{item.issue}</p>
        </header>
        <section className={styles.content}>
          <h2>How an accessible practice tool can help</h2>
          <p>{item.context}</p>
          <h2>Ideas to try with a child</h2>
          <ul>{item.approach.map((line) => <li key={line}>{line}</li>)}</ul>
          <aside className={styles.note}>
            <strong>A note for families and educators</strong>
            <p>Learningo is an educational practice platform, not a diagnostic or medical service. A qualified local professional should guide any assessment, accommodation or individual support plan.</p>
          </aside>
          <Link to="/learning-support-by-country" className={styles.cta}>See learning support ideas by country <span aria-hidden="true">-&gt;</span></Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <SEO
        title="Learning Differences Explained | Dyslexia, ADHD & More | Learningo"
        description="Plain-language guides to dyslexia, ADHD, dyscalculia, dysgraphia and autism spectrum learning — and how accessible, game-based practice can fit alongside qualified support."
        path={pageUrl}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Learning Differences Explained",
          description: "Plain-language guides to common learning differences in children.",
          url: `${SITE_URL}${pageUrl}`,
          isPartOf: { "@type": "WebSite", name: "Learningo", url: SITE_URL },
        }}
      />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Learningo | Inclusive learning</span>
        <h1>Learning differences, explained</h1>
        <p>Every child's brain works differently. These plain-language guides cover common learning differences and how short, accessible, game-based practice can fit alongside a child's own school support.</p>
      </header>
      <section className={styles.intro}>
        <h2>Understanding first, labels second</h2>
        <p>These guides are a starting point for families and educators, not a diagnosis. A qualified professional should always guide formal assessment and individual support.</p>
      </section>
      <section className={styles.grid} aria-label="Learning difference guides">
        {learningDifferences.map((item) => <DifferenceCard key={item.slug} item={item} />)}
      </section>
    </main>
  );
}

function DifferenceNotFound() {
  return <main className={styles.page}><h1>Guide not found</h1><Link to={pageUrl} className={styles.link}>Browse all learning differences</Link></main>;
}
