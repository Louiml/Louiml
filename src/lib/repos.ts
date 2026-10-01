import fs from 'node:fs';
import path from 'node:path';
import { marked, Renderer } from 'marked';
import { projects, type Project } from '../data/content';

// ---------------------------------------------------------------------------
// Live GitHub data — read straight from the API at build time.
//
// Every build asks GitHub what the current default branch looks like, so
// pushing to a repo is enough to update the site: there is no separate
// snapshot step, no tarball extraction, and nothing stale to clear.
//
// Cost control:
//   * 2 API calls per repo (metadata + one recursive tree).
//   * File bodies come from raw.githubusercontent.com, which is a CDN and is
//     not part of the API rate limit.
//   * Responses are revalidated with ETags and cached under
//     .astro/cache/github. GitHub does not count 304s against the limit, so
//     repeat builds are effectively free — only a repo that actually changed
//     costs quota. Set GITHUB_TOKEN to raise the ceiling from 60/hr to
//     5000/hr (recommended on CI).
//   * If a request fails, the last good response is reused so a flaky network
//     or an exhausted rate limit degrades to stale-but-rendered instead of an
//     empty site.
// ---------------------------------------------------------------------------

const GITHUB_API = 'https://api.github.com';
const RAW = 'https://raw.githubusercontent.com';

/** Cache lives with Astro's own build state, never committed. */
const CACHE_DIR = path.join(process.cwd(), '.astro', 'cache', 'github');

/** Keeps us clear of secondary rate limits for parallel requests. */
const CONCURRENCY = 6;

export interface TreeNode {
  name: string;
  /** Path relative to repo root — '' for the root itself. */
  path: string;
  type: 'dir' | 'file';
  size: number;
  children: TreeNode[];
}

export interface RepoMeta {
  owner: string;
  /** "owner/repo", ready for GitHub URLs. */
  slug: string;
  branch: string;
  /** ISO timestamp of the last push, used for the "updated" label. */
  updatedAt: string | null;
  /** True when the repo was reachable and parsed this build. */
  available: boolean;
}

/** One row of the account-wide repo listing — the source for sorting. */
export interface RepoIndexEntry {
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  pushedAt: string | null;
  homepage: string | null;
  fork: boolean;
  archived: boolean;
  stars: number;
  /** False for repos the account merely collaborates on (not theirs to list). */
  ownedByAccount: boolean;
}

/** Caps that keep static generation fast — deeper paths link out to GitHub. */
export const MAX_BLOBS = 12; // code-view pages generated per repo
export const MAX_DIRS = 120; // directory pages generated per repo
export const MAX_BLOB_BYTES = 64 * 1024; // eligibility for a code-view page
export const MAX_HIGHLIGHT_BYTES = 48 * 1024; // shiki highlight threshold

const TEXT_EXT = new Set([
  'rs', 'toml', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'md', 'mdx',
  'txt', 'html', 'htm', 'css', 'scss', 'less', 'py', 'cpp', 'cc', 'cxx', 'c',
  'h', 'hpp', 'lua', 'sh', 'bash', 'zsh', 'ps1', 'psm1', 'yml', 'yaml', 'xml',
  'svg', 'astro', 'svelte', 'vue', 'ini', 'conf', 'cfg', 'env', 'gradle', 'kt',
  'kts', 'java', 'go', 'php', 'rb', 'sql', 'swift', 'zig', 'nix', 'r', 'm',
  'pl', 'bat', 'cmd', 'make', 'properties', 'example', 'sample', 'gitignore',
  'gitattributes', 'dockerignore', 'editorconfig', 'npmrc', 'prettierignore',
  'eslintignore', 'lock',
]);

const TEXT_NAMES = new Set([
  'license', 'licence', 'notice', 'changelog', 'contributing', 'dockerfile',
  'makefile', 'jenkinsfile', 'cmakelists.txt', 'codeowners',
]);

