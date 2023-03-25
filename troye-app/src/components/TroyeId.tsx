import { Button } from "@chakra-ui/react";
import React, { useState } from "react";

export const TroyeId = ({ username, publicKeyAsHex, qrPayloadAsUint8Array }: { username: string, publicKeyAsHex: string, qrPayloadAsUint8Array: Uint8Array }) => {
  const [rawId, setRawId] = useState<string | null>(null);

  const loadKey = async () => {
    const storedRawId = localStorage.getItem(`${publicKeyAsHex}-rawId`);

    if (!storedRawId) {
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

        setRawId(rawIdStr);
      } catch (error) {
        console.error("Error creating credential:", error);
      }
    } else {
      setRawId(storedRawId);
    }

    if (rawId) {
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
  };

  return (
    <Button onClick={loadKey}>Load Troye Id</Button>
  );
};
