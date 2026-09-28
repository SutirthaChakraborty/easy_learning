export const countryLearningGuides = [
  {
    slug: "united-states",
    name: "United States",
    code: "US",
    issue: "Families and schools often need learning support that can complement an individual education plan without replacing a qualified assessment or specialist teaching.",
    context: "A flexible practice tool can help children rehearse reading, writing, listening and maths in short sessions while adults use the child's own school plan and professional advice as the source of truth.",
    approach: ["Keep practice short and predictable", "Offer audio, visual and movement-based choices", "Share progress observations with the child's support team"],
  },
  {
    slug: "united-kingdom",
    name: "United Kingdom",
    code: "GB",
    issue: "Learners may move between home, school and additional-needs support, so consistent routines and accessible practice can be difficult to maintain.",
    context: "Learningo can provide playful practice that sits alongside a child's school support and does not claim to diagnose dyslexia or replace an education, health and care plan.",
    approach: ["Use the same accessible routines across settings", "Let the child choose text, audio or movement support", "Review progress with teachers and families regularly"],
  },
  {
    slug: "india",
    name: "India",
    code: "IN",
    issue: "Children learn across many languages, school contexts and levels of access to specialist support, making adaptable and low-pressure practice especially important.",
    context: "Multilingual families can use Learningo's language options and gamified subject practice as an extra learning activity, while local educators guide language, curriculum and support decisions.",
    approach: ["Choose the language most comfortable for the child", "Build from small wins in English, maths or science", "Adapt examples to the child's school curriculum"],
  },
  {
    slug: "canada",
    name: "Canada",
    code: "CA",
    issue: "Support services and curriculum pathways can differ between provinces and territories, so families need tools that remain useful across settings.",
    context: "A consistent home practice routine can support confidence and reinforce classroom learning, but local school teams and qualified professionals should guide individual accommodations.",
    approach: ["Keep goals specific and observable", "Use encouraging feedback instead of timed pressure", "Bring useful progress notes to school conversations"],
  },
  {
    slug: "australia",
    name: "Australia",
    code: "AU",
    issue: "Families may coordinate classroom adjustments, home practice and specialist input across large distances and different school environments.",
    context: "Short, accessible game-based activities can make home practice easier to repeat and observe, while families continue to follow advice from their school and health professionals.",
    approach: ["Plan screen time around the child's energy", "Use movement and voice activities when reading feels tiring", "Celebrate effort and progress rather than speed"],
  },
];

export const countryGuideBySlug = Object.fromEntries(countryLearningGuides.map((guide) => [guide.slug, guide]));