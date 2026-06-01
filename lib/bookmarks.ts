import { BOOKMARKS_STORAGE_KEY } from "@/lib/local-storage-keys";

export type BookmarkItemType = "course" | "resource";

export type BookmarkItemInput = {
  id: string;
  type: BookmarkItemType;
  title: string;
  href: string;
  subtitle?: string;
  badge?: string;
  external?: boolean;
};

export type BookmarkItem = BookmarkItemInput & {
  key: string;
  createdAt: number;
  updatedAt: number;
};

export type BookmarkCollection = {
  id: string;
  title: string;
  itemKeys: string[];
  createdAt: number;
  updatedAt: number;
};

export type BookmarksState = {
  items: BookmarkItem[];
  collections: BookmarkCollection[];
};

const BOOKMARKS_STORAGE_VERSION = 1;
const BOOKMARKS_EVENT = "aoun:bookmarks:changed";
const EMPTY_BOOKMARKS_STATE: BookmarksState = {
  items: [],
  collections: [],
};

let cachedBookmarksRaw: string | null | undefined;
let cachedBookmarksSnapshot: BookmarksState = EMPTY_BOOKMARKS_STATE;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getBookmarkItemKey(type: BookmarkItemType, id: string) {
  return `${type}:${id}`;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeBookmarkItem(
  value: unknown,
  fallbackCreatedAt = Date.now(),
): BookmarkItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = value.type;
  if (type !== "course" && type !== "resource") {
    return null;
  }

  const id = normalizeText(value.id);
  const title = normalizeText(value.title);
  const href = normalizeText(value.href);
  if (!id || !title || !href) {
    return null;
  }

  const createdAt =
    typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
      ? value.createdAt
      : fallbackCreatedAt;
  const updatedAt =
    typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt)
      ? value.updatedAt
      : createdAt;

  return {
    id,
    type,
    key: getBookmarkItemKey(type, id),
    title,
    href,
    subtitle: normalizeOptionalText(value.subtitle),
    badge: normalizeOptionalText(value.badge),
    external: value.external === true,
    createdAt,
    updatedAt,
  };
}

function normalizeBookmarkCollection(value: unknown): BookmarkCollection | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeText(value.id);
  const title = normalizeText(value.title);
  if (!id || !title) {
    return null;
  }

  const createdAt =
    typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
      ? value.createdAt
      : Date.now();
  const updatedAt =
    typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt)
      ? value.updatedAt
      : createdAt;
  const itemKeys = Array.isArray(value.itemKeys)
    ? Array.from(
        new Set(
          value.itemKeys.flatMap((itemKey) => {
            const normalizedItemKey = normalizeText(itemKey);
            return normalizedItemKey ? [normalizedItemKey] : [];
          }),
        ),
      )
    : [];

  return {
    id,
    title,
    itemKeys,
    createdAt,
    updatedAt,
  };
}

function normalizeBookmarksState(value: unknown): BookmarksState {
  if (!isRecord(value) || value.version !== BOOKMARKS_STORAGE_VERSION) {
    return EMPTY_BOOKMARKS_STATE;
  }

  const items = Array.isArray(value.items)
    ? value.items.flatMap((item) => {
        const normalizedItem = normalizeBookmarkItem(item);
        return normalizedItem ? [normalizedItem] : [];
      })
    : [];
  const itemByKey = new Map<string, BookmarkItem>();

  for (const item of items) {
    const existing = itemByKey.get(item.key);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      itemByKey.set(item.key, item);
    }
  }

  const itemKeys = new Set(itemByKey.keys());
  const collections = Array.isArray(value.collections)
    ? value.collections.flatMap((collection) => {
        const normalizedCollection = normalizeBookmarkCollection(collection);
        if (!normalizedCollection) {
          return [];
        }

        return [
          {
            ...normalizedCollection,
            itemKeys: normalizedCollection.itemKeys.filter((itemKey) =>
              itemKeys.has(itemKey),
            ),
          },
        ];
      })
    : [];
  const collectionById = new Map<string, BookmarkCollection>();

  for (const collection of collections) {
    const existing = collectionById.get(collection.id);
    if (!existing || collection.updatedAt >= existing.updatedAt) {
      collectionById.set(collection.id, collection);
    }
  }

  return {
    items: Array.from(itemByKey.values()).toSorted(
      (left, right) => right.updatedAt - left.updatedAt,
    ),
    collections: Array.from(collectionById.values()).toSorted(
      (left, right) => right.updatedAt - left.updatedAt,
    ),
  };
}

function parseStoredBookmarks(value: string | null) {
  if (!value) {
    return EMPTY_BOOKMARKS_STATE;
  }

  try {
    return normalizeBookmarksState(JSON.parse(value));
  } catch {
    return EMPTY_BOOKMARKS_STATE;
  }
}

function serializeBookmarksState(state: BookmarksState) {
  return JSON.stringify({
    version: BOOKMARKS_STORAGE_VERSION,
    items: state.items,
    collections: state.collections,
  });
}