const EXT_LANG: Record<string, string> = {
  rs: 'rust', toml: 'toml', ts: 'typescript', tsx: 'typescript',
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  json: 'json', md: 'markdown', mdx: 'markdown', txt: 'text', html: 'html',
  htm: 'html', css: 'css', scss: 'scss', less: 'less', py: 'python',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', c: 'c', h: 'c', hpp: 'cpp', lua: 'lua',
  sh: 'bash', bash: 'bash', zsh: 'bash', ps1: 'powershell', psm1: 'powershell',
  yml: 'yaml', yaml: 'yaml', xml: 'xml', svg: 'xml', astro: 'astro',
  svelte: 'svelte', vue: 'vue', ini: 'ini', conf: 'ini', cfg: 'ini',
  env: 'bash', gradle: 'gradle', kt: 'kotlin', kts: 'kotlin', java: 'java',
  go: 'go', php: 'php', rb: 'ruby', sql: 'sql', swift: 'swift', zig: 'zig',
  nix: 'nix', r: 'r', m: 'objc', pl: 'perl', bat: 'bat', cmd: 'bat',
  make: 'makefile', properties: 'properties', lock: 'text', gitignore: 'bash',
  gitattributes: 'bash', dockerignore: 'bash', editorconfig: 'ini',
  npmrc: 'ini', example: 'text', sample: 'text',
};

const LANG_COLORS: Record<string, string> = {
  rust: '#dea584', typescript: '#3178c6', javascript: '#f1e05a', 'c++': '#f34b7d',
  python: '#3572a5', svelte: '#ff3e00', astro: '#ff5d01', html: '#e34c26',
  css: '#563d7c', lua: '#5c2f91', rak: '#dea584', fork: '#8b949e',
};

/** Split a GitHub project URL into owner/repo. */
export function ownerRepoFromUrl(url: string): { owner: string; repo: string } {
  const m = /^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)/.exec(url);
  return { owner: m?.[1] ?? '', repo: (m?.[2] ?? '').replace(/\.git$/, '') };
}

export function repoNameFromUrl(url: string): string {
  return ownerRepoFromUrl(url).repo;
}

// --- fetch plumbing ----------------------------------------------------------

interface RepoApiMeta {
  default_branch?: string;
  pushed_at?: string | null;
  private?: boolean;
}

interface RepoListEntry {
  name: string;
  description?: string | null;
  language?: string | null;
  pushed_at?: string | null;
  homepage?: string | null;
  fork?: boolean;
  archived?: boolean;
  stargazers_count?: number;
  owner?: { login?: string };
}

interface TreeApiEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  size?: number;
}

interface TreeApiResponse {
  tree?: TreeApiEntry[];
  truncated?: boolean;
}

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'agamiz-portfolio',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const auth = token();
  if (auth) headers.Authorization = `Bearer ${auth}`;
  return headers;
}

function cacheFileFor(url: string): string {
  const key = Buffer.from(url, 'utf8').toString('base64url').slice(0, 120);
  return path.join(CACHE_DIR, `${key}.json`);
}

function readCache(file: string): { etag: string; body: string } | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      etag?: string;
      body?: string;
    };
    return parsed.etag && parsed.body ? { etag: parsed.etag, body: parsed.body } : null;
  } catch {
    return null;
  }
}

/**
 * GET a GitHub API URL, revalidating against the cached ETag.
 * Falls back to the cached body whenever the network or the rate limit says no.
 */
async function apiGet<T>(url: string): Promise<T | null> {
  const file = cacheFileFor(url);
  const cached = readCache(file);
  const headers = apiHeaders();
  if (cached) headers['If-None-Match'] = cached.etag;

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch {
    return cached ? (JSON.parse(cached.body) as T) : null;
  }

  if (res.status === 304 && cached) return JSON.parse(cached.body) as T;
  if (!res.ok) {
    if (res.status !== 404) {
      console.warn(`[repos] ${res.status} ${res.statusText} for ${url}`);
    }
    return cached ? (JSON.parse(cached.body) as T) : null;
  }

  const body = await res.text();
  const etag = res.headers.get('etag');
  if (etag) {
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ etag, body }));
    } catch {
      /* cache is best-effort — a read-only filesystem just means no caching */
    }
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

/**
 * Fetch a file body from the raw CDN — no API rate limit involved.
 *
 * The CDN can still return a transient 429/5xx, and a silent failure here would
 * render an empty code block, so a failed attempt is retried once. Bodies are
 * capped by MAX_BLOB_BYTES, so this stays cheap.
 */
