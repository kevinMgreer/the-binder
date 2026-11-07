import { registerPlugin } from "@capacitor/core";
import type { NativeAuthPlugin } from "./native-auth";

type Account = { idToken: string; email: string };
type Authorization = { accessToken: string; expiresInSeconds: number };

interface BinderAuthPlugin {
  signIn(options: { serverClientId: string }): Promise<{ account: Account | null }>;
  silentSignIn(options: { serverClientId: string }): Promise<{ account: Account | null }>;
  authorize(options: { scopes: string[]; interactive: boolean }): Promise<{ authorization: Authorization | null }>;
  clearCredentialState(): Promise<void>;
}

const plugin = registerPlugin<BinderAuthPlugin>("BinderAuth");

export const capacitorNativeAuth: NativeAuthPlugin = {
  signIn: async (options) => (await plugin.signIn(options)).account,
  silentSignIn: async (options) => (await plugin.silentSignIn(options)).account,
  authorize: async (options) => (await plugin.authorize(options)).authorization,
  clearCredentialState: () => plugin.clearCredentialState(),
};
