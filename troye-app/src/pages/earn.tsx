import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Tagline } from "@/components/Tagline";
import { TroyeId } from "@/components/TroyeId";
import { QRPayload } from "@/types/qrcode";
import { Flex, Button, Text } from "@chakra-ui/react";
import Head from 'next/head'
import { useEffect, useState } from "react";
const { getHash } = require("emoji-hash-gen");

const Earn = () => {
  const [isCameraDisplayed, setIsCameraDisplayed] = useState(false); 
  const [qrcodeValue, setQRCodeValue] = useState<string | null>(null);
  const [qrcodePayload, setQRCodePayload] = useState<QRPayload | null>(null);
  const [publicKeyAsHexAndHashed, setPublicKeyAsHexAndHashed] = useState<string | null>(null);

  useEffect(() => {
    if (qrcodeValue) {
      const payload = JSON.parse(qrcodeValue) as QRPayload;
      console.log("Payload", payload);
      setQRCodePayload(payload);
    }
  }, [qrcodeValue]);

  useEffect(() => {
    if (qrcodePayload) {
      setPublicKeyAsHexAndHashed(getHash(qrcodePayload.publicKeyAsHex || 'empty'));
    }
  }, [qrcodePayload]);

  return (
    <>
      <Head>
        <title>Troye - Earn</title>
        <meta name="description" content="Troye is a platform to create loyalty programs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ position: 'relative' }}>
        <Tagline label="Troye - Earn mode" />
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
          <Button onClick={() => setIsCameraDisplayed(!isCameraDisplayed)}>{!isCameraDisplayed ? 'Display' : 'Hide'} Camera</Button>
          {isCameraDisplayed && <BarcodeScanner setBarcodeValue={setQRCodeValue} />}
          {qrcodePayload &&
            <Flex direction="column" height="50vh" justifyContent="space-around">
              <Flex direction="column">
                <Text fontSize="4xl">{publicKeyAsHexAndHashed}</Text>
                <Text color="gray.400" fontSize="sm">Public Identifier</Text>
              </Flex>
              <TroyeId
                publicKeyAsHex={qrcodePayload.publicKeyAsHex}
                username={publicKeyAsHexAndHashed}
                qrPayloadAsUint8Array={new TextEncoder().encode(JSON.stringify(qrcodePayload))}
              />
            </Flex>
          }
        </Flex>
      </main>
    </>
  );
}

export default Earn;