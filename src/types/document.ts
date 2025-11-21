/**
 * Document Type Definitions
 *
 * Defines the core types for the Active Document pattern,
 * which provides a single source of truth for the currently
 * active document (today or history).
 */

/**
 * Document type discriminator
 */
export type DocumentType = 'today' | 'history';

/**
 * View mode for the document
 */
export type ViewMode =
  | 'today'              // Viewing and editing today's document
  | 'history-readonly'   // Viewing history in read-only mode
  | 'history-edit';      // Actively editing a history document

/**
 * Active Document representation
 *
 * This is the single source of truth for whichever document
 * is currently being viewed or edited.
 */
export interface ActiveDocument {
  /** Document type discriminator */
  type: DocumentType;

  /** Date string in YYYYMMDD format (e.g., "20251121") */
  date: string;

  /** Full file path (used for history documents) */
  filePath: string | null;

  /** Current markdown content */
  content: string;

  /** Whether the document has unsaved changes */
  isDirty: boolean;

  /** Timestamp of last save */
  lastSaved: number | null;
}

/**
 * Reference to a document (lightweight)
 */
export type DocumentRef =
  | { type: 'today' }
  | { type: 'history'; date: string; filePath: string };

/**
 * Document metadata (for sidebar display)
 */
export interface DocumentMetadata {
  date: string;
  filePath: string;
  label: string;
  hasRetrospect: boolean;
}

/**
 * Save operation result
 */
export interface SaveResult {
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Document state for the store
 */
export interface DocumentState {
  /** Currently active document */
  activeDocument: ActiveDocument | null;

  /** Loading state */
  isLoading: boolean;

  /** Saving state */
  isSaving: boolean;

  /** Last error */
  lastError: string | null;
}

/**
 * Helper to create a today document reference
 */
export function createTodayRef(): DocumentRef {
  return { type: 'today' };
}

/**
 * Helper to create a history document reference
 */
export function createHistoryRef(date: string, filePath: string): DocumentRef {
  return { type: 'history', date, filePath };
}

/**
 * Helper to get current date in YYYYMMDD format
 */
export function getCurrentDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Helper to check if a date is today
 */
export function isToday(dateKey: string): boolean {
  return dateKey === getCurrentDateKey();
}

/**
 * Helper to format date key to readable label
 */
export function formatDateLabel(dateKey: string): string {
  // Format: YYYYMMDD -> YYYY년 MM월 DD일
  const year = dateKey.slice(0, 4);
  const month = dateKey.slice(4, 6);
  const day = dateKey.slice(6, 8);

  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const weekday = weekdays[date.getDay()];

  return `${year}년 ${month}월 ${day}일 ${weekday}`;
}
