# hash-wrap

Get an SPV envelope for any transaction

The code is hosted [on GitHub](https://github.com/p2ppsr/hashwrap) and the package is available [through NPM](https://www.npmjs.com/package/hash-wrap).

## Installation

```sh
npm i hash-wrap
```

## Example Usage

```js
const hashwrap = require('hash-wrap')

// You just need the TXID
// Envelope is an object that contains an SPV envelope
const envelope = await hashwrap('your-txid-here')
```

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

*   [hashwrap](#hashwrap)
    *   [Parameters](#parameters)

### hashwrap

Returns an SPV envelope given the TXID of the target transaction.

The returned object for mined transactions looks like:
rawTx
proof: {
txOrId: transaction hash
target: merkle root
targetType: 'merkleRoot'
nodes: array of merkle tree hashes
index: integer binary encoding of left (1) or right (0) path through the merkle tree
}

The returned object for pending transactions looks like:
rawTx
mapiResponses: array of single mapi response for this transaction id
inputs: an object where keys are transaction ids that contributed inputs to this transaction and value is recursive hashwrap of those txids.

Uses api.whatsonchain.com to lookup raw transaction and merkle proofs.

For pending transactions (without merkle proofs):
Use the taalApiKey property on the options parameter object to use TAAL's mAPI.
Otherwise mapi.gorillapool.io is used.

#### Parameters

*   `txid` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The confirmed or unconformed TXID for which you would like to generate an SPV envelope.
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Optional. Provide a TAAL api key with { taalApiKey: 'mainnet\_9596de07e92300c6287e43...' } (optional, default `{}`)

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** The SPV envelope associated with the TXID you provided.

## License

The license for the code in this repository is the Open BSV License.