async function rawGet(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
): Promise<string> {
  const encoded = [branch, ...filePath.split('/')].map(encodeURIComponent).join('/');
  const url = `${RAW}/${owner}/${repo}/${encoded}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'agamiz-portfolio' } });
      if (res.ok) return await res.text();
      // 404 is a real answer (file removed between the tree and this fetch).
      if (res.status === 404) return '';
      if (attempt === 0) await new Promise((r) => setTimeout(r, 250));
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 250));
    }
  }

  console.warn(`[repos] could not fetch ${owner}/${repo}/${encoded}`);
  return '';
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        out[index] = await fn(items[index] as T);
      }
    },
  );
  await Promise.all(workers);
  return out;
}

// --- build trees from the flat recursive listing -----------------------------

function buildTree(repoName: string, entries: TreeApiEntry[]): TreeNode {
  const root: TreeNode = { name: repoName, path: '', type: 'dir', size: 0, children: [] };

  // The API returns a flat list; directories are implied by the file paths
  // below them, so only blobs need to be materialised.
  for (const entry of entries) {
    if (entry.type !== 'blob') continue;
    const segments = entry.path.split('/');
    const fileName = segments.pop();
    if (!fileName) continue;

    let cursor = root;
    let prefix = '';
    for (const segment of segments) {
      prefix = prefix ? `${prefix}/${segment}` : segment;
      let next = cursor.children.find(
        (child) => child.type === 'dir' && child.name === segment,
      );
      if (!next) {
        next = { name: segment, path: prefix, type: 'dir', size: 0, children: [] };
        cursor.children.push(next);
      }
      cursor = next;
    }

    cursor.children.push({
      name: fileName,
      path: entry.path,
      type: 'file',
      size: entry.size ?? 0,
      children: [],
    });
  }

  return root;
}

// --- in-memory state, filled once per build ----------------------------------
//
// Astro can evaluate this module in more than one module registry during a
// build, so module-level variables are not enough to guarantee a single round
// of requests. The state hangs off globalThis, which is shared by every
// registry in the process — without this a cold build can fetch each repo twice
// and burn the (unauthenticated) rate limit twice as fast.

interface LoaderState {
  promise: Promise<void> | null;
  meta: Map<string, RepoMeta>;
  tree: Map<string, TreeNode | null>;
  file: Map<string, string>;
  index: Map<string, RepoIndexEntry>;
}

const STATE_KEY = Symbol.for('agamiz.repos.loader');

const state: LoaderState = ((globalThis as Record<symbol, unknown>)[STATE_KEY] ??= {
  promise: null,
  meta: new Map(),
  tree: new Map(),
  file: new Map(),
  index: new Map(),
}) as LoaderState;

const metaCache = state.meta;
const treeCache = state.tree;
const fileCache = state.file;
const indexCache = state.index;

const cacheKey = (slug: string, filePath: string) => `${slug}\u0000${filePath}`;

/** slug -> lowercase repo name, so lookups don't re-parse URLs on every call. */
const slugToRepo = new Map(
  projects
    .filter((project) => typeof project.url === 'string')
    .map((project) => [project.slug, ownerRepoFromUrl(project.url!).repo.toLowerCase()]),
);

/** lowercase repo name -> slug, for spotting repos missing from content.ts. */
const repoToSlug = new Map(
  projects
    .filter((project) => typeof project.url === 'string')
    .map((project) => [ownerRepoFromUrl(project.url!).repo.toLowerCase(), project.slug]),
);

function token(): string | undefined {
  const value = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  return value && value.trim() !== '' ? value.trim() : undefined;
}

/**
 * `/rate_limit` does not count against the limit, so this is a free way to tell
 * the developer *before* the build starts quietly rendering empty repos.
 */
async function warnIfBudgetTight(needed: number): Promise<void> {
  if (token()) return;
  try {
    const res = await fetch(`${GITHUB_API}/rate_limit`, { headers: apiHeaders() });
    if (!res.ok) return;
    const body = (await res.json()) as {
      resources?: { core?: { limit?: number; remaining?: number } };
    };
    const core = body.resources?.core;
    const remaining = core?.remaining ?? 0;
    const limit = core?.limit ?? 60;

    if (remaining >= needed) return;
    console.warn(
      `[repos] GitHub allows ${limit} requests/hour unauthenticated and only ` +
        `${remaining} are left; this build needs about ${needed}. ` +
        'Set GITHUB_TOKEN (a public read-only token is enough) for 5000/hour. ' +
        'Responses are cached under .astro/cache/github, so a repeat build is ' +
        'nearly free — 304 revalidation does not count against the limit.',
    );
  } catch {
    /* never let a preflight failure stop the build */
  }
}

/**
 * One listing call per owner gives `pushed_at` for every repo, which is what the
 * work index sorts on — so ordering stays correct without extra per-repo calls.
 *
 * It doubles as a reconciliation check: if the account owns a repo that is not
 * in content.ts, the build says so instead of the omission going unnoticed.
 */
async function loadRepoIndex(owners: string[]): Promise<void> {
  for (const owner of owners) {
    const listed = await apiGet<RepoListEntry[]>(
      `${GITHUB_API}/users/${owner}/repos?per_page=100&sort=pushed&type=all`,
    );
    if (!Array.isArray(listed)) continue;

    for (const repo of listed) {
      if (!repo?.name) continue;
      indexCache.set(repo.name.toLowerCase(), {
        name: repo.name,
        owner: repo.owner?.login ?? owner,
        description: repo.description ?? null,
        language: repo.language ?? null,
        pushedAt: repo.pushed_at ?? null,
        homepage: repo.homepage ?? null,
        fork: repo.fork ?? false,
        archived: repo.archived ?? false,
        stars: repo.stargazers_count ?? 0,
        // The listing also contains repos the account only collaborates on.
        ownedByAccount: (repo.owner?.login ?? '').toLowerCase() === owner.toLowerCase(),
      });
    }

    const listedNames = new Set(
      listed
        .filter((r) => (r?.owner?.login ?? '').toLowerCase() === owner.toLowerCase())
        .map((r) => r.name.toLowerCase()),
    );
    const unlisted = [...listedNames].filter((name) => !repoToSlug.has(name));
    if (unlisted.length) {
      console.warn(
        `[repos] ${unlisted.length} repo(s) on ${owner} are not in src/data/content.ts: ` +
          `${unlisted.join(', ')}`,
      );
    }
  }
}

async function loadRepo(slug: string, url: string): Promise<void> {
  const { owner, repo } = ownerRepoFromUrl(url);
  if (!owner || !repo) return;

  const meta = await apiGet<RepoApiMeta>(`${GITHUB_API}/repos/${owner}/${repo}`);
  if (!meta || meta.private) {
    console.warn(`[repos] ${owner}/${repo} unavailable (renamed, private, or deleted)`);
    return;
  }

  const branch = meta.default_branch || 'main';
  const tree = await apiGet<TreeApiResponse>(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  if (!tree?.tree?.length) {
    console.warn(`[repos] no tree for ${owner}/${repo}@${branch}`);
    return;
  }
  if (tree.truncated) {
    console.warn(`[repos] ${owner}/${repo} tree truncated by GitHub — showing partial listing`);
  }

  const root = buildTree(repo, tree.tree);
  metaCache.set(slug, {
    owner,
    slug: `${owner}/${repo}`,
    branch,
    updatedAt: meta.pushed_at ?? null,
    available: true,
  });
  treeCache.set(slug, root);

  // Pull the bodies this build will actually render. Everything else links out
  // to GitHub rather than being copied here.
  const wanted = renderableFiles(root);
  const readme = findReadme(root);
  if (readme && !wanted.some((file) => file.path === readme.path)) {
    wanted.push(readme);
  }

  await mapPool(wanted, CONCURRENCY, async (file) => {
    fileCache.set(cacheKey(slug, file.path), await rawGet(owner, repo, branch, file.path));
  });
}

/**
 * Fetch every project's repository. Memoised across module registries, so
 * calling it from several pages costs exactly one round of requests per build.
 */
export function ensureReposLoaded(): Promise<void> {
  state.promise ??= (async () => {
    const started = Date.now();
    const targets = projects.filter(
      (project): project is typeof project & { url: string } =>
        typeof project.url === 'string' && /^https?:\/\/github\.com\//.test(project.url),
    );
    const owners = [
      ...new Set(targets.map((project) => ownerRepoFromUrl(project.url).owner).filter(Boolean)),
    ];

    await warnIfBudgetTight(targets.length * 2 + owners.length);
    await loadRepoIndex(owners);
    await mapPool(targets, CONCURRENCY, (project) => loadRepo(project.slug, project.url));

    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(
      `[repos] ${metaCache.size}/${targets.length} repos loaded from GitHub in ${secs}s`,
    );
    if (metaCache.size < targets.length) {
      console.warn(
        `[repos] ${targets.length - metaCache.size} repos showed no source — those pages link straight to GitHub.`,
      );
    }
  })();

  return state.promise;
}

export function getMeta(slug: string): RepoMeta {
  return (
    metaCache.get(slug) ?? {
      owner: '',
      slug: '',
      branch: 'main',
      updatedAt: null,
      available: false,
    }
  );
}

export function getRepoTree(slug: string): TreeNode | null {
  return treeCache.get(slug) ?? null;
}

// --- derived, always-current project facts -----------------------------------

/** Account-wide listing row for a project, when GitHub returned one. */
export function repoIndexFor(slug: string): RepoIndexEntry | null {
  const repo = slugToRepo.get(slug);
  return repo ? (indexCache.get(repo) ?? null) : null;
}

/** Last push for a project: the listing first, then the per-repo metadata. */
export function updatedAtFor(slug: string): string | null {
  return repoIndexFor(slug)?.pushedAt ?? getMeta(slug).updatedAt;
}

/**
 * Projects ordered by when they were last pushed, newest first.
 *
 * Driven by live GitHub data, so the work index reorders itself as work lands.
 * Projects with no live timestamp keep their content.ts position at the end.
 */
export function sortedProjects(): Project[] {
  return projects
    .map((project, i) => {
      const at = Date.parse(updatedAtFor(project.slug) ?? '');
      return { project, i, at: Number.isNaN(at) ? null : at };
    })
    .sort((a, b) => {
      if (a.at === null || b.at === null) {
        if (a.at !== b.at) return a.at === null ? 1 : -1;
        return a.i - b.i;
      }
      return b.at - a.at || a.i - b.i;
    })
    .map((entry) => entry.project);
}

/** Four-digit year, preferring the live push date over the stored one. */
export function yearFor(project: Project): string {
  const at = updatedAtFor(project.slug);
  if (at) {
    const parsed = new Date(at);
    if (!Number.isNaN(parsed.getTime())) return String(parsed.getUTCFullYear());
  }
  return project.year;
}

/**
 * Curated prose from content.ts, falling back to the repo's own GitHub
 * description so a new project is never blank.
 */
export function summaryFor(project: Project): string {
  if (project.summary?.trim()) return project.summary;
  const described = repoIndexFor(project.slug)?.description?.trim();
  return described || 'Details coming soon…';
}

export function sortedEntries(node: TreeNode): TreeNode[] {
  return [...node.children].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' });
  });
}

export function findNode(root: TreeNode, nodePath: string): TreeNode | null {
  let cur: TreeNode | null = root;
  for (const seg of nodePath.split('/')) {
    cur = cur?.children.find((c) => c.name === seg) ?? null;
    if (!cur) return null;
  }
  return cur;
}

export function isTextFile(node: TreeNode): boolean {
  if (node.type !== 'file' || node.size > MAX_BLOB_BYTES) return false;
  const lower = node.name.toLowerCase();
  if (TEXT_NAMES.has(lower)) return true;
  const ext = lower.includes('.') ? lower.split('.').pop()! : '';
  return TEXT_EXT.has(ext);
}

function allNodes(root: TreeNode, type: 'dir' | 'file'): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (node: TreeNode) => {
    for (const child of node.children) {
      if (child.type === type) out.push(child);
      if (child.type === 'dir') walk(child);
    }
  };
  walk(root);
  return out;
}

const byDepth = (a: TreeNode, b: TreeNode) =>
  a.path.split('/').length - b.path.split('/').length ||
  a.path.localeCompare(b.path, 'en', { sensitivity: 'base' });

/** Text files that get local blob pages — shallow files first, capped. */
export function renderableFiles(root: TreeNode): TreeNode[] {
  return allNodes(root, 'file').filter(isTextFile).sort(byDepth).slice(0, MAX_BLOBS);
}

/** Directories that get local tree pages — shallow first, capped. */
export function renderableDirs(root: TreeNode): TreeNode[] {
  return allNodes(root, 'dir').sort(byDepth).slice(0, MAX_DIRS);
}

export function findReadme(root: TreeNode): TreeNode | null {
  return (
    root.children.find(
      (c) => c.type === 'file' && /^readme(\.|$)/i.test(c.name),
    ) ?? null
  );
}

/**
 * File body, already fetched during load. Sync on purpose: the network work
 * happens once in `ensureReposLoaded`, so pages stay free of async plumbing.
 */
export function readFileNode(slug: string, node: TreeNode): string {
  return fileCache.get(cacheKey(slug, node.path)) ?? '';
}

export function ghTreeUrl(ownerRepo: string, branch: string, nodePath: string): string {
  return `https://github.com/${ownerRepo}/tree/${branch}/${nodePath}`.replace(/\/$/, '');
}

