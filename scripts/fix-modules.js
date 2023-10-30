const fs = require('fs');
const fixWindowError = () => {
  const file = './node_modules/bitcore-lib/lib/crypto/random.js';
  let fileData = fs.readFileSync(file).toString();
  fileData = fileData.replace(
    `Random.getRandomBufferBrowser = function(size) {
  if (!window.crypto && !window.msCrypto)
    throw new Error('window.crypto not available');

  if (window.crypto && window.crypto.getRandomValues)
    var crypto = window.crypto;
  else if (window.msCrypto && window.msCrypto.getRandomValues) //internet explorer
    var crypto = window.msCrypto;
  else
    throw new Error('window.crypto.getRandomValues not available');

  var bbuf = new Uint8Array(size);
  crypto.getRandomValues(bbuf);
  var buf = Buffer.from(bbuf);

  return buf;
};`,
    `Random.getRandomBufferBrowser = function(size) {
  var bbuf = new Uint8Array(size);
  crypto.getRandomValues(bbuf);
  var buf = Buffer.from(bbuf);

  return buf;
};`
  );
  fs.writeFileSync(file, fileData);
};

const fixWindowError2 = () => {
  const file = './node_modules/tiny-secp256k1/lib/rand.browser.js';
  let fileData = fs.readFileSync(file).toString();
  fileData = fileData.replace('window.crypto', 'crypto');
  fs.writeFileSync(file, fileData);
};

const fixWindowError3 = () => {
  const file = './node_modules/bitcoinjs-lib/src/payments/p2tr.js';
  let fileData = fs.readFileSync(file).toString();
  fileData = fileData.replace(
    'signature: types_1.typeforce.maybe(types_1.typeforce.BufferN(64))',
    'signature: types_1.typeforce.maybe(types_1.typeforce.Buffer)'
  );
  fs.writeFileSync(file, fileData);
};

const fixWindowError4 = () => {
  const file = './node_modules/rpc-websockets/dist/lib/client/websocket.browser.js';
  let fileData = fs.readFileSync(file).toString();
  fileData = fileData.replace(
    '_this.socket = new window.WebSocket(address, protocols);',
    '_this.socket = new self.WebSocket(address, protocols);'
  );
  fs.writeFileSync(file, fileData);
};

const fixSha256 = () => {
  const file = './node_modules/bip-schnorr/src/convert.js';
  let fileData = fs.readFileSync(file).toString();
  fileData = fileData.replace(
    `
    const BigInteger = require('bigi');
    const Buffer = require('safe-buffer').Buffer;
    const sha256 = require('js-sha256');

    function bufferToInt(buffer) {
      return BigInteger.fromBuffer(buffer);
    }

    function intToBuffer(bigInteger) {
      return bigInteger.toBuffer(32);
    }

    function hash(buffer) {
      return Buffer.from(sha256.create().update(buffer).array());
    }

    module.exports = {
      bufferToInt,
      intToBuffer,
      hash,
    };
    `,
    `
    const BigInteger = require('bigi');
    const Buffer = require('safe-buffer').Buffer;
    const binding = require('@noble/hashes/sha256');

    const { sha256 } = binding;

    
    function bufferToInt(buffer) {
      return BigInteger.fromBuffer(buffer);
    }

    function intToBuffer(bigInteger) {
      return bigInteger.toBuffer(32);
    }

    function hash(buffer) {
      return Buffer.from(sha256.create().update(buffer).digest(), 'hex');
    }

    module.exports = {
      bufferToInt,
      intToBuffer,
      hash,
    };
    `
  );
  fs.writeFileSync(file, fileData);
};

const fixBufferError = () => {
  const file = './node_modules/bitcore-lib/lib/crypto/signature.js';
  let fileData = fs.readFileSync(file).toString();
  fileData = fileData.replace(
    `var Signature = function Signature(r, s) {
  if (!(this instanceof Signature)) {
    return new Signature(r, s);
  }
  if (r instanceof BN) {
    this.set({
      r: r,
      s: s
    });
  } else if (r) {
    var obj = r;
    this.set(obj);
  }
};`,
    `var Signature = function Signature(r, s) {
  if (!(this instanceof Signature)) {
    return new Signature(r, s);
  }
  if (r instanceof BN) {
    this.set({
      r: r,
      s: s
    });
  } else if (r) {
    var obj = r;
    this.set(obj);
  }

  this.r = BN.fromString(this.r.toString(16), 16)
  this.s = BN.fromString(this.s.toString(16),16)
};`
  );
  fs.writeFileSync(file, fileData);
};

const run = async () => {
  let success = true;
  try {
    fixWindowError();
    fixWindowError2();
    fixWindowError3();
    fixWindowError4();
    fixBufferError();
  } catch (e) {
    console.error('error:', e.message);
    success = false;
  } finally {
    console.log('Fix modules result: ', success ? 'success' : 'failed');
  }
};

run();
