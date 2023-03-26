import { ChakraProvider, localStorageManager } from '@chakra-ui/react'
import type { AppProps } from 'next/app'
import theme from '../theme'


import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import {
  optimism,
  optimismGoerli,
} from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

const { chains, provider } = configureChains(
  [
    optimismGoerli,  
  ],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID || "" }),
    publicProvider()
  ]
);
const { connectors } = getDefaultWallets({
  appName: 'Troye',
  chains
});
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
          <Component {...pageProps} />
        </ChakraProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
