import { Box, Flex, Heading, IconButton, SimpleGrid, Text, useColorMode } from '@chakra-ui/react'
import { SunIcon, MoonIcon, SettingsIcon } from '@chakra-ui/icons'
import Head from 'next/head'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { TroyeClient } from '@/components/TroyeClient'
import { useState } from 'react'

export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode()
  const [developerMode, setDeveloperMode] = useState(false)
  const isDarkMode = colorMode === 'dark'

  return (
    <>
      <Head>
        <title>Troye</title>
        <meta name="description" content="DESCRIPTION" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
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
        >
          <Heading as="h1">Troye</Heading>
          <Text>Troye is a platform to create loyalty programs for physical
            and digital organizations by allowing any shop to set up
            points-of-earnings and points-of-redemption.
          </Text>
          <Flex>
            <IconButton
              w="fit-content"
              mx="auto"
              icon={isDarkMode ? <SunIcon /> : <MoonIcon />}
              onClick={toggleColorMode}
              aria-label="Toggle color mode"
            />
            <IconButton
              w="fit-content"
              outline={developerMode ? '2px solid #3182ce' : 'none'}
              mx="auto"
              icon={<SettingsIcon />}
              onClick={() => setDeveloperMode(!developerMode)}
              aria-label="Enable Developer Mode"
            />
          </Flex>
          {developerMode && (
            <>
              <Heading as="h2" fontSize="2xl">Developer mode</Heading>
              <SimpleGrid columns={[1, 1, 1, 1]}>
                <Box mb="5">
                  <Heading mb="2" as="h3" fontFamily="mono" fontSize="md">Web3 Wallet</Heading>
                  <Flex justify="center">
                    <ConnectButton />
                  </Flex>
                </Box>

                <Box>
                  <Heading mb="2" as="h3" fontFamily="mono" fontSize="md">Signature Workflow</Heading>
                  <Flex justify="center">
                    <TroyeClient />
                  </Flex>
                </Box>
              </SimpleGrid>
            </>
          )}


        </Flex>
      </main>
    </>
  )
}
