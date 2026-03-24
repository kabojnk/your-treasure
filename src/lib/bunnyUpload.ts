const BUNNY_STORAGE_ZONE = import.meta.env.VITE_BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_API_KEY = import.meta.env.VITE_BUNNY_STORAGE_API_KEY;
const BUNNY_CDN_URL = import.meta.env.VITE_BUNNY_CDN_URL;

export async function uploadToBunny(file: File): Promise<string> {
  if (!BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_API_KEY || !BUNNY_CDN_URL) {
    throw new Error('Bunny.net CDN is not configured. Set VITE_BUNNY_STORAGE_ZONE, VITE_BUNNY_STORAGE_API_KEY, and VITE_BUNNY_CDN_URL in .env');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `field-guide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `field-guides/${fileName}`;

  const response = await fetch(
    `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${path}`,
    {
      method: 'PUT',
      headers: {
        AccessKey: BUNNY_STORAGE_API_KEY,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    }
  );

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  return `${BUNNY_CDN_URL}/${path}`;
}
