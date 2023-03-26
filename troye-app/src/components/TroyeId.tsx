import { buf2hex, hex2buf } from "@/helpers/buffers";
import { Button } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

export const TroyeId = ({ username, publicKeyAsHex, qrPayloadAsUint8Array, setTroyePublicKey }: { username: string, publicKeyAsHex: string, qrPayloadAsUint8Array: Uint8Array, setTroyePublicKey: (ArrayBuffer) => void }) => {
  const [rawId, setRawId] = useState<string | null>(null);

  const createCredential = async () => {
    console.log("Creating credential")
    try {
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(16),
        rp: {
          name: "Troye",
        },
        user: {
          id: new Uint8Array(16),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          {
            type: "public-key",
            alg: -7,
          },
        ],
        timeout: 60000,
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      const rawIdStr = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem(`${publicKeyAsHex}-rawId`, rawIdStr);
      const troyePublicKey = (credential.response as AuthenticatorAttestationResponse).getPublicKey();
      localStorage.setItem(rawIdStr, buf2hex(troyePublicKey));

      setTroyePublicKey(troyePublicKey);
      setRawId(rawIdStr);
    } catch (error) {
      console.error("Error creating credential:", error);
    }
  }

  const loadCredential = async () => {
    console.log("Getting credential", rawId);
    try {
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: qrPayloadAsUint8Array,
        timeout: 60000,
        allowCredentials: [
          {
            type: "public-key",
            id: new Uint8Array(atob(rawId).split("").map((c) => c.charCodeAt(0))),
            transports: ["usb", "ble", "nfc", "internal"],
          },
        ],
      };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      console.log("Attestation:", assertion);
    } catch (error) {
      console.error("Error getting credential:", error);
    }
  }

  useEffect(() => {
    console.log("Loading key", publicKeyAsHex);
    const storedRawId = localStorage.getItem(`${publicKeyAsHex}-rawId`);
    if (storedRawId) {
      setRawId(storedRawId);
      const storedTroyePublicKey = localStorage.getItem(storedRawId);
      setTroyePublicKey(storedTroyePublicKey ? hex2buf(storedTroyePublicKey) : null);
    }
    return () => {
      console.log("Unmounting TroyeId");
      setRawId(null);
      setTroyePublicKey(null);
    }
  }, []);

  return (
    <Button onClick={rawId ? loadCredential : createCredential}>{rawId ? 'Sign In w/Troye Id' : 'Create Troye Id'}</Button>
  );
};
