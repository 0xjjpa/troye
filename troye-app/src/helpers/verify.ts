interface SignAndVerifyResult {
  verified: boolean;
  newSignature: ArrayBuffer;
  p256PublicKey: CryptoKey;
}

export type Verification = {
  isValid: boolean,
  signature: Uint8Array,
  authenticatorData: Uint8Array,
  data: Uint8Array
  clientDataJSON: ArrayBuffer
}

export const verifyPublicKeyAndSignature = async (publicKey: ArrayBuffer, publicKeyWithAttestation: PublicKeyCredential): Promise<Verification | undefined> => {
  // verify signature on server
  const response = publicKeyWithAttestation.response as AuthenticatorAssertionResponse;
  const signature = response.signature;
  console.log("SIGNATURE", signature)

  var clientDataJSON = publicKeyWithAttestation.response.clientDataJSON;
  console.log("** clientDataJSON", clientDataJSON, new TextDecoder().decode(clientDataJSON))

  var authenticatorData = new Uint8Array(response.authenticatorData);
  console.log("authenticatorData", authenticatorData)

  var clientDataHash = new Uint8Array(await crypto.subtle.digest("SHA-256", clientDataJSON));
  console.log("clientDataHash", clientDataHash)

  // concat authenticatorData and clientDataHash
  var signedData = new Uint8Array(authenticatorData.length + clientDataHash.length);
  signedData.set(authenticatorData);
  signedData.set(clientDataHash, authenticatorData.length);
  console.log("signedData", signedData);

  // import key
  var key = await importWebAuthnPublicKey(publicKey);

  if (!key) {
    console.error("Could not import public key");
    return;
  }

  // Convert signature from ASN.1 sequence to "raw" format
  var usignature = new Uint8Array(signature);
  var rStart = usignature[4] === 0 ? 5 : 4;
  var rEnd = rStart + 32;
  var sStart = usignature[rEnd + 2] === 0 ? rEnd + 3 : rEnd + 2;
  var r = usignature.slice(rStart, rEnd);
  var s = usignature.slice(sStart);
  var rawSignature = new Uint8Array([...r, ...s]);
  console.log("Parsing key...", key, rawSignature, signedData.buffer);

  // check signature with public key and signed data 
  var verified = await crypto.subtle.verify(
    <EcdsaParams>{ name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } },
    key,
    rawSignature,
    signedData.buffer
  );
  // verified is now true!
  console.log('verified', verified)

  return { isValid: verified, signature: rawSignature, data: signedData, authenticatorData, clientDataJSON };
}

export async function signAndVerify(
  signedData: Uint8Array,
  signature: ArrayBuffer,
  webAuthnPublicKey: CryptoKey
): Promise<SignAndVerifyResult> {
  // Verify the signature using the provided WebAuthn public key
  const verified = await crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    webAuthnPublicKey,
    signature,
    signedData.buffer
  );

  // Generate a new P-256 key pair
  const p256KeyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  // Sign the provided signature with the new P-256 private key
  const newSignature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    p256KeyPair.privateKey,
    signature
  );

  return {
    verified,
    newSignature,
    p256PublicKey: p256KeyPair.publicKey,
  };
}

export const importWebAuthnPublicKey = async (publicKey: ArrayBuffer): Promise<CryptoKey | null> => {
  try {
    // import key
    const key = await crypto.subtle.importKey(
      // The getPublicKey() operation thus returns the credential public key as a SubjectPublicKeyInfo. See:
      // 
      // https://w3c.github.io/webauthn/#sctn-public-key-easy
      //
      // crypto.subtle can import the spki format:
      // 
      // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
      "spki", // "spki" Simple Public Key Infrastructure rfc2692

      publicKey,
      {
        // these are the algorithm options
        // await cred.response.getPublicKeyAlgorithm() // returns -7
        // -7 is ES256 with P-256 // search -7 in https://w3c.github.io/webauthn
        // the W3C webcrypto docs:
        //
        // https://www.w3.org/TR/WebCryptoAPI/#informative-references (scroll down a bit)
        //
        // ES256 corrisponds with the following AlgorithmIdentifier:
        name: "ECDSA",
        namedCurve: "P-256",
        hash: { name: "SHA-256" }
      },
      false, //whether the key is extractable (i.e. can be used in exportKey)
      ["verify"] //"verify" for public key import, "sign" for private key imports
    );
    return key;
  } catch (e) {
    console.log('(🔑, ❌) Unable to load key, the provided ArrayBuffer isn’t a valid key.');
    return null;
  }
}