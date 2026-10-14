export const learningDifferences = [
  {
    slug: "dyslexia",
    name: "Dyslexia",
    code: "READ",
    issue: "Dyslexia mainly affects reading, spelling and word decoding — it isn't related to a child's intelligence or effort.",
    context: "Multisensory practice that pairs audio with text, broken into short, low-pressure rounds, is a widely used complement to a child's regular phonics instruction.",
    approach: [
      "Pair text-to-speech with reading practice so decoding isn't the only path to understanding",
      "Keep sessions short, frequent and low-pressure rather than long and effortful",
      "Celebrate progress and effort, not just accuracy or speed",
    ],
  },
  {
    slug: "adhd",
    name: "ADHD",
    code: "FOCUS",
    issue: "ADHD affects attention, focus and impulse control, and often overlaps with reading, writing or maths difficulties.",
    context: "Short, structured tasks with a clear goal and immediate feedback tend to work better than long, open-ended ones — a pattern many game-based practice tools are built around.",
    approach: [
      "Break practice into short rounds with a clear start and end",
      "Use instant feedback (stars, XP) instead of delayed grading",
      "Let a child switch subjects or take a break rather than push through fatigue",
    ],
  },
  {
    slug: "dyscalculia",
    name: "Dyscalculia",
    code: "MATH",
    issue: "Dyscalculia is a specific difficulty with number sense and arithmetic, separate from a child's general intelligence.",
    context: "Visual, repeated, bite-sized number practice — rather than long written problem sets — can help build number sense at a child's own pace.",
    approach: [
      "Practice numbers in small, repeatable chunks rather than long worksheets",
      "Use visual and audio supports alongside written numbers",
      "Revisit the same core skills often, rather than moving on before they're secure",
    ],
  },
  {
    slug: "dysgraphia",
    name: "Dysgraphia",
    code: "WRITE",
    issue: "Dysgraphia makes the physical or cognitive process of writing difficult — it isn't a sign of low effort or carelessness.",
    context: "Digital practice that separates getting ideas down from handwriting itself can ease the physical strain while a child still practices spelling and composition.",
    approach: [
      "Let typing or guided on-screen input stand in for handwriting where possible",
      "Keep writing tasks short, so fatigue doesn't overshadow the learning",
      "Praise the ideas and effort in a piece of writing, not just its neatness",
    ],
  },
  {
    slug: "autism-spectrum",
    name: "Autism Spectrum",
    code: "ASD",
    issue: "Autistic children have widely varying learning styles and strengths — there is no single \"autism learning style\" that fits every child.",
    context: "Predictable routines, clear structure, and letting a child choose how they engage (audio, visual or hands-on) tend to support learning across the spectrum.",
    approach: [
      "Keep the same practice routine and structure from session to session",
      "Offer a choice of audio, visual or interactive ways to engage with a question",
      "Follow the child's own interests and pace rather than a fixed script",
    ],
  },
];

export const differenceBySlug = Object.fromEntries(learningDifferences.map((d) => [d.slug, d]));
