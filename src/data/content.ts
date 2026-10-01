// ---------------------------------------------------------------------------
// Site content — single source of truth for the curated copy.
//
// `projects` lists your repos; each one needs a `slug`, `title`, `role`,
// `summary` and the GitHub `url`. `year` and the work-index ordering are NOT
// taken from here — those come from the live GitHub API, so pushing to a repo is
// enough to update the site and the list re-sorts itself by last push.
//
// Add a project object here and its page at /work/<slug> is generated
// automatically. The build warns if the account owns a repo missing from this
// list, so a new repo will not go unnoticed.
//
// Each build reads GitHub live. Unauthenticated builds get 60 requests/hour;
// set GITHUB_TOKEN (a public read-only token is enough) for 5000/hour, which is
// worth doing on CI.
// ---------------------------------------------------------------------------

export interface Project {
  /** URL slug — lowercase, hyphens, unique. */
  slug: string;
  title: string;
  /** Four-digit year, e.g. "2026". Fallback only — live push date wins. */
  year: string;
  /** Language or "Fork" marker, e.g. "Rust", "Fork · C++". */
  role: string;
  /** One sentence: what it is, who it was for, the result. */
  summary: string;
  tags: string[];
  /** Optional cover image — drop the file in /public and reference it here. */
  cover?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  /** GitHub repository. Required for live source browsing and sorting. */
  url?: string;
  /** Optional homepage / deployed site for this project. */
  homepage?: string;
  /** Optional case-study paragraphs shown on the project detail page. */
  body?: string[];
}

export const site = {
  name: 'louiml',
  discipline: 'Software Developer',
  location: '', // GitHub lists no location — set yours here to show it.
  // TODO: GitHub shows no public email — replace with the address you want contacted.
  email: 'hello@agamiz.com',
  availability: 'Open to New Projects & Collaborations',

  intro:
    'I build programming languages, AI experiments, and desktop tools — and publish all of it as open source. My flagship project is Rak, a general-purpose language written in Rust for cybersecurity work.',

  about: [
    'I’m louiml, an independent developer with 22 public repositories — from compilers and network scanners to AI models and Arduino hardware. My main focus is Rak, a general-purpose programming language built mainly for cybersecurity usage, now closing in on its first full version.',
    '“Check out Rak — we’re close to a full version. Come and suggest new ideas!” Beyond the language itself, I use Rak to build real tools — a network auditor and an ad blocker — while also experimenting with artificial emotional intelligence in SenlightAI and simulating AI villages in DigitalLife.',
  ],

  links: [
    { label: 'GitHub', href: 'https://github.com/Louiml' },
    { label: 'agamiz.com', href: 'https://agamiz.com' },
  ],
};

/**
 * Ordered roughly by last activity for readability while editing — the rendered
 * order comes from GitHub at build time, so this list never needs re-sorting.
 */