export function ghBlobUrl(ownerRepo: string, branch: string, nodePath: string): string {
  return `https://github.com/${ownerRepo}/blob/${branch}/${nodePath}`;
}

export function ghRawUrl(ownerRepo: string, branch: string, nodePath: string): string {
  return `https://raw.githubusercontent.com/${ownerRepo}/${branch}/${nodePath}`;
}

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** Largest-first, so 3 years reads as "3 years ago" and not "1,095 days ago". */
const RELATIVE_UNITS: [number, Intl.RelativeTimeFormatUnit][] = [
  [31_557_600_000, 'year'],
  [2_629_746_000, 'month'],
  [604_800_000, 'week'],
  [86_400_000, 'day'],
  [3_600_000, 'hour'],
  [60_000, 'minute'],
];

/** "3 days ago" from a GitHub `pushed_at` timestamp. Build-time only. */
export function relativeUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const delta = then - Date.now();
  for (const [ms, unit] of RELATIVE_UNITS) {
    if (Math.abs(delta) >= ms) return RELATIVE.format(Math.round(delta / ms), unit);
  }
  return RELATIVE.format(Math.round(delta / 1000), 'second');
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Must be a real escape — repo file contents are injected via set:html. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

/** Line-numbered code block for files that skip shiki highlighting. */
export function plainCodeBlock(code: string): string {
  const lines = code.split('\n');
  const body = lines
    .map((l) => `<span class="line">${escapeHtml(l) || '&#8203;'}</span>`)
    .join('');
  return `<pre class="code-block"><code>${body}</code></pre>`;
}