function updateBookmarksCache(state: BookmarksState) {
  cachedBookmarksSnapshot = normalizeBookmarksState({
    version: BOOKMARKS_STORAGE_VERSION,
    items: state.items,
    collections: state.collections,
  });
  cachedBookmarksRaw = serializeBookmarksState(cachedBookmarksSnapshot);
}

function dispatchBookmarksChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BOOKMARKS_EVENT));
  }
}

function createCollectionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `collection-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBookmarkItem(input: BookmarkItemInput): BookmarkItem {
  const now = Date.now();
  const normalizedItem = normalizeBookmarkItem({
    ...input,
    createdAt: now,
    updatedAt: now,
  });

  if (!normalizedItem) {
    throw new Error("Invalid bookmark item");
  }

  return normalizedItem;
}

export function loadBookmarks() {
  if (typeof window === "undefined") {
    return EMPTY_BOOKMARKS_STATE;
  }

  try {
    const rawValue = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (rawValue === cachedBookmarksRaw) {
      return cachedBookmarksSnapshot;
    }

    cachedBookmarksRaw = rawValue;
    cachedBookmarksSnapshot = parseStoredBookmarks(rawValue);
    return cachedBookmarksSnapshot;
  } catch {
    return EMPTY_BOOKMARKS_STATE;
  }
}

export function saveBookmarks(state: BookmarksState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    updateBookmarksCache(state);

    if (
      cachedBookmarksSnapshot.items.length === 0 &&
      cachedBookmarksSnapshot.collections.length === 0
    ) {
      window.localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
      cachedBookmarksRaw = null;
      dispatchBookmarksChange();
      return;
    }

    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, cachedBookmarksRaw ?? "");
    dispatchBookmarksChange();
  } catch {
    // Local storage may be blocked by the browser.
  }
}

export function addBookmarkItem(
  input: BookmarkItemInput,
  existingState: BookmarksState = loadBookmarks(),
) {
  const nextItem = createBookmarkItem(input);
  const existingItem = existingState.items.find(
    (item) => item.key === nextItem.key,
  );
  const savedItem = existingItem
    ? {
        ...nextItem,
        createdAt: existingItem.createdAt,
      }
    : nextItem;
  const nextState = {
    items: [
      savedItem,
      ...existingState.items.filter((item) => item.key !== nextItem.key),
    ],
    collections: existingState.collections,
  };

  saveBookmarks(nextState);
  return nextState;
}

export function removeBookmarkItem(
  itemKey: string,
  existingState: BookmarksState = loadBookmarks(),
) {
  const nextState = {
    items: existingState.items.filter((item) => item.key !== itemKey),
    collections: existingState.collections.map((collection) => ({
      ...collection,
      itemKeys: collection.itemKeys.filter(
        (collectionItemKey) => collectionItemKey !== itemKey,
      ),
    })),
  };

  saveBookmarks(nextState);
  return nextState;
}

export function createBookmarkCollection(
  title: string,
  existingState: BookmarksState = loadBookmarks(),
) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    return existingState;
  }

  const now = Date.now();
  const nextState = {
    items: existingState.items,
    collections: [
      {
        id: createCollectionId(),
        title: normalizedTitle,
        itemKeys: [],
        createdAt: now,
        updatedAt: now,
      },
      ...existingState.collections,
    ],
  };

  saveBookmarks(nextState);
  return nextState;
}

export function removeBookmarkCollection(
  collectionId: string,
  existingState: BookmarksState = loadBookmarks(),
) {
  const nextState = {
    items: existingState.items,
    collections: existingState.collections.filter(
      (collection) => collection.id !== collectionId,
    ),
  };

  saveBookmarks(nextState);
  return nextState;
}

export function setBookmarkCollectionMembership({
  collectionId,
  existingState = loadBookmarks(),
  included,
  itemKey,
}: {
  collectionId: string;
  existingState?: BookmarksState;
  included: boolean;
  itemKey: string;
}) {
  const now = Date.now();
  const nextState = {
    items: existingState.items,
    collections: existingState.collections.map((collection) => {
      if (collection.id !== collectionId) {
        return collection;
      }

      const itemKeys = included
        ? Array.from(new Set([itemKey, ...collection.itemKeys]))
        : collection.itemKeys.filter(
            (collectionItemKey) => collectionItemKey !== itemKey,
          );

      return {
        ...collection,
        itemKeys,
        updatedAt: now,
      };
    }),
  };

  saveBookmarks(nextState);
  return nextState;
}

export function subscribeBookmarks(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: Event) => {
    if (
      event instanceof StorageEvent &&
      event.key !== null &&
      event.key !== BOOKMARKS_STORAGE_KEY
    ) {
      return;
    }

    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(BOOKMARKS_EVENT, handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(BOOKMARKS_EVENT, handleStorage);
  };
}

export function getEmptyBookmarksSnapshot() {
  return EMPTY_BOOKMARKS_STATE;
}
