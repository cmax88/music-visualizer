import { parseBlob } from 'music-metadata-browser';

export async function extractCoverFromFile(file) {
  const metadata = await parseBlob(file);
  const picture = metadata.common.picture?.[0];
  if (!picture) return null;

  const blob = new Blob([picture.data], { type: picture.format });
  const url = URL.createObjectURL(blob);
  
  return {
    url,           // good for <img src=...>
    blob,          // useful for canvas/color-thief
    format: picture.format
  };
}
