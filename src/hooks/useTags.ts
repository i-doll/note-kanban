import { useMemo } from 'react';
import { useNotesStore } from '../stores';

export function useTags() {
  const { notes } = useNotesStore();

  return useMemo(() => {
    const tagCounts = new Map<string, number>();

    notes.forEach(note => {
      note.frontmatter.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const allTags = Array.from(tagCounts.keys()).sort();
    const tagsByFrequency = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    return {
      allTags,
      tagsByFrequency,
      tagCounts,
      getTopTags: (n: number) => tagsByFrequency.slice(0, n),
    };
  }, [notes]);
}
