export type WebauthnChallenge = {
  type: string, //usually 'webauthn.get'
  challenge: string
  origin: string //usually the origin of the webauthn request
}

export const publicKeyCredentialCreationOptions: (username: string) => PublicKeyCredentialCreationOptions = (username: string) => ({
  challenge: crypto.getRandomValues(new Uint8Array(32)),
  rp: {
    name: "Your App",
  },
  user: {
    id: crypto.getRandomValues(new Uint8Array(16)),
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
  attestation: "direct",
});

export const credentialCreationOptions: (username: string) => CredentialCreationOptions = (username: string) => ({
  publicKey: publicKeyCredentialCreationOptions(username),
});