// Everything the page says lives here, so the writing pass only touches this file.

export const EMAIL = "andrew_razo@brown.edu";
export const GITHUB_URL = "https://github.com/andrewkrazo";

// Buttons for these only render once a value is set.
export const LINKEDIN_URL: string | null = "https://www.linkedin.com/in/andrew-razo-5b22a9415";
// This copy has no phone number or street address. Keep it that way.
export const RESUME_URL: string | null = "/Andrew-Razo-Resume.pdf";

export type ProjectId = "syllabuddy" | "rizdum" | "loops" | "placivic" | "fsab";

export type Shot = { src: string; alt: string; phone?: boolean };

export type Project = {
  id: ProjectId;
  name: string;
  where: "Brown" | "Los Angeles";
  line: string;
  /** The longer line shown when the project is opened, if it differs from `line`. */
  detailLine?: string;
  tags: string[];
  stack: string;
  bullets: string[];
  shots: Shot[];
  /** How many of `shots` appear on the card itself. */
  cardShots: number;
  live?: { href: string; label: string };
};

const shot = (id: string, alt: string, phone = false): Shot => ({
  src: `/shots/${id}.webp`,
  alt,
  phone,
});

export const PROJECTS: Project[] = [
  {
    id: "syllabuddy",
    name: "Syllabuddy",
    where: "Brown",
    line: "Turns your lectures into Duolingo-style practice, with a class AI that cites its sources.",
    detailLine: "Turns your lectures into Duolingo-style practice.",
    tags: ["Node.js", "PostgreSQL", "Claude API", "RAG"],
    stack: "JavaScript, Node.js, PostgreSQL, Claude API",
    bullets: [
      "Developed a full-stack learning platform that turns lectures, slides and notes into practice exercises and a course-specific RAG chatbot with source-cited answers",
      "Wrote a lecture-processing engine in Node.js that turns a transcript into a summary, key terms, flashcards, quizzes and a study plan timed to the exam",
      "Built a 20-case eval suite with off-topic and trick prompts, and picked the model passing every case at 1/14 the cost of larger models",
      "Built a 30+ endpoint REST API with 82 automated tests",
    ],
    shots: [
      shot("syllabuddy-ai-answer", "Syllabuddy's Class AI answering a biology question and highlighting the passage it used"),
      shot("syllabuddy-practice", "A Syllabuddy practice question on cell structure"),
      shot("syllabuddy-class", "A Syllabuddy class page with units, lessons and recaps"),
      shot("syllabuddy-how", "Syllabuddy's explanation of how the app works"),
    ],
    cardShots: 3,
    live: { href: "https://syllabuddy.up.railway.app/", label: "Open the live site" },
  },
  {
    id: "rizdum",
    name: "Rizdum",
    where: "Brown",
    line: "Ranked 2v2 duo matchmaking over live video.",
    tags: ["Next.js", "LiveKit", "Supabase"],
    stack: "Next.js, TypeScript, LiveKit, Supabase, Tailwind",
    bullets: [
      "Built real-time 1v1 and 2v2 video calls with LiveKit, using server-issued access tokens so only matched players can join a call room",
      "Engineered matchmaking on Supabase Postgres: party invite codes, a live queue and a locked matching function that keeps simultaneous requests from double-matching a party",
      "Synced checkpoint votes and in-call chat between browsers over LiveKit data messages, so every player reaches the same result at each checkpoint",
      "Designed the game loop around the calls: daily quests, double-XP events, leaderboards and rank-ups from Iron to Radiant",
    ],
    shots: [
      shot("rizdum-call", "A Rizdum 2v2 video call with a checkpoint vote"),
      shot("rizdum-home", "The Rizdum home screen with queues, quests and a leaderboard"),
      shot("rizdum-profile", "A Rizdum profile with stats and rank history"),
      shot("rizdum-leaderboards", "Rizdum's leaderboards"),
    ],
    cardShots: 1,
    live: { href: "https://rizdum.vercel.app/", label: "Try it live" },
  },
  {
    id: "loops",
    name: "Loops",
    where: "Brown",
    line: "Pickup basketball: find runs, play ranked, post highlights.",
    tags: ["React Native", "Expo"],
    stack: "React Native, Expo, TypeScript",
    bullets: [
      "Built a five-tab iOS app in React Native and Expo with a court map, King of the Court and Strava-style game posts",
      "Designed standardized ranked rules (1v1 to 11, team games to 21, scored in 1s and 2s) and a captain-tagging flow for building teams",
      "Ran the demo on a mock API behind the same interface a real backend will use, so screens need no changes to go live; preparing to pitch it at Brown VC events",
    ],
    shots: [
      shot("loops-activity", "The Loops activity feed with a game result", true),
      shot("loops-map", "The Loops court map of Los Angeles", true),
      shot("loops-play", "Choosing a ranked or unranked game in Loops", true),
      shot("loops-local", "Pickup runs near you in Loops", true),
      shot("loops-account", "A Loops player profile with ratings", true),
    ],
    cardShots: 3,
  },
  {
    id: "placivic",
    name: "Placivic",
    where: "Los Angeles",
    line: "Associate. Designed and built the full website for a strategy consultancy with real clients.",
    detailLine: "Associate at a strategy consultancy for mission-driven organizations.",
    tags: ["Next.js", "Netlify Functions", "Resend"],
    stack: "Next.js, React, Netlify Functions, Resend",
    bullets: [
      "Designed and built Placivic's website, translating the company's values and approach to consulting for mission-driven organizations into a clear, cohesive online presence",
      "Engineered a full-stack contact form using Netlify serverless functions and the Resend API, with server-side validation, spam protection and secure API key management",
      "Wrote client-facing service briefs for implementation roadmaps, sustainability audits, grant program design and strategic partnerships",
    ],
    shots: [
      shot("placivic-hero", "The Placivic homepage"),
      shot("placivic-services", "Placivic's four service cards"),
      shot("placivic-service-page", "A Placivic service detail page"),
    ],
    cardShots: 3,
    live: { href: "https://placivic.com/preview.html", label: "Visit placivic.com" },
  },
  {
    id: "fsab",
    name: "Full Stack at Brown",
    where: "Brown",
    line: "Client site for Brown Technology Consulting Group, front and back end with React and JavaScript.",
    detailLine: "Web developer on a cross-functional client team.",
    tags: ["React", "JavaScript"],
    stack: "React, JavaScript, HTML, CSS",
    bullets: [
      "Developed a custom website for Brown Technology Consulting Group as part of a cross-functional team serving campus and community organizations",
      "Created front-end and back-end features in React, JavaScript, HTML and CSS from design specs and client requirements",
      "Worked through the full development cycle to integrate features, take client feedback and deliver a production-ready site",
    ],
    shots: [],
    cardShots: 0,
  },
];

export const INTRO =
  "CS and Philosophy at Brown. I design and build full-stack products on my own, then actually use them.";

export const EXPERIENCE = [
  {
    when: "Jan - May 2026",
    name: "Slalom Consulting x LAPD",
    body: "Designed an AI decision-support system for police response: bodycam analysis, historical call data, risk detection.",
    award: "Impact Award, 1st place",
  },
  {
    when: "Summer 2025",
    name: "Stable Dynamics",
    body: "Software development and support intern on Rain Rain (8M+ downloads). Prototyped a fitness-challenge app.",
  },
  {
    when: "Summer 2025",
    name: "Loyola Marymount University",
    body: "Research assistant to Prof. Tracy Tiemeier on comparative theology; built the project's annotated bibliography.",
  },
  {
    when: "Honors",
    name: "Hispanic Scholarship Fund Scholar",
    body: "Palisades Charter, 4.0 unweighted. Now at Brown, class of 2030.",
  },
];

export const VOLUNTEERING = {
  when: "Sundays in Los Angeles",
  name: "Union Rescue Mission and Grass Roots Neighbors",
  body: "I volunteer with both shelter support and street outreach teams in Los Angeles, serving Sunday lunches and handing out meals, clothing and personal care items to unhoused individuals and families.",
};
