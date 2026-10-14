export const audienceGuides = [
  {
    slug: "parents",
    name: "Parents",
    code: "HOME",
    issue: "Parents often want to help a child who learns differently, but don't always know where to start beyond what the school already provides.",
    context: "Learningo gives parents a low-pressure way to support practice at home — short rounds, audio support, and a dashboard that shows real progress without needing any special training.",
    approach: [
      "Let your child choose a world (English, Maths or Science) and play a short round together",
      "Use the dashboard to see streaks, XP and progress without needing to test them yourself",
      "Treat it as a supplement to school and professional support, not a replacement",
    ],
  },
  {
    slug: "schools",
    name: "Schools & Tutors",
    code: "SCHOOL",
    issue: "Schools and coaching centres supporting learners with different needs often juggle multiple tools, spreadsheets and paper trackers to manage practice and progress.",
    context: "Learningo's Admin and Teacher roles let a school or coaching centre manage batches of students, upload their own question content, and see progress across a whole cohort from one dashboard, after a straightforward organization approval process.",
    approach: [
      "Sign up as an organization and get approved to unlock Admin and Teacher tools",
      "Assign students to batches so they only see content approved for their level",
      "Use the shared dashboard to track a whole class's progress, not just one child's",
    ],
  },
  {
    slug: "ngos",
    name: "NGOs & Nonprofits",
    code: "NGO",
    issue: "Nonprofits and charities supporting children with learning differences often serve families across many languages, regions and access levels with limited staff and budget.",
    context: "Learningo's 14-language support and organization-based batch model mean an NGO can onboard many children at once, in whichever language fits each family, without building anything from scratch.",
    approach: [
      "Sign up as an organization to manage many students and tutors or volunteers under one account",
      "Let each child use the platform in the language most comfortable for them",
      "Use progress data to show funders and stakeholders real engagement, not just enrollment numbers",
    ],
  },
  {
    slug: "therapists",
    name: "Therapists & Healthcare Professionals",
    code: "CARE",
    issue: "Therapists, occupational therapists, speech-language pathologists and pediatricians are sometimes asked by families for a home-practice tool that can sit alongside, not replace, the work happening in session.",
    context: "Learningo's camera-powered Game Zone is organised around real developmental domains — motor planning, working memory, bilateral coordination, visual attention, sequencing and more, labelled plainly on each activity — which can make it easier to point a family toward relevant practice between sessions.",
    approach: [
      "Point families to Game Zone groups (like Body & Reach or Remember) relevant to current goals",
      "Treat it as optional home practice, not a substitute for your assessment or treatment plan",
      "Encourage short, low-pressure sessions rather than long ones that could cause fatigue",
    ],
    note: "Learningo is a practice and engagement tool, not a clinical or diagnostic instrument. It doesn't replace your professional assessment, treatment plan or the therapeutic relationship with a family.",
  },
];

export const audienceGuideBySlug = Object.fromEntries(audienceGuides.map((a) => [a.slug, a]));
