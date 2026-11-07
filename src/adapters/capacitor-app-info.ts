import { App } from "@capacitor/app";
import type { AppInfo } from "../ports";

export class CapacitorAppInfo implements AppInfo {
  async getVersion() {
    const info = await App.getInfo();
    return { versionName: info.version, versionCode: Number(info.build) };
  }
}
