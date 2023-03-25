import { Tagline } from '@/components/Tagline';
import { buf2hex } from '@/helpers/buffers';
import { exportPublicKeyAsHex } from '@/helpers/webcrypto';
import { ECDSAKeyPair } from '@/types/keypair';
import { QRPayload } from '@/types/qrcode';
import { Text, Flex } from '@chakra-ui/react';
import Head from 'next/head'
import QRCode from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { useProvider, useBlockNumber } from 'wagmi';
const { getHash } = require("emoji-hash-gen");


const Setup: React.FC = () => {
  const provider = useProvider();  
  const { data: blockNumber } = useBlockNumber({ watch: true })

  const [keyPair, setKeyPair] = useState<ECDSAKeyPair | null>(null);
  const [qrPayload, setQRPayload] = useState<QRPayload | null>(null);
  const [publicKeyAsHex, setPublicKeyAsHex] = useState<string | null>(null);

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
          const publicKeyAsHex = await exportPublicKeyAsHex(keyPair!);
          setPublicKeyAsHex(publicKeyAsHex);
          const qrPayload: QRPayload = {
            blockchainNumber: blockNumber,
            signatureAsHex: signedHashAsHex,
            publicKeyAsHex

          }
          setQRPayload(qrPayload);
        }
      }
    }
    keyPair?.privateKey && loadLatestBlockchainHash();
  }, [blockNumber]);

  async function fetchLatestBlockchainHash() {
    const block = await provider.getBlock('latest')
    return block.hash;
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
        <title>Troye - Setup</title>
        <meta name="description" content="Troye is a platform to create loyalty programs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ position: 'relative' }}>
        <Tagline label="Troye - Setup mode" />
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
            <Flex alignItems="center" mt="20" direction="column">
              <QRCode size={256} value={JSON.stringify(qrPayload) || 'empty'} />
              <Text mt="10" fontSize="4xl" letterSpacing="10px">{getHash(publicKeyAsHex || 'empty')}</Text>
            </Flex>
          ) : (
            <p>Loading key pair...</p>
          )}
        </Flex>
      </main>
    </>
  );
};

export default Setup;
