const { CwiExternalServices, getEnvelopeForTransaction } = require('cwi-external-services')
const bsv = require('babbage-bsv')
const axios = require('axios')
const { toBEEFfromEnvelope } = require('@babbage/sdk-ts')
const { asString } = require('cwi-base')

/**
 * Returns an SPV envelope given the TXID of the target transaction.
 *
 * The returned object for mined transactions looks like:
 * ```
 * rawTx
 * proof: {
 *   txOrId: transaction hash
 *   target: merkle root
 *   targetType: 'merkleRoot'
 *   nodes: array of merkle tree hashes
 *   index: integer binary encoding of left (1) or right (0) path through the merkle tree
 * }
 * ```
 *
 * The returned object for pending transactions looks like:
 * ```
 * rawTx
 * mapiResponses: array of single mapi response for this transaction id
 * inputs: an object where keys are transaction ids that contributed inputs to this transaction and value is recursive hashwrap of those txids.
 * ```
 *
 * Uses api.whatsonchain.com to lookup raw transaction and merkle proofs.
 *
 * For pending transactions (without merkle proofs):
 * Use the taalApiKey property on the options parameter object to use TAAL's mAPI.
 * Otherwise mapi.gorillapool.io is used.
 *
 * @param {String} txid The confirmed or unconformed TXID for which you would like to generate an SPV envelope.
 * @param {Object} options Optional. Provide a TAAL api key with { taalApiKey: 'mainnet_9596de07e92300c6287e43...' }.
 * Provide { network: 'testnet' or 'mainnet' }. If testnet, a testnet TAAL key is required
 * Provide { format: 'beefHex' }. For result in BEEF format instead of Envelope format (the default)
 *
 * @returns {Object} The SPV envelope associated with the TXID you provided.
 */
const hashwrap = async (txid, options = {}) => {
  if (!txid) {
    throw new Error('TXID is missing')
  }
  if (txid.length !== 64 || !/[0-9a-f]{64}/g.test(txid)) {
    throw new Error('Invalid TXID')
  }
  const chain = options.network === 'testnet' ? 'test' : 'main'

  const opts = CwiExternalServices.createDefaultOptions()
  const services = new CwiExternalServices(opts)
  let envelope = await getEnvelopeForTransaction(services, chain, txid)
  
  if (envelope) {
    if (options.format === 'beefHex') {
      const r = toBEEFfromEnvelope(envelope)
      envelope = asString(r.beef)
    }
    return envelope
  }
}

module.exports = hashwrap
