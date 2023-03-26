// pages/api/earn.ts
import { hex2buf } from '@/helpers/buffers';
import { WebauthnChallenge } from '@/helpers/webauthn';
import { submitAttestation } from '@/lib/atst';
import { QRPayload } from '@/types/qrcode';
import { providers, Wallet } from 'ethers';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure request method is POST
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    const provider = new providers.JsonRpcProvider(String(process.env.ETH_PROVIDER));
    const block = await provider.getBlock('latest')
    const verification = req.body;

    const clientDataJSON: string = verification?.clientDataJSON;
    const obtainedClientDataJSON: WebauthnChallenge = JSON.parse(new TextDecoder().decode(hex2buf(clientDataJSON)));
    const challengeAsJSON = Buffer.from(obtainedClientDataJSON.challenge, 'base64').toString()
    const signedPayloadByStore: QRPayload = JSON.parse(challengeAsJSON);

    const timelapsedInBlocks = block.number - signedPayloadByStore.blockchainNumber;

    // We know the payload is valid, but we need to check if it's not too old
    if(timelapsedInBlocks < 100) {
        const privateKey = String("0x" + process.env.PRIVATE_KEY);
        const wallet = new Wallet(privateKey, provider);
        await submitAttestation(wallet, provider);
    } else {
        console.error('Payload is too old:', signedPayloadByStore.blockchainNumber, block.number);
        res.status(500).json({ message: 'Payload is too old' });
        return;
    }

    // Log payload within the server
    console.log('Received payload:', signedPayloadByStore.blockchainNumber, block.number);

    // Return a JSON response with an "ok" message
    res.status(200).json({ message: 'ok' });
  } catch (error) {
    console.error('Error processing payload:', error);
    res.status(500).json({ message: 'Error processing payload' });
  }
}
