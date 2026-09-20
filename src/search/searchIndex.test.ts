import { searchItems, scoreItem, type SearchItem } from './searchIndex';

const items: SearchItem[] = [
  { id: '1', title: 'AP Chemistry', subtitle: 'Mr. Morgan', category: 'Classes' },
  { id: '2', title: 'Mr. Morgan', subtitle: 'AP Chemistry', category: 'People' },
  { id: '3', title: 'Library Resources', subtitle: 'Research', category: 'Resources' },
  { id: '4', title: 'Homecoming Game', subtitle: 'Stadium', category: 'Events' },
];

describe('scoreItem', () => {
  it('ranks exact title match highest', () => {
    expect(scoreItem(items[0], 'ap chemistry')).toBe(100);
  });
  it('scores substring matches', () => {
    expect(scoreItem(items[0], 'chem')).toBe(60);
  });
  it('is case-insensitive', () => {
    expect(scoreItem(items[0], 'AP CHEMISTRY')).toBe(100);
  });
  it('returns 0 for no match', () => {
    expect(scoreItem(items[0], 'zebra')).toBe(0);
  });
});

describe('searchItems', () => {
  it('filters by category', () => {
    const result = searchItems(items, 'morgan', 'People');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
  it('returns multiple matches sorted by score', () => {
    const result = searchItems(items, 'morgan', 'All');
    expect(result[0].id).toBe('2'); // exact title match outranks subtitle match
  });
  it('returns empty for empty query', () => {
    expect(searchItems(items, '')).toHaveLength(0);
  });
});
