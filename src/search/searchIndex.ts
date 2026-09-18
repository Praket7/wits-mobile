export type SearchCategory = 'Classes' | 'People' | 'Resources' | 'Events';

export type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  route?: string;
};

export function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function scoreItem(item: SearchItem, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  const title = normalize(item.title);
  const subtitle = normalize(item.subtitle);
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (subtitle.includes(q)) return 40;
  // simple fuzzy: all query chars appear in order in the title
  let ti = 0;
  for (const ch of q) {
    ti = title.indexOf(ch, ti);
    if (ti === -1) return 0;
    ti += 1;
  }
  return 10;
}

export function searchItems(
  items: SearchItem[],
  query: string,
  filter?: SearchCategory | 'All'
): SearchItem[] {
  return items
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter(({ score }) => score > 0)
    .filter(({ item }) => !filter || filter === 'All' || item.category === filter)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
