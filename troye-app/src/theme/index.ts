import "@fontsource/playfair-display"
import "@fontsource/lato"

import { extendTheme } from '@chakra-ui/react'
import { config } from './foundations'
const overrides = {
  config,
  colors: {},
  components: {},
  fonts: {
    heading: `'Playfair Display', serif`,
    body: `'Lato', sans-serif`,
  },
  shadows: {},
  sizes: {},
  styles: {
    global: () => ({
      '*': {
        boxSizing: 'border-box',
        scrollBehavior: 'smooth',
        scrollMarginTop: '5rem',
        padding: 0,
        margin: 0,
      },
      body: {
        transition: 'background 200ms linear !important',
      },
    }),
  },
  textStyles: {},
  semanticTokens: {
    colors: {
      primary: { _light: 'gray.300', _dark: 'gray.600' },
    },
  },
}

export default extendTheme(overrides)
