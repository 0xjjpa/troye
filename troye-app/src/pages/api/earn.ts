// pages/api/earn.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure request method is POST
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    const verification = req.body;

    // Log payload within the server
    console.log('Received payload:', verification);

    // Return a JSON response with an "ok" message
    res.status(200).json({ message: 'ok' });
  } catch (error) {
    console.error('Error processing payload:', error);
    res.status(500).json({ message: 'Error processing payload' });
  }
}
