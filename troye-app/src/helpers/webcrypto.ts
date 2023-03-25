import { ECDSAKeyPair } from "@/types/keypair";
import { buf2hex } from "./buffers";

export async function exportPublicKeyAsHex(keyPair: ECDSAKeyPair) {
    const exported = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    return buf2hex(exported);
  }