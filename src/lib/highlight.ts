import { createHighlighter, type Highlighter } from 'shiki';

// Build-time-only syntax highlighting with a light/dark theme pair, matching
// the site's color-scheme handling (media query + data-theme override).

let highlighter: Highlighter | undefined;

async function getHighlighter(): Promise<Highlighter> {
  highlighter ??= await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      'rust', 'typescript', 'javascript', 'python', 'cpp', 'c', 'json',
      'markdown', 'html', 'css', 'lua', 'bash', 'yaml', 'toml', 'xml',
      'astro', 'svelte',
    ],
  });
  return highlighter;
}

/** Returns highlighted HTML, or '' when highlighting fails (caller falls back to plain). */
export async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    const hl = await getHighlighter();
    let l = lang;
    if (!hl.getLoadedLanguages().includes(l)) {
      try {
        await hl.loadLanguage(l as never);
      } catch {
        l = 'text';
      }
    }
    const html = hl.codeToHtml(code, {
      lang: l,
      themes: { light: 'github-light', dark: 'github-dark' },
    });
    // Shiki separates line spans with real newlines; drop them so lines can be
    // display:block for CSS-counter line numbers without double spacing.
    return html.replace(/<\/span>\n(<span class="line")/g, '</span>$1');
  } catch {
    return '';
  }
}
