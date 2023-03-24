import React, { useState } from "react";
import QRCode from "qrcode.react";
import { Button } from "@chakra-ui/react";

import { importWebAuthnPublicKey, signAndVerify, verifyPublicKeyAndSignature } from "@/helpers/verify";
import { credentialCreationOptions } from "@/helpers/webauthn";

export const TroyeClient: React.FC = () => {
  const [username, setUsername] = useState("");
  const [credential, setCredential] = useState<PublicKeyCredential | null>(null);
  const [blockchainHash, setBlockchainHash] = useState("");
  const [signedPayload, setSignedPayload] = useState<Uint8Array | null>(null);
  const [publicKey, setPublicKey] = useState<ArrayBuffer | null>(null);

  async function createCredential() {
    try {
      const credential = (await navigator.credentials.create(
        credentialCreationOptions(username)
      )) as PublicKeyCredential;
      setCredential(credential);
      console.log(credential);
    } catch (err) {
      console.error("Error creating credential:", err);
    }
  }

  async function handleSignAndVerify() {
    if (!signedPayload || !publicKey || !credential) {
      console.error("Missing signed payload or public key");
      return;
    }

    try {
      // Import the WebAuthn public key
      // const webAuthnPublicKey = await importWebAuthnPublicKey(base64urlToBuffer(publicKey));

      const verification = await verifyPublicKeyAndSignature(publicKey, credential);

      console.log("Verification", verification)

      // Perform the sign and verify operation
      // const result = await signAndVerify(blockchainHash, base64urlToBuffer(signedPayload), webAuthnPublicKey);

      // Handle the result (e.g., display the verified status, new signature, and new public key)
      // console.log("Verification result:", result.verified);
      // console.log("New signature:", result.newSignature);
      // console.log("New P-256 public key:", result.p256PublicKey);
    } catch (err) {
      console.error("Error in sign and verify process:", err);
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

    const requestOptions: CredentialRequestOptions = {
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
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
      // This is obtained only from the counterparty.
      const assertion = (await navigator.credentials.get(
        requestOptions
      )) as PublicKeyCredential;

      // This can only be obtained from the authenticator.
      const publicKey = (credential.response as AuthenticatorAttestationResponse).getPublicKey();

      if (!publicKey) {
        console.error("Missing public key");
        return;
      }

      // We verify the given public key matches the signed from the authenticator.
      const verification = await verifyPublicKeyAndSignature(publicKey, assertion);
      
      setSignedPayload(verification.signature);
      setPublicKey(publicKey);
      console.log(publicKey);
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

      {/* <Button onClick={handleSignAndVerify} disabled={!signedPayload || !publicKey}>
        Sign and Verify
      </Button> */}


      {signedPayload && (
        <>
          <h2>Signed Payload</h2>
          <QRCode value={signedPayload.toString()} />
        </>
      )}

      {/* {publicKey && (
        <>
          <h2>Public Key</h2>
          <QRCode value={publicKey} />
        </>
      )} */}
    </div>
  );


};

