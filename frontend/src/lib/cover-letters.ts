export interface CoverLetterEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const STORAGE_KEY = "track_cover_letters";

function getAll(): Record<string, CoverLetterEntry[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, CoverLetterEntry[]>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCoverLetters(applicationId: string): CoverLetterEntry[] {
  return getAll()[applicationId] || [];
}

export function addCoverLetter(
  applicationId: string,
  title: string,
  content: string
): CoverLetterEntry {
  const all = getAll();
  const entry: CoverLetterEntry = {
    id: crypto.randomUUID(),
    title,
    content,
    created_at: new Date().toISOString(),
  };
  all[applicationId] = [...(all[applicationId] || []), entry];
  saveAll(all);
  return entry;
}

export function deleteCoverLetter(
  applicationId: string,
  entryId: string
): void {
  const all = getAll();
  if (all[applicationId]) {
    all[applicationId] = all[applicationId].filter((e) => e.id !== entryId);
    saveAll(all);
  }
}

export function updateCoverLetter(
  applicationId: string,
  entryId: string,
  title: string,
  content: string
): void {
  const all = getAll();
  if (all[applicationId]) {
    all[applicationId] = all[applicationId].map((e) =>
      e.id === entryId ? { ...e, title, content } : e
    );
    saveAll(all);
  }
}
