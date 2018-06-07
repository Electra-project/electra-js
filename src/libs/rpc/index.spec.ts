// tslint:disable

import * as Ajv from 'ajv'
import * as assert from 'assert'
import chalk from 'chalk'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as typescriptJsonSchema from 'typescript-json-schema'

import Rpc from '.'
import { BINARIES_PATH, DAEMON_CONFIG_DEFAULT, DAEMON_URI } from '../../constants'
import WalletHard from '../../wallet/hard'

describe('Rpc', function() {
  this.timeout(10_000)

  const ajv = new Ajv()
  const rpc = new Rpc(DAEMON_URI, {
    password: DAEMON_CONFIG_DEFAULT.rpcpassword,
    username: DAEMON_CONFIG_DEFAULT.rpcuser,
  })
  let RpcMethodSchema
  const wallet = new WalletHard(BINARIES_PATH, DAEMON_CONFIG_DEFAULT)

  // We skip the wallet tests in Travis CI for now
  // TODO Integrate an Electra core build in Travis CI
  before(async function() {
    console.log(chalk.green('    ♦ Parsing types...'))
    const program = typescriptJsonSchema.getProgramFromFiles([path.resolve(__dirname, 'types.ts')])
    RpcMethodSchema = typescriptJsonSchema.generateSchema(program, 'RpcMethods').properties

    console.log(chalk.green('    ♦ Starting Electra daemon...'))
    await wallet.startDaemon()
  })

  describe('#check()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.checkwallet, await rpc.check()), true)
    })
  })

  /*describe('#getAccount()', function() {
    it(`SHOULD return "${testAccount}" with my "${testAccount}" account address`, async function() {
      const account = await rpc.getAccount(testAddress)
      assert.strictEqual(account, testAccount)
    })
  })*/

  describe('#getBalance()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.getbalance, await rpc.getBalance()), true)
    })
  })

  describe('#getConnectionCount()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.getconnectioncount, await rpc.getConnectionCount()), true)
    })
  })

  describe('#getDifficulty()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.getdifficulty, await rpc.getDifficulty()), true)
    })
  })

  describe('#getInfo()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.getinfo, await rpc.getInfo()), true)
    })
  })

  describe('#getNewAddress()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.getnewaddress, await rpc.getNewAddress()), true)
    })

    const account = crypto.randomBytes(20).toString('hex')
    it(`SHOULD create an address labeled "${account}"`, async function() {
      await rpc.getNewAddress(account)
      const res = await rpc.listReceivedByAddress(1, true)
      assert.notStrictEqual(res.filter(address => address.account === account).length, 0)
    })
  })

  describe('#listAddressGroupings()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.listaddressgroupings, await rpc.listAddressGroupings()), true)
    })
  })

  describe('#listReceivedByAddress()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.listreceivedbyaddress, await rpc.listReceivedByAddress()), true)
    })
  })

  /*describe('#listTransactions()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.listtransactions, await rpc.listTransactions()), true)
    })

    it(`SHOULD all be related to "${testAccount}" account`, async function() {
      const transactions = await rpc.listTransactions(testAccount)
      assert.strictEqual(
        transactions.length,
        transactions.filter(transaction => transaction.account === testAccount).length
      )
    })
  })*/

  describe('#listUnspent()', function() {
    it(`SHOULD return the expected schema`, async function() {
      assert.strictEqual(ajv.validate(RpcMethodSchema.listunspent, await rpc.listUnspent()), true)
    })
  })

  describe('#makeKeyPair()', function() {
    it(`SHOULD return the expected strings and lengths`, async function() {
      const keyPair = await rpc.makeKeyPair()
      assert.strictEqual(typeof keyPair.PrivateKey, 'string')
      assert.strictEqual(typeof keyPair.PublicKey, 'string')
      assert.strictEqual(keyPair.PrivateKey.length, 558)
      assert.strictEqual(keyPair.PublicKey.length, 130)
    })
  })

  /*describe('#validateAddress()', function() {
    it(`SHOULD return the expected result with my "${testAccount}" account address`, async function() {
      const info = await rpc.validateAddress(testAddress)
      assert.strictEqual(info.isvalid, true)
      assert.strictEqual(info.address, testAddress)
      assert.strictEqual(info.ismine, true)
      assert.strictEqual(info.isscript, false)
      assert.strictEqual(typeof info.pubkey, 'string')
      assert.strictEqual(info.iscompressed, true)
      assert.strictEqual(info.account, testAccount)
    })

    const fakeAddress = 'ERgSYfQ3xySNcZDwsVeyWW3XpfLAhj3fzT'
    it(`SHOULD return isvalid as FALSE with '${fakeAddress}' address`, async function() {
      const info = await rpc.validateAddress(fakeAddress)
      assert.strictEqual(info.isvalid, false)
    })
  })*/

  describe('#validatePublicKey()', function() {
    it(`SHOULD return the expected result with a valid public key`, async function() {
      const publicKey = [
        '04dbc8fe17d5214b4ed9ec1250db65091c0f1e988b27de0984967812cf2eb6107',
        'b4d95d890956eeb1510bec969e0e8b64bbdb3dd2374ddf81fbb1855d742c6470c'
      ].join('')
      const info = await rpc.validatePublicKey(publicKey)
      assert.strictEqual(info.isvalid, true)
      assert.strictEqual(info.address, 'EHQXmjpWxbw7BvCX4CBp6XfSHxaAe6YAFw')
      assert.strictEqual(info.ismine, false)
      assert.strictEqual(info.iscompressed, false)
    })

    it(`SHOULD return isvalid as FALSE with a fake public key`, async function() {
      const info = await rpc.validatePublicKey('1234567890abcdef')
      assert.strictEqual(info.isvalid, false)
    })
  })

  after(async function() {
    console.log(chalk.green('    ♦ Closing Electra daemon...'))
    await wallet.stopDaemon()
  })
})
