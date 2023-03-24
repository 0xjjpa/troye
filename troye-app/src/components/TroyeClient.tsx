import React, { useState } from "react";
import QRCode from "qrcode.react";
import { Button, FormLabel, Input, SimpleGrid, Text, Flex } from "@chakra-ui/react";

import { importWebAuthnPublicKey, signAndVerify, verifyPublicKeyAndSignature } from "@/helpers/verify";
import { credentialCreationOptions } from "@/helpers/webauthn";

export const TroyeClient: React.FC = () => {
  const [username, setUsername] = useState("");
  const [credential, setCredential] = useState<PublicKeyCredential | null>(null);
  const [blockchainHash, setBlockchainHash] = useState("");
  const [signature, setSignature] = useState<Uint8Array | undefined>();
  const [authenticatorData, setAuthenticatorData] = useState<Uint8Array | undefined>();
  const [clientDataJSON, setClientDataJSON] = useState<ArrayBuffer | undefined>()
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
    if (!signature || !publicKey || !credential || !blockchainHash || !authenticatorData) {
      console.error("Missing signed payload or public key or blockchain hash or authenticator data");
      return;
    }

    try {
      // Import the WebAuthn public key
      const webAuthnPublicKey = await importWebAuthnPublicKey(publicKey);

      if (!webAuthnPublicKey) {
        console.error("Missing WebAuthn public key");
        return;
      }

      // const clientDataJSON = {
      //   type: "webauthn.get",
      //   challenge: bufferToBase64url(new TextEncoder().encode(blockchainHash)),
      //   origin: "http://localhost:3000",
      //   "crossOrigin": false
      // }

      const obtainedClientDataJSON = JSON.parse(new TextDecoder().decode(clientDataJSON));
      console.log("Obtained Client DATA JSON", obtainedClientDataJSON);

      const clientDataHash = new Uint8Array(
        await crypto.subtle.digest("SHA-256",
          new TextEncoder().encode(
            JSON.stringify(obtainedClientDataJSON)
          )
        )
      );

      var signedData = new Uint8Array(authenticatorData.length + clientDataHash.length);
      signedData.set(authenticatorData);
      signedData.set(clientDataHash, authenticatorData.length);
      console.log("signedData", signedData);

      // Perform the sign and verify operation
      const result = await signAndVerify(signedData, signature, webAuthnPublicKey);

      // Handle the result (e.g., display the verified status, new signature, and new public key)
      console.log("Verification result:", result.verified);
      console.log("New signature:", result.newSignature);
      console.log("New P-256 public key:", result.p256PublicKey);
    } catch (err) {
      console.error("Error in sign and verify process:", err);
    }
  }


  async function fetchLatestBlockchainHash() {
    //const client = getClient("http://your-rpc-endpoint:port");
    //const latestBlock = await client.getBlock("latest");
    setBlockchainHash("TODO");
  }

  async function signBlockchainHash() {
    if (!credential || !blockchainHash) {
      console.error("Missing credential or blockchain hash");
      return;
    }

    const challenge = new TextEncoder().encode(blockchainHash)

    const requestOptions: CredentialRequestOptions = {
      publicKey: {
        //challenge: crypto.getRandomValues(new Uint8Array(32)),
        challenge,
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
      console.log('Verification: ', verification);
      console.log('Blockchain Hash: ', blockchainHash, challenge, new TextDecoder().decode(challenge), new Uint8Array(await crypto.subtle.digest("SHA-256", challenge)));
      setSignature(verification?.signature);
      setAuthenticatorData(verification?.authenticatorData);
      setClientDataJSON(verification?.clientDataJSON);
      setPublicKey(publicKey);
      console.log(publicKey);
    } catch (err) {
      console.error("Error signing blockchain hash:", err);
    }
  }

  return (
    <div>
      <FormLabel>
        <Text>Username</Text>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </FormLabel>

      <SimpleGrid spacing="2">
        <Button onClick={createCredential}>Create WebAuthn Credential</Button>

        <Button onClick={fetchLatestBlockchainHash}>
          Fetch Latest Blockchain Hash
        </Button>

        {blockchainHash && <p>Latest Blockchain Hash: {blockchainHash}</p>}

        <Button onClick={signBlockchainHash} disabled={!credential || !blockchainHash}>
          Sign Blockchain Hash with WebAuthn Credential
        </Button>

        <Button onClick={handleSignAndVerify} disabled={!signature || !publicKey}>
          Verify WebAuthn Signed Payload and Create Key
        </Button>

        <SimpleGrid columns={[1,1,2,2]} spacing="2">
          {signature && (
            <Flex flexDirection="column" alignItems="center">
              <Text>Signature</Text>
              <QRCode value={signature.toString()} />
            </Flex>
          )}

          {publicKey && (
            <Flex flexDirection="column" alignItems="center">
              <Text>Public Key</Text>
              <QRCode value={new TextDecoder().decode(publicKey)} />
              </Flex>
          )}
        </SimpleGrid>
      </SimpleGrid>
    </div>
  );


};

