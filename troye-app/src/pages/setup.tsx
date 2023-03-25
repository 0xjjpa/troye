import { Text, Flex } from '@chakra-ui/react';
import Head from 'next/head'
import QRCode from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { useProvider, useBlockNumber } from 'wagmi';

interface ECDSAKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

interface QRPayload {
  blockchainNumber: string;
  signatureAsHex: string;
  publicKeyAsHex: string;
}

const KeyManager: React.FC = () => {
  const provider = useProvider();
  const { data: blockNumber } = useBlockNumber({ watch: true })

  const [keyPair, setKeyPair] = useState<ECDSAKeyPair | null>(null);
  const [qrPayload, setQRPayload] = useState<string | null>(null);

  function buf2hex(buffer: ArrayBuffer) {
    return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  useEffect(() => {
    const checkAndLoadKey = async () => {
      const keyPair = await getKeyFromIndexDB();
      if (!keyPair) {
        const newKeyPair = await generateAndStoreKey();
        setKeyPair(newKeyPair);
      } else {
        setKeyPair(keyPair);
      }
    };
    if (window?.crypto) {
      checkAndLoadKey();
    }
  }, []);

  useEffect(() => {
    console.log("Block number changed", blockNumber);
    const loadLatestBlockchainHash = async () => {
      if (provider) {
        const hash = await fetchLatestBlockchainHash();
        const signedHash = await signText(hash)
        if (signedHash) {
          const signedHashAsHex = buf2hex(signedHash);
          const qrPayload = {
            blockchainNumber: blockNumber,
            signatureAsHex: signedHashAsHex,
            publicKeyAsHex: exportPublicKeyAsHex(keyPair!)

          }
          setQRPayload(JSON.stringify(qrPayload));
        }
      }
    }
    keyPair?.privateKey && loadLatestBlockchainHash();
  }, [blockNumber]);

  async function fetchLatestBlockchainHash() {
    const block = await provider.getBlock('latest')
    return block.hash;
  }

  async function exportPublicKeyAsHex(keyPair: ECDSAKeyPair) {
    const exported = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    return buf2hex(exported);
  }

  const getKeyFromIndexDB = async (): Promise<ECDSAKeyPair | null> => {
    return new Promise(async (resolve) => {
      const openRequest = indexedDB.open('keyDatabase', 1);

      openRequest.onupgradeneeded = () => {
        const db = openRequest.result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'id' });
        }
      };

      openRequest.onsuccess = async () => {
        const db = openRequest.result;
        const transaction = db.transaction('keys', 'readonly');
        const keysStore = transaction.objectStore('keys');
        const request = keysStore.get('ECDSA_P256');

        request.onsuccess = async () => {
          const keyData = request.result;

          if (keyData) {
            const publicKey = await crypto.subtle.importKey(
              'jwk',
              keyData.publicKey,
              { name: 'ECDSA', namedCurve: 'P-256' },
              true,
              ['verify']
            );

            const privateKey = await crypto.subtle.importKey(
              'jwk',
              keyData.privateKey,
              { name: 'ECDSA', namedCurve: 'P-256' },
              true,
              ['sign']
            );

            resolve({ publicKey, privateKey });
          } else {
            resolve(null);
          }
        };
      };

      openRequest.onerror = () => {
        console.error('Error opening indexedDB:', openRequest.error);
        resolve(null);
      };
    });
  };

  const generateAndStoreKey = async (): Promise<ECDSAKeyPair> => {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    const dbData = {
      id: 'ECDSA_P256',
      publicKey: publicKeyJwk,
      privateKey: privateKeyJwk,
    };

    const openRequest = indexedDB.open('keyDatabase', 1);

    openRequest.onsuccess = () => {
      const db = openRequest.result;
      const transaction = db.transaction('keys', 'readwrite');
      const keysStore = transaction.objectStore('keys');
      const request = keysStore.put(dbData);

      request.onerror = () => {
        console.error('Error storing key data in indexedDB:', request.error);
      };
    };

    openRequest.onerror = () => {
      console.error('Error opening indexedDB:', openRequest.error);
    };

    return keyPair as ECDSAKeyPair;
  };

  const signText = async (text: string) => {
    if (!keyPair) {
      console.error('Key pair not found');
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      keyPair.privateKey,
      data
    );

    return signature;
  };

  return (
    <>
      <Head>
        <title>Troye - Earn</title>
        <meta name="description" content="Troye is a platform to create loyalty programs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ position: 'relative' }}>
        <Text as="h1" fontSize="sm" color="gray.600" pos={"absolute"} right="5" top="0">Troye - Setup mode</Text>
        <Flex
          maxW="50ch"
          direction="column"
          mx="auto"
          px="6"
          py="8"
          textAlign="center"
          gap={4}
          borderRadius="xl"
          mt={8}
          alignItems="center"
        >
          {keyPair ? (
            <Flex alignItems="center">
              <QRCode size={256} value={qrPayload || 'empty'} />
            </Flex>
          ) : (
            <p>Loading key pair...</p>
          )}
        </Flex>
      </main>
    </>
  );
};

export default KeyManager;
