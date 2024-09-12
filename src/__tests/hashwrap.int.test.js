const hashwrap = require('../index')

describe('hashwrap', () => {
  it('Returns an SPV envelope for a transaction', async () => {
    const envelope = await hashwrap(
      'e4a8c01d1936e70c31bdd72e6f88bf281b4b440463b5c11765ca06774b00f44c'
    )
    console.log(envelope)
  })
  it('Returns an SPV BEEF for a transaction', async () => {
    const envelope = await hashwrap(
      'e4a8c01d1936e70c31bdd72e6f88bf281b4b440463b5c11765ca06774b00f44c',
      {
        format: 'beefHex'
      }
    )
    console.log(envelope)
  })
})
