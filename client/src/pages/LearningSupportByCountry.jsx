import { Link, useParams } from "react-router-dom";
import SEO, { SITE_URL } from "../components/SEO/SEO";
import { countryGuideBySlug, countryLearningGuides } from "../data/countryLearningGuides";
import styles from "./LearningSupportByCountry.module.css";

const pageUrl = "/learning-support-by-country";

function GuideCard({ guide }) {
  return (
    <article className={styles.card}>
      <span className={styles.code}>{guide.code}</span>
      <h2>{guide.name}</h2>
      <p>{guide.issue}</p>
      <Link to={`${pageUrl}/${guide.slug}`} className={styles.link}>Read the {guide.name} guide <span aria-hidden="true">-&gt;</span></Link>
    </article>
  );
}

export default function LearningSupportByCountry() {
  const { country } = useParams();
  const guide = country ? countryGuideBySlug[country] : null;

  if (country && !guide) {
    return <CountryNotFound />;
  }

  if (guide) {
    const path = `${pageUrl}/${guide.slug}`;
    return (
      <main className={styles.page}>
        <SEO
          title={`${guide.name}: Learning Support Ideas for Children | Learningo`}
          description={`Practical, respectful learning support ideas for families and educators in ${guide.name}, including accessible game-based practice for children who learn differently.`}
          path={path}
          structuredData={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${guide.name}: Learning Support Ideas for Children`,
            description: guide.issue,
            author: { "@type": "Organization", name: "Learningo", url: SITE_URL },
            publisher: { "@type": "Organization", name: "Learningo", url: SITE_URL },
            mainEntityOfPage: `${SITE_URL}${path}`,
          }}
        />
        <Link to={pageUrl} className={styles.backLink}>&lt;- All country guides</Link>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>{guide.code} | Family learning guide</span>
          <h1>Learning support ideas for children in {guide.name}</h1>
          <p>{guide.issue}</p>
        </header>
        <section className={styles.content}>
          <h2>How an accessible practice tool can help</h2>
          <p>{guide.context}</p>
          <h2>Ideas to try with a child</h2>
          <ul>{guide.approach.map((item) => <li key={item}>{item}</li>)}</ul>
          <aside className={styles.note}>
            <strong>A note for families and educators</strong>
            <p>Learningo is an educational practice platform, not a diagnostic or medical service. A qualified local professional should guide assessment, accommodations and individual support.</p>
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
        title="Learning Support by Country | Accessible Gamified Learning | Learningo"
        description="Explore respectful learning support ideas for children who learn differently, with country context and accessible game-based practice from Learningo."
        path={pageUrl}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Learning Support by Country",
          description: "Country-aware learning support ideas for children who learn differently.",
          url: `${SITE_URL}${pageUrl}`,
          isPartOf: { "@type": "WebSite", name: "Learningo", url: SITE_URL },
        }}
      />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Learningo | Inclusive learning</span>
        <h1>Learning support by country</h1>
        <p>Children and families face different school systems, languages and access challenges. These guides share practical starting points for accessible, game-based practice without pretending one approach fits every child.</p>
      </header>
      <section className={styles.intro}>
        <h2>Start with the child's needs</h2>
        <p>Country context can help adults ask better questions, but it should never replace a child's own voice, family knowledge, teacher guidance or qualified assessment.</p>
      </section>
      <section className={styles.grid} aria-label="Country learning support guides">
        {countryLearningGuides.map((item) => <GuideCard key={item.slug} guide={item} />)}
      </section>
      <section className={styles.intro} style={{ marginTop: 28 }}>
        <h2>Looking for a specific learning difference?</h2>
        <p>
          Alongside country context, we also cover common learning differences directly —{" "}
          <Link to="/learning-differences" className={styles.link}>explore dyslexia, ADHD, dyscalculia, dysgraphia and autism spectrum guides <span aria-hidden="true">-&gt;</span></Link>
        </p>
        <p>
          Not a parent? See how Learningo helps{" "}
          <Link to="/who-we-help/schools" className={styles.link}>schools and tutors</Link>,{" "}
          <Link to="/who-we-help/ngos" className={styles.link}>NGOs and nonprofits</Link>, and{" "}
          <Link to="/who-we-help/therapists" className={styles.link}>therapists and healthcare professionals</Link>. There's also{" "}
          <Link to="/ar-learning-games" className={styles.link}>camera-powered AR learning games <span aria-hidden="true">-&gt;</span></Link>
        </p>
      </section>
    </main>
  );
}

function CountryNotFound() {
  return <main className={styles.page}><h1>Country guide not found</h1><Link to={pageUrl} className={styles.link}>Browse all country guides</Link></main>;
}