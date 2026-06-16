import { JournalEntry } from '../types';

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getEntryDateKey = (
  entry: Pick<JournalEntry, 'date' | 'created_at' | 'updated_at'>,
) => {
  const rawDate = entry.date || entry.created_at || entry.updated_at;

  if (!rawDate) {
    return getLocalDateKey();
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return rawDate.split('T')[0] || getLocalDateKey();
  }

  return getLocalDateKey(parsedDate);
};

export const getDateFromDateKey = (dateKey: string) => new Date(`${dateKey}T00:00:00`);
