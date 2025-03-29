import { parseBlob } from 'music-metadata-browser';

export async function extractMetadataFromFile(file) {
  const metadata = await parseBlob(file);
  const picture = metadata.common.picture?.[0];

  let coverUrl = null;
  let coverBlob = null;

  if (picture) {
    coverBlob = new Blob([picture.data], { type: picture.format });
    coverUrl = URL.createObjectURL(coverBlob);
  }

  return {
    title: metadata.common.title || file.name,
    artist: metadata.common.artist || '',
    albumArt: coverUrl,
    albumBlob: coverBlob,
    albumFormat: picture?.format || null,
  };
}


