import ethers, { Wallet } from "ethers"
import { default as wagmiCore } from '@wagmi/core'
import { default as wagmiAlchemy } from '@wagmi/core/providers/alchemy'
import { default as wagmiChains } from '@wagmi/core/chains'
import { default as wagmiCoreMock } from '@wagmi/core/connectors/mock'
import { readAttestation, prepareWriteAttestation, getEvents, writeAttestation }from '@eth-optimism/atst'

export async function submitAttestation(wallet: Wallet, provider: ethers.providers.JsonRpcProvider) {

  const { chains, webSocketProvider } = wagmiCore.configureChains(
    [wagmiChains.optimismGoerli],
    [wagmiAlchemy.alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY })],
  )

  const setup = () => {
    wagmiCore.createClient({
      provider,
      webSocketProvider
    })
  }

  const writeSetup = async (signer: Wallet) => {
    await wagmiCore.connect({
      connector: new wagmiCoreMock.MockConnector({
        options: {
          chainId: chains[0].id,
          signer
        },
      }),
    })
  }

  setup()
  await writeSetup(wallet)

  const readCreatorAddr = "0xc2dfa7205088179a8644b9fdcecd6d9bed854cfe"
  const aboutAddr = "0x00000000000000000000000000000000000060A7"
  const key = "animalfarm.school.GPA"

  // Read an attestation
  const val = await readAttestation(
    readCreatorAddr,
    aboutAddr,
    key,
    "string")    // data type

  console.log(`According to ${readCreatorAddr} the ${key} for ${aboutAddr} is ${val}`)
  console.log(`--------------`)

  const preparedTx = await prepareWriteAttestation(
    "0x00000000000000000000000000000000000060A7",  // about
    "animalfarm.school.GPA",                       // key
    "3.25",                                        // value
  )

  // const txReq = preparedTx.request
  const tx = await writeAttestation(preparedTx)
  const rcpt = await tx.wait()
  console.log(`Attestation written:`)
  console.log(`https://goerli-explorer.optimism.io/tx/${rcpt.transactionHash}`)

  console.log(`---------------`)

  const events = await getEvents({
    creator: null,    // any creator
    about: aboutAddr, // Only 0x0...060A7
    key: null,        // any key
    value: null,      // any value
    provider
  })

  console.log("Attestations about Goat:")

  const lastEvents = events.slice(-5)
  lastEvents.map(event => {
    console.log(`at block ${event.blockNumber}, ${event.args.creator} attested:`)
    console.log(`    ${Buffer.from(event.args.key.slice(2), 'hex')} -> ${Buffer.from(event.args.val.slice(2), 'hex')}`)
  })
}
