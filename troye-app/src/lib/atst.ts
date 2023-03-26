import { getContractAttestationRegistry } from "@/helpers/atst";
import ethers, { Wallet } from "ethers"
import { formatBytes32String, keccak256, toUtf8Bytes } from "ethers/lib/utils.js";


export async function submitAttestation(wallet: Wallet, provider: ethers.providers.JsonRpcProvider, publicKeyAsHex: string, attestationValueAsString: string) {

  const optimismGoerliAttestationStationAddress = '0xEE36eaaD94d1Cc1d0eccaDb55C38bFfB6Be06C77'
  const attestationStation = await getContractAttestationRegistry(optimismGoerliAttestationStationAddress, provider);

  const encodeRawKey = rawKey => {
    if (rawKey.length < 32)
      return formatBytes32String(rawKey)

    const hash = keccak256(toUtf8Bytes(rawKey))
    return hash.slice(0, 64) + 'ff'
  }

  const aboutAddress = await wallet.getAddress()
  const attendedKey = encodeRawKey(publicKeyAsHex)
  const attestation = {
    about: aboutAddress,
    key: attendedKey,
    val: toUtf8Bytes(attestationValueAsString)
  }

  const tx = await attestationStation.connect(wallet).attest([attestation]);
  const rcpt = await tx.wait()
  return rcpt;
}
