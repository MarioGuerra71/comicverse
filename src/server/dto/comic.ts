export interface ComicListRow {
  id: string;
  title: string;
  storyTitle: string | null;
  releaseDate: Date | null;
  coverThumbUrl: string | null;
  series: {
    id: string;
    name: string;
    startYear: number | null;
    publisher: { name: string };
  };
  _count: { characters: number };
}

export interface ComicListItemDto {
  id: string;
  title: string;
  storyTitle: string | null;
  releaseDate: string | null;
  coverThumbUrl: string | null;
  series: { id: string; name: string; startYear: number | null };
  publisher: string;
  characterCount: number;
}

export function toComicListItem(row: ComicListRow): ComicListItemDto {
  return {
    id: row.id,
    title: row.title,
    storyTitle: row.storyTitle,
    releaseDate: row.releaseDate ? row.releaseDate.toISOString().slice(0, 10) : null,
    coverThumbUrl: row.coverThumbUrl,
    series: {
      id: row.series.id,
      name: row.series.name,
      startYear: row.series.startYear,
    },
    publisher: row.series.publisher.name,
    characterCount: row._count.characters,
  };
}