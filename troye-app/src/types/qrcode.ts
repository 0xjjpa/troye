export interface QRPayload {
  blockchainNumber: number | undefined;
  signatureAsHex: string;
  publicKeyAsHex: string;
}