export function langForFile(name: string): string {
  const lower = name.toLowerCase();
  if (TEXT_NAMES.has(lower)) {
    if (lower === 'dockerfile') return 'dockerfile';
    if (lower === 'makefile') return 'makefile';
    return 'text';
  }
  const ext = lower.includes('.') ? lower.split('.').pop()! : '';
  return EXT_LANG[ext] ?? 'text';
}

export function langColor(role: string): string {
  const key = role.split('·').map((s) => s.trim().toLowerCase()).find(Boolean) ?? '';
  return LANG_COLORS[key] ?? '#8b949e';
}

export function fmtSize(n: number): string {
  // Non-breaking spaces keep the number and its unit together when wrapping.
  if (n < 1024) return `${n}\u00a0B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}\u00a0KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}\u00a0MB`;
}

// --- README sanitizing --------------------------------------------------------
// README markdown is third-party input rendered with set:html. `marked` emits
// raw HTML from the markdown source untouched, so that source has to be
// filtered. Only `renderer.html` tokens are filtered here — the HTML `marked`
// generates for markdown syntax is trusted — which keeps this an allowlist over
// a small, already-validated surface rather than a denylist over the whole
// document.

/** Elements dropped together with everything inside them. */
const DROP_WITH_CONTENT =
  /<(script|style|iframe|object|embed|form|input|button|select|textarea|link|meta|base|svg|math|noscript|template)\b[\s\S]*?(?:<\/\s*\1\s*>|$)/gi;