export const projects: Project[] = [
  {
    slug: 'senlightai',
    title: 'SenlightAI',
    year: '2026',
    role: 'Python',
    summary:
      'An AEI-driven psychological LLM for dynamic emotional state tracking and moral reasoning — Senlight Elafry (8B) runs on-device for real-time affective dialogue, with Varys (70B) for heavyweight analysis.',
    tags: ['AI', 'LLM', 'AEI', 'Psychology', 'On-Device'],
    url: 'https://github.com/Louiml/SenlightAI',
    homepage: 'https://louiml.github.io/SenlightAI/',
  },
  {
    slug: 'agamiz-code',
    title: 'AgamizCode',
    year: '2026',
    role: 'TypeScript',
    summary: 'Agamiz Code — an IDE for writing and running code, built as a TypeScript web app.',
    tags: ['IDE', 'TypeScript', 'Tooling'],
    url: 'https://github.com/Louiml/agamiz-code',
  },
  {
    slug: 'rak',
    title: 'Rak',
    year: '2026',
    role: 'Rust',
    summary:
      'A general-purpose programming language built mainly for cybersecurity usage, written in Rust.',
    tags: ['Programming Language', 'Compiler', 'Cybersecurity', 'IDE'],
    url: 'https://github.com/Louiml/Rak',
    homepage: 'https://louiml.github.io/Rak/',
    body: [
      'Rak is a general-purpose programming language written in Rust, designed mainly for cybersecurity usage. The project covers the compiler, IDE support, and documentation — and it is closing in on its first full version.',
      'The language already ships real tools written in it: NetAudit (a network auditor), a simple ad blocker, and early GUI/HTML experiments like the ipv4-to-ipv6 converter. Suggestions and new ideas are welcome on GitHub as development heads toward the full release.',
    ],
  },
  {
    slug: 'shortcutdeck',
    title: 'ShortcutDeck',
    year: '2026',
    role: 'JavaScript',
    summary:
      'A 6-button Arduino shortcut deck with per-key OLED labels, driven by a cross-platform desktop app that launches apps, opens files, and runs Lua scripts.',
    tags: ['Arduino', 'Hardware', 'Lua', 'Desktop'],
    url: 'https://github.com/Louiml/ShortcutDeck',
  },
  {
    slug: 'louiml-portfolio',
    title: 'This Portfolio',
    year: '2026',
    role: 'Astro',
    summary:
      'My portfolio — the site you’re looking at. Source browsing reads straight from the GitHub API, so it never needs a snapshot step.',
    tags: ['Astro', 'Portfolio'],
    url: 'https://github.com/Louiml/Louiml',
    homepage: 'https://agamiz.com',
  },
  {
    slug: 'adblocker',
    title: 'Adblocker',
    year: '2026',
    role: 'Rak',
    summary: 'A simple ad blocker written in Rak — a test project for the language.',
    tags: ['Rak', 'Test Project'],
    url: 'https://github.com/Louiml/adblocker',
  },
  {
    slug: 'agamizcinema',
    title: 'AgamizCinema',
    year: '2026',
    role: 'TypeScript',
    summary:
      'Watch movies & series using third-party sources, with an ad blocker included for desktop.',
    tags: ['TypeScript', 'Streaming', 'Web'],
    url: 'https://github.com/Louiml/AgamizCinema',
    homepage: 'https://cinema.agamiz.com',
  },
  {
    slug: 'digitallife',
    title: 'DigitalLife',
    year: '2026',
    role: 'TypeScript',
    summary:
      'Play god over a village of AI humans. Nothing is scripted. Not even their faith in you.',
    tags: ['AI', 'Simulation', 'TypeScript'],
    url: 'https://github.com/Louiml/DigitalLife',
  },
  {
    slug: 'farlight84skinchanger',
    title: 'Farlight 84 Skin Changer',
    year: '2026',
    role: 'C++',
    summary: 'A skin changer for Farlight 84. Use it at your own risk.',
    tags: ['C++', 'Game Tools'],
    url: 'https://github.com/Louiml/Farlight84skinchanger',
  },
  {
    slug: 'langs-in-rust',
    title: 'langs-in-rust',
    year: '2026',
    role: 'Fork · Python',
    summary:
      'Fork of a curated list of programming languages implemented in Rust, kept for inspiration while building Rak.',
    tags: ['Fork', 'Rust', 'Reference'],
    url: 'https://github.com/Louiml/langs-in-rust',
  },
  {
    slug: 'ipv4toipv6',
    title: 'ipv4toipv6',
    year: '2026',
    role: 'Rak',
    summary:
      'A minimal showcase for Rak’s new GUI HTML support. Not working perfectly, but it works.',
    tags: ['Rak', 'GUI'],
    url: 'https://github.com/Louiml/ipv4toipv6',
  },
  {
    slug: 'netaudit',
    title: 'NetAudit',
    year: '2026',
    role: 'Rak',
    summary:
      'A network scanner written in Rak — pings target ports, grabs response banners, and generates SHA-256 and MD5 hashes so you can spot services and detect unauthorized changes.',
    tags: ['Rak', 'Security', 'Networking'],
    url: 'https://github.com/Louiml/NetAudit',
  },
  {
    slug: 'website',
    title: 'website',
    year: '2026',
    role: 'Fork',
    summary: 'A forked website project, deployed at ryuzaki.agamiz.com.',
    tags: ['Fork', 'Web'],
    url: 'https://github.com/Louiml/website',
    homepage: 'https://ryuzaki.agamiz.com',
  },
  {
    slug: 'scue5-plugin-updated',
    title: 'SCUE5 Plugin Updated',
    year: '2026',
    role: 'Fork · C++',
    summary: 'Fork of the SCUE plugin, updated for Unreal Engine 5.',
    tags: ['Fork', 'C++', 'Unreal Engine'],
    url: 'https://github.com/Louiml/SCUE5-Plugin-updated',
  },
  {
    slug: 'webtop',
    title: 'WebTop',
    year: '2026',
    role: 'C++',
    summary: 'WebTop turns a website into a Windows EXE.',
    tags: ['C++', 'Desktop', 'Tooling'],
    url: 'https://github.com/Louiml/WebTop',
  },
  {
    slug: 'ryumusic',
    title: 'RyuMusic',
    year: '2026',
    role: 'Svelte',
    summary:
      'A media player built on the YouTube Music API — also perfect for the iPhone “Add to Home Screen” feature.',
    tags: ['Svelte', 'Media', 'YouTube Music'],
    url: 'https://github.com/Louiml/RyuMusic',
  },
  {
    slug: 'agamizscript',
    title: 'AgamizScript',
    year: '2026',
    role: 'TypeScript',
    summary: 'Write screenplays, manuscripts, and subtitles — with AI help.',
    tags: ['TypeScript', 'AI', 'Writing'],
    url: 'https://github.com/Louiml/AgamizScript',
  },
  {
    slug: 'agamizmockapi',
    title: 'AgamizMockAPI',
    year: '2026',
    role: 'TypeScript',
    summary: 'A mock API service for testing across the Agamiz project family.',
    tags: ['TypeScript', 'API', 'Testing'],
    url: 'https://github.com/Louiml/AgamizMockAPI',
  },
  {
    slug: 'text-generation-inference',
    title: 'text-generation-inference',
    year: '2023',
    role: 'Fork',
    summary:
      'Fork of the Large Language Model text-generation inference server, kept for research on projects like SenlightAI.',
    tags: ['Fork', 'LLM', 'Inference'],
    url: 'https://github.com/Louiml/text-generation-inference',
  },
  {
    slug: 'dreambooth-action',
    title: 'dreambooth-action',
    year: '2023',
    role: 'Fork',
    summary:
      'Fork of a GitHub Actions workflow for training custom DreamBooth text-to-image models.',
    tags: ['Fork', 'AI', 'Automation'],
    url: 'https://github.com/Louiml/dreambooth-action',
  },
  {
    slug: 'uptime-kuma',
    title: 'uptime-kuma',
    year: '2023',
    role: 'Fork',
    summary: 'Fork of Uptime Kuma, a fancy self-hosted monitoring tool.',
    tags: ['Fork', 'Monitoring'],
    url: 'https://github.com/Louiml/uptime-kuma',
  },
  {
    slug: 'betterdiscordaddons',
    title: 'BetterDiscordAddons',
    year: '2023',
    role: 'Fork',
    summary:
      'Fork of a series of plugins and themes for BetterDiscord.',
    tags: ['Fork', 'Discord'],
    url: 'https://github.com/Louiml/BetterDiscordAddons',
  },
];