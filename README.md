# Troye

![Paper onchecked 8](https://user-images.githubusercontent.com/1128312/227785075-778638bd-1f87-4f41-bdd2-6e1e12a8d6a1.png)

### Introduction
Troye is a loyalty program that verifies users in front of a store by signing a QR code displayed at the store. By using a Web Crypto Key for the store and user's Passkey, we can create a cryptographic link between these two. Once that link is created, we attest this interaction on the Optimism network via its AttestationStation.

### Architecture
The store mode creates a P256 Web Cryptography Key, stored in the browser's IndexDB store to avoid leaking and exporting. Then, the key signs every block latest hash every time a block is minted, which we see by inspecting every block change from our RPC Provider (Alchemy). The signed payload is rendered via a QR code, which can then be displayed at the store.

The earn mode uses a phone's Passkey, which is stored in the phone secure enclave. Once the user scans the signed QR code, it creates a yet another signature via webauthn. To interaction can be verified cryptographically, and once completed, can be sent to the store "server", to submit it to the Optimism network's Attestation Station. Anyone then can see that a Store + User interacted at a specific point in time, and can provide rewards to this interaction accordingly.