/** Raw-HTML tags kept in READMEs. Anything else is escaped and shown as text. */
const SAFE_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup',
  'dd', 'del', 'details', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li',
  'mark', 'ol', 'p', 'pre', 'q', 's', 'samp', 'small', 'span', 'strong',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead',
  'time', 'tr', 'u', 'ul', 'var',
]);

const SAFE_ATTRS = new Set([
  'align', 'alt', 'colspan', 'dir', 'height', 'href', 'lang', 'open', 'reversed',
  'rowspan', 'span', 'src', 'start', 'title', 'type', 'width',
]);

const DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

function isSafeUrl(value: string, allowDataImage = false): boolean {
  const url = value.trim().replace(/\s+/g, '');
  if (url === '') return true; // treated as same-document reference
  if (url.startsWith('#') || url.startsWith('/') || url.startsWith('.')) return true;
  if (/^(?:https?:|mailto:|tel:)/i.test(url)) return true;
  return allowDataImage && DATA_IMAGE_RE.test(url);
}

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function sanitizeAttributes(attrText: string): string {
  let out = '';
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(attrText)) !== null) {
    const name = m[1].toLowerCase();
    const raw = m[2] ?? m[3] ?? m[4] ?? '';
    if (name.startsWith('on')) continue; // event handlers
    if (!SAFE_ATTRS.has(name)) continue;
    if ((name === 'href' || name === 'src') && !isSafeUrl(raw, name === 'src')) continue;
    if (name === 'type' && !/^(?:text|checkbox|radio|button|submit|number|email|url|date)/i.test(raw)) continue;
    out += ` ${name}="${escapeHtml(raw)}"`;
  }
  return out;
}

