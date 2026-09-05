export type Tech = { name: string; slug: string; color: string };

export type Group = {
  id: string;
  icon: 'systems' | 'frontend' | 'tools' | 'creative';
  title: string;
  blurb: string;
  items: Tech[];
};

export const groups: Group[] = [
  {
    id: 'systems',
    icon: 'systems',
    title: 'Systems & backend',
    blurb: 'Where I reach when it has to stay up under load.',
    items: [
      { name: 'Rust', slug: 'rust', color: '#ce422b' },
      { name: 'C++', slug: 'cplusplus', color: '#9c9c9c' },
      { name: 'Tauri', slug: 'tauri', color: '#ffc131' },
    ],
  },
  {
    id: 'frontend',
    icon: 'frontend',
    title: 'Frontend & web',
    blurb: 'Mostly what ships to users.',
    items: [
      { name: 'React', slug: 'react', color: '#149eca' },
      { name: 'Svelte', slug: 'svelte', color: '#ff3e00' },
      { name: 'Astro', slug: 'astro', color: '#ff5d01' },
      { name: 'TypeScript', slug: 'typescript', color: '#3178c6' },
      { name: 'TailwindCSS', slug: 'tailwindcss', color: '#38bdf8' },
    ],
  },
  {
    id: 'tools',
    icon: 'tools',
    title: 'Tools & environment',
    blurb: 'What the work happens in.',
    items: [
      { name: 'Git', slug: 'git', color: '#f05133' },
      { name: 'Linux', slug: 'linux', color: '#fcc624' },
      { name: 'Fleet', slug: 'jetbrains', color: '#fff' },
      { name: 'RustRover', slug: 'jetbrains', color: '#fff' },
      { name: 'WebStorm', slug: 'webstorm', color: '#07c1ff' },
      { name: 'OpenCode', slug: 'opencode', color: '#fff' },
      { name: 'Unreal Engine', slug: 'unrealengine', color: '#0e1128' },
    ],
  },
  {
    id: 'creative',
    icon: 'creative',
    title: 'Creative & media',
    blurb: 'For the parts that are not code.',
    items: [
      { name: 'Blender', slug: 'blender', color: '#ea7600' },
      { name: 'Photoshop', slug: 'adobephotoshop', color: '#31a8ff' },
      { name: 'Premiere Pro', slug: 'adobepremierepro', color: '#9999ff' },
      { name: 'Gemini', slug: 'googlegemini', color: '#4285f4' },
    ],
  },
];
