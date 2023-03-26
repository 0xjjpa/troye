// pages/api/earn.ts
import { hex2buf } from '@/helpers/buffers';
import { WebauthnChallenge } from '@/helpers/webauthn';
import { QRPayload } from '@/types/qrcode';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure request method is POST
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    const verification = req.body;

    const clientDataJSON: string = verification?.clientDataJSON;
    const obtainedClientDataJSON: WebauthnChallenge = JSON.parse(new TextDecoder().decode(hex2buf(clientDataJSON)));
    const challengeAsJSON = Buffer.from(obtainedClientDataJSON.challenge, 'base64').toString()
    const signedPayloadByStore: QRPayload = JSON.parse(challengeAsJSON);

    // Log payload within the server
    console.log('Received payload:', signedPayloadByStore);

    // Return a JSON response with an "ok" message
    res.status(200).json({ message: 'ok' });
  } catch (error) {
    console.error('Error processing payload:', error);
    res.status(500).json({ message: 'Error processing payload' });
  }
}