function sanitizeRawHtml(input: string): string {
  return input.replace(DROP_WITH_CONTENT, '').replace(
    TAG_RE,
    (full, slash: string, tag: string, attrs: string) => {
      const name = tag.toLowerCase();
      if (!SAFE_TAGS.has(name)) return escapeHtml(full);
      const selfClosing = /\/\s*$/.test(attrs) ? ' /' : '';
      return `<${slash}${name}${sanitizeAttributes(attrs)}${selfClosing}>`;
    },
  );
}

function createSafeRenderer(): Renderer {
  const renderer = new Renderer();

  renderer.html = function (token) {
    return sanitizeRawHtml(String(token?.text ?? token ?? ''));
  };

  // The parser is attached to the renderer for the duration of a parse, so
  // nested inline tokens can be rendered with the same (safe) renderer.
  renderer.link = function (token) {
    if (!isSafeUrl(token.href)) return this.parser.parseInline(token.tokens ?? []);
    const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
    return `<a href="${escapeHtml(token.href)}"${title}>${this.parser.parseInline(token.tokens ?? [])}</a>`;
  };

  renderer.image = function (token) {
    if (!isSafeUrl(token.href, true)) return escapeHtml(token.text ?? '');
    const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
    return `<img src="${escapeHtml(token.href)}" alt="${escapeHtml(token.text ?? '')}"${title} loading="lazy" decoding="async">`;
  };

  return renderer;
}

/** Render README markdown, rewriting relative links/images to GitHub URLs. */
export function renderMarkdown(
  md: string,
  ownerRepo: string,
  branch: string,
  dir = '',
): string {
  let html = marked.parse(md, {
    gfm: true,
    async: false,
    renderer: createSafeRenderer(),
  }) as string;
  html = html.replace(
    /(src|href)="(?!https?:|#|data:|mailto:|\/\/)([^"]*)"/g,
    (_m, attr: string, val: string) => {
      const clean = val.split('#')[0].replace(/^\.\//, '');
      if (!clean) return `${attr}="#"`;
      const abs = dir ? `${dir}/${clean}` : clean;
      const encoded = [branch, ...abs.split('/')].map(encodeURIComponent).join('/');
      if (attr === 'src') {
        return `src="https://raw.githubusercontent.com/${ownerRepo}/${encoded}"`;
      }
      const kind = /\.[a-z0-9]+$/i.test(clean) ? 'blob' : 'tree';
      return `href="https://github.com/${ownerRepo}/${kind}/${encoded}"`;
    },
  );
  return html;
}
