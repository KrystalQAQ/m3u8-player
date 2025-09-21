import Dexie from 'dexie';

export const db = new Dexie('m3u8PlayerDatabase');
db.version(1).stores({
  playlist: '++id, &unique_key, items', // unique_key will be a constant to ensure only one playlist is stored
});

export async function savePlaylist(items) {
  // Use a constant key to always overwrite the same playlist entry
  const unique_key = 'current_playlist';
  await db.playlist.put({ unique_key, items });
}

export async function loadPlaylist() {
  const unique_key = 'current_playlist';
  const stored = await db.playlist.get({ unique_key });
  return stored ? stored.items : null;
}

export async function clearPlaylist() {
  await db.playlist.clear();
}