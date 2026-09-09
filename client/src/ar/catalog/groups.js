/**
 * The eight groups the hub organises games into.
 *
 * They are the developmental ladder from the design brief, not a random
 * taxonomy: body → perception → cognition → language → academics → function →
 * community → independence. A child (or an adult choosing for them) picks a
 * *domain to work on*, and the games inside are interchangeable ways of working
 * on it.
 *
 * The hub shows one group at a time so that the tile grid always fits the
 * viewport without scrolling.
 */
import { FaEye, FaHandPaper, FaBrain, FaFont, FaRunning, FaHome, FaComments } from 'react-icons/fa'
import { FaHandsHolding } from 'react-icons/fa6'

export const GROUPS = [
  {
    id: 'body',
    title: 'Body & Reach',
    short: 'Body',
    icon: FaHandsHolding,
    color: 'teal',
    blurb: 'Reaching, aiming, using two hands, crossing the middle',
    ladder: 'BODY',
    domains: ['reachAccuracy', 'motorPlanning', 'bilateralCoordination'],
  },
  {
    id: 'look',
    title: 'Look & Find',
    short: 'Look',
    icon: FaEye,
    color: 'blue',
    blurb: 'Spotting the right one, listening, reading, space words',
    ladder: 'PERCEPTION',
    domains: ['visualDiscrimination', 'auditoryComprehension', 'spatialConcepts'],
  },
  {
    id: 'stop',
    title: 'Stop & Think',
    short: 'Stop',
    icon: FaHandPaper,
    color: 'red',
    blurb: 'Waiting, freezing, ignoring distractions, changing rules',
    ladder: 'COGNITION',
    domains: ['inhibition', 'cognitiveFlexibility', 'sustainedAttention'],
  },
  {
    id: 'remember',
    title: 'Remember',
    short: 'Memory',
    icon: FaBrain,
    color: 'purple',
    blurb: 'Holding things in mind, copying an order, missing items',
    ladder: 'COGNITION',
    domains: ['workingMemory', 'sequencing'],
  },
  {
    id: 'learn',
    title: 'Letters & Numbers',
    short: 'ABC 123',
    icon: FaFont,
    color: 'orange',
    blurb: 'Sounds, spelling, writing, counting, money',
    ladder: 'ACADEMIC',
    domains: ['readingSymbol', 'workingMemory', 'motorPlanning'],
  },
  {
    id: 'move',
    title: 'Move & Copy',
    short: 'Move',
    icon: FaRunning,
    color: 'pink',
    blurb: 'Rhythm, imitation, tracing, drawing in the air',
    ladder: 'BODY',
    domains: ['motorPlanning', 'reachAccuracy'],
  },
  {
    id: 'day',
    title: 'My Day',
    short: 'My Day',
    icon: FaHome,
    color: 'green',
    blurb: 'Washing, dressing, packing, sorting, staying safe',
    ladder: 'FUNCTION',
    domains: ['sequencing', 'independence'],
  },
  {
    id: 'together',
    title: 'Talk & Together',
    short: 'Together',
    icon: FaComments,
    color: 'yellow',
    blurb: 'Following instructions, feelings, asking for help',
    ladder: 'COMMUNITY',
    domains: ['socialReasoning', 'auditoryComprehension', 'independence'],
  },
]

export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g]))

/** Plain-English names for the functional domains, for tiles and dashboards. */
export const DOMAIN_LABELS = {
  visualDiscrimination: 'Visual attention',
  auditoryComprehension: 'Listening',
  readingSymbol: 'Reading',
  reactionSpeed: 'Reaction',
  reachAccuracy: 'Reaching',
  sustainedAttention: 'Attention',
  workingMemory: 'Working memory',
  sequencing: 'Sequencing',
  inhibition: 'Stopping & waiting',
  cognitiveFlexibility: 'Changing rules',
  bilateralCoordination: 'Both hands',
  motorPlanning: 'Motor planning',
  spatialConcepts: 'Space words',
  socialReasoning: 'Social thinking',
  independence: 'Independence',
}

/** Life-skill labels, kept separate from cognitive domains on purpose. */
export const LIFE_SKILL_LABELS = {
  hygiene: 'Hygiene',
  dressing: 'Dressing',
  school: 'School prep',
  kitchen: 'Kitchen',
  shopping: 'Shopping',
  money: 'Money',
  roadSafety: 'Road safety',
  homeSafety: 'Home safety',
  chores: 'Household jobs',
  routines: 'Daily routine',
  communication: 'Communication',
  help: 'Asking for help',
  socialPlay: 'Social play',
  literacy: 'Early literacy',
  numeracy: 'Numeracy',
  navigation: 'Getting around',
  selfRegulation: 'Self-regulation',
  bodyAwareness: 'Body awareness',
  instructions: 'Following instructions',
  independence: 'Independence',
}
