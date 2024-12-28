import { default as JsConfuser } from 'js-confuser';
import { readFileSync, writeFileSync } from 'fs';
import { stringLiteral } from '@babel/types';

function sieveOfEratosthenes(min, max) {
  var primes = [];
  var sieve = new Array(max + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (var p = 2; p * p <= max; p++) {
    if (sieve[p]) {
      for (var i = p * p; i <= max; i += p) {
        sieve[i] = false;
      }
    }
  }
  for (var p = min; p <= max; p++) {
    if (sieve[p]) {
      primes.push(p);
    }
  }
  return primes;
}
var PRIMES = sieveOfEratosthenes(1000, 255 * 255);
var getRandomPrime = () => PRIMES[Math.floor(Math.random() * PRIMES.length)];
var SHIFT_VALUE = 1 + Math.floor(Math.random() * 15);
var XOR_KEY = getRandomPrime();
console.log("Using XOR_KEY: " + XOR_KEY + " with SHIFT_VALUE: " + SHIFT_VALUE);

// Read input code
var sourceCode = readFileSync('output/_worker.js', 'utf8');
// Use the new advanced configuration
var options = {
  // REQUIRED
  target: 'node',

  // ANTISIG
  stringSplitting: true,
  stringConcealing: true,
  renameVariables: true,
  renameGlobals: true,
  renameLabels: true,
  identifierGenerator: {
    randomized: Math.floor(Math.random() * 3),
    hexadecimal: Math.floor(Math.random() * 3),
    zeroWidth: Math.floor(Math.random() * 3),
    number: Math.floor(Math.random() * 3),
    mangled: 0,
  },

  customStringEncodings: [
    {
      // Bitwise rotate + XOR decoder function
      code: `
    function {fnName}(str) {
        return str.split('')
            .map(char => {
                var code = char.charCodeAt(0);
                // First undo XOR
                code = code ^ ${XOR_KEY};
                // Then undo rotate right by SHIFT_VALUE
                return String.fromCharCode(((code >>> ${SHIFT_VALUE}) | (code << (16 - ${SHIFT_VALUE}))) & 0xFFFF
                );
            })
            .join('');
    }`,
      // Bitwise rotate + XOR encoder function
      encode: (str) => {
        return str
          .split('')
          .map((char) => {
            var code = char.charCodeAt(0);
            // First apply rotate left by SHIFT_VALUE
            code = ((code << SHIFT_VALUE) | (code >>> (16 - SHIFT_VALUE))) & 0xFFFF;
            // Then apply XOR
            return String.fromCharCode(code ^ XOR_KEY);
          })
          .join('');
      },
    },
  ],

  // FAST
  movedDeclarations: true,
  objectExtraction: true,
  calculator: true,
  compact: true,
  hexadecimalNumbers: true,
  deadCode: 0.05,
  astScrambler: true,

  // OPTIONAL
  dispatcher: true,
  duplicateLiteralsRemoval: true,
  flatten: true,
  preserveFunctionLength: true,

  // SLOW
  globalConcealing: false,
  opaquePredicates: false,
  shuffle: false,
  variableMasking: false,
  stringCompression: false,

  // BUGS out CF
  controlFlowFlattening: false, // BUGS OUT
  minify: false, // FUCKS CSS
  rgf: false, // BUGS OUT

  // OTHER
  lock: {
    antiDebug: false,  // SLOW
    integrity: false,  // SLOW
    selfDefending: false,  // SLOW
    tamperProtection: false,  // BUGS OUT
  },
};

// Obfuscate the code
JsConfuser.obfuscate(sourceCode, options)
  .then((result) => {
    writeFileSync('output/_worker.js', result.code);
    console.log('Obfuscation compvared successfully!');
  })
  .catch((err) => {
    console.error('Obfuscation failed:', err);
  });
