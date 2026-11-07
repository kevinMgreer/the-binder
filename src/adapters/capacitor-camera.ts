import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { PermissionDeniedError, type PhotoSource } from "../ports";

export class CapacitorCameraPhotoSource implements PhotoSource {
  capture() {
    return this.get(CameraSource.Camera);
  }

  pick() {
    return this.get(CameraSource.Photos);
  }

  private async get(source: CameraSource): Promise<Blob | null> {
    try {
      const photo = await Camera.getPhoto({
        source,
        resultType: CameraResultType.Uri,
        quality: 100,
        correctOrientation: true,
      });
      return await (await fetch(photo.webPath!)).blob();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/cancel/i.test(message)) return null;
      if (/denied/i.test(message)) throw new PermissionDeniedError(message);
      throw error;
    }
  }
}
