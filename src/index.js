const bsv = require('bsv')
const axios = require('axios')

/**
 * Returns an SPV envelope given the TXID of the target transaction.
 *
 * The returned object for mined transactions looks like:
 * rawTx
 * proof: {
 *   txOrId: transaction hash
 *   target: merkle root
 *   targetType: 'merkleRoot'
 *   nodes: array of merkle tree hashes
 *   index: integer binary encoding of left (1) or right (0) path through the merkle tree
 * }
 * 
 * The returned object for pending transactions looks like:
 * rawTx
 * mapiResponses: array of single mapi response for this transaction id
 * inputs: an object where keys are transaction ids that contributed inputs to this transaction and value is recursive hashwrap of those txids.
 * 
 * Uses api.whatsonchain.com to lookup raw transaction and merkle proofs.
 *
 * For pending transactions (without merkle proofs):
 * Use the taalApiKey property on the options parameter object to use TAAL's mAPI.
 * Otherwise mapi.gorillapool.io is used.
 *
 * @param {String} txid The confirmed or unconformed TXID for which you would like to generate an SPV envelope.
 * @param {Object} options Optional. Provide a TAAL api key with { taalApiKey: 'mainnet_9596de07e92300c6287e43...' }
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
  const { data: rawTx } = await axios.get(
    `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
  )
  if (!rawTx) {
    throw new Error(`Could not find transaction on WhatsOnChain: ${txid}`)
  }
  const { data: proof } = await axios.get(
    `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/proof`
  )
  if (proof) {
    return {
      rawTx,
      proof: {
        txOrId: proof[0].hash,
        target: proof[0].merkleRoot,
        targetType: 'merkleRoot',
        nodes: proof[0].branches.map(x => x.hash),
        index: parseInt(proof[0].branches.reduce(
          (a, e) => ('' + a + (e.pos === 'R' ? '0' : '1')), ''
        ), 2)
      }
    }
  } else {
    let provider = 'mapi.gorillapool.io'
    let headers = {}

    let apiKey = options.taalApiKey
    if (apiKey) {
        provider = 'mapi.taal.com'
        headers = { headers: { "Authorization": apiKey } }
    }

    const { data: mapiResponse } = await axios.get(
      `https://${provider}/mapi/tx/${txid}`, headers
    )
    const payloadHash = bsv.crypto.Hash.sha256(
      Buffer.from(mapiResponse.payload)
    )
    const signature = bsv.crypto.Signature.fromString(mapiResponse.signature)
    const publicKey = bsv.PublicKey.fromString(mapiResponse.publicKey)
    if (bsv.crypto.ECDSA.verify(payloadHash, signature, publicKey) !== true) {
      throw new Error(
        `Inalid mAPI signature for TXID: ${txid}, payload: ${mapiResponse.payload}, publicKey: ${mapiResponse.publicKey}, signature: ${mapiResponse.signature}`
      )
    }
    const payload = JSON.parse(mapiResponse.payload)
    if (payload.txid !== txid) {
      throw new Error(
        `Invalid mAPI response, expected a response for TXID ${txid} but got one for ${payload.txid} instead`
      )
    }
    if (payload.returnResult !== 'success') {
      throw new Error(`Invalid mAPI status response for TXID: ${txid}, returnResult: ${payload.returnResult}, resultDescription: ${payload.resultDescription}`)
    }
    const inputs = {}
    const tx = new bsv.Transaction(rawTx)
    for (const input of tx.inputs) {
      const txid = input.prevTxId.toString('hex')
      if (inputs[txid]) continue
      inputs[txid] = await hashwrap(txid)
    }
    return {
      rawTx,
      mapiResponses: [mapiResponse],
      inputs
    }
  }
}

module.exports = hashwrap
