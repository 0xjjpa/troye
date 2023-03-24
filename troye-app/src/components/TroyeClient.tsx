import React, { useState } from "react";
import { CredentialRequestOptionsJSON, CredentialCreationOptionsJSON, create, get, PublicKeyCredentialWithAttestationJSON } from "@github/webauthn-json";
import QRCode from "qrcode.react";
import { Button } from "@chakra-ui/react";

export const TroyeClient: React.FC = () => {
  const [username, setUsername] = useState("");
  const [credential, setCredential] = useState<PublicKeyCredentialWithAttestationJSON | null>(null);
  const [blockchainHash, setBlockchainHash] = useState("");
  const [signedPayload, setSignedPayload] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  function bufferToBase64url(buffer: ArrayBuffer): string {
    // Buffer to binary string
    const byteView = new Uint8Array(buffer);
    let str = '';
    for (const charCode of byteView) {
      str += String.fromCharCode(charCode);
    }

    // Binary string to base64
    const base64String = btoa(str);

    // Base64 to base64url
    // We assume that the base64url string is well-formed.
    const base64urlString = base64String
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return base64urlString;
  }

  function randomBase64urlBytes(n: number = 32): string {
    return bufferToBase64url(crypto.getRandomValues(new Uint8Array(n)));
  }

  async function createCredential() {
    const requestOptions: CredentialCreationOptionsJSON = {
      publicKey: {
        challenge: randomBase64urlBytes(),
        rp: {
          name: "Your App",
        },
        user: {
          id: randomBase64urlBytes(),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          {
            type: "public-key",
            alg: -7, // ES256 algorithm
          },
        ],
        timeout: 60000,
        attestation: "none",
      }
    }

    try {
      const credential = await create(requestOptions);
      setCredential(credential);
      console.log(credential);
    } catch (err) {
      console.error("Error creating credential:", err);
    }

  }

  async function fetchLatestBlockchainHash() {
    //const client = getClient("http://your-rpc-endpoint:port");
    //const latestBlock = await client.getBlock("latest");
    setBlockchainHash("Hash, for now.");
  }

  async function signBlockchainHash() {
    if (!credential || !blockchainHash) {
      console.error("Missing credential or blockchain hash");
      return;
    }

    const requestOptions: CredentialRequestOptionsJSON = {
      publicKey: {
        challenge: randomBase64urlBytes(),
        allowCredentials: [
          {
            type: "public-key",
            id: credential.rawId,
          },
        ],
        timeout: 60000,
      }
    }

    try {
      const assertion = await get(requestOptions);
      setSignedPayload(assertion.response.signature);
      setPublicKey
        (assertion.response.clientDataJSON.toString());
      console.log(assertion);
    } catch (err) {
      console.error("Error signing blockchain hash:", err);
    }
  }

  return (
    <div>
      <h1>WebAuthn and Blockchain Hash Signer</h1>
      <label>
        Username:
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>

      <Button onClick={createCredential}>Create WebAuthn Credential</Button>

      <Button onClick={fetchLatestBlockchainHash}>
        Fetch Latest Blockchain Hash
      </Button>

      {blockchainHash && <p>Latest Blockchain Hash: {blockchainHash}</p>}

      <Button onClick={signBlockchainHash} disabled={!credential || !blockchainHash}>
        Sign Blockchain Hash with WebAuthn Credential
      </Button>

      {signedPayload && (
        <>
          <h2>Signed Payload</h2>
          <QRCode value={signedPayload.toString()} />
        </>
      )}

      {publicKey && (
        <>
          <h2>Public Key</h2>
          <QRCode value={publicKey} />
        </>
      )}
    </div>
  );


};

