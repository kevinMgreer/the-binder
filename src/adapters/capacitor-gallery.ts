import { Media } from "@capacitor-community/media";
import type { Gallery } from "../ports";

const ALBUM = "The Binder";

function toDataUrl(photo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(photo);
  });
}

export class CapacitorGallery implements Gallery {
  async save(photo: Blob, name: string): Promise<void> {
    const path = await toDataUrl(photo);
    const { path: albumsPath } = await Media.getAlbumsPath();
    await Media.createAlbum({ name: ALBUM }).catch(() => {}); // rejects once the album exists
    await Media.savePhoto({ path, albumIdentifier: `${albumsPath}/${ALBUM}`, fileName: name });
  }
}
