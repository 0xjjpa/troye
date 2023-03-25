import { Box, Button, Flex, Heading, IconButton, SimpleGrid, Text, useColorMode } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { SunIcon, MoonIcon, SettingsIcon, ViewIcon } from '@chakra-ui/icons'
import Head from 'next/head'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { TroyeClient } from '@/components/TroyeClient'
import { useState } from 'react'


export default function Home() {
  const router = useRouter()
  const { colorMode, toggleColorMode } = useColorMode()
  const [developerMode, setDeveloperMode] = useState(false)
  const [showAvailableOptions, setAvailableOptions] = useState(false)
  const isDarkMode = colorMode === 'dark'

  return (
    <>
      <Head>
        <title>Troye</title>
        <meta name="description" content="Troye is a platform to create loyalty programs" />
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
          <Text>Troye is a platform to create loyalty programs by setting up
            physical "checkpoints" any store or restaurant can use to reward
            their most recurring customers.
          </Text>
          <Flex mb="10">
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
              icon={<ViewIcon />}
              onClick={() => setAvailableOptions(!showAvailableOptions)}
              aria-label="Display Options"
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
          {showAvailableOptions && (
            <>
              <Heading as="h2" fontSize="2xl">Available Options</Heading>
              <SimpleGrid columns={[1, 1, 1, 1]}>
                <Box mb="5">
                  <Box p="2" mb="2">
                    <Heading mb="2" as="h3" fontFamily="mono" fontSize="md">Earn mode</Heading>
                    <Text>Used for stores to display their loyalty QR codes for customers to scan.</Text>
                  </Box>
                  <Flex justify="center">
                    <Button onClick={() => router.push('/earn')}>
                      Go to “Earn mode”
                    </Button>
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
