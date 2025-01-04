import { default as JsConfuser } from 'js-confuser';
import { readFileSync, writeFileSync } from 'fs';
import { stringLiteral } from '@babel/types';

// identifierGenerator generation. 1 number out of all must be > 1
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const numbers = [];
for (let i = 0; i < 5; i++) {
  numbers.push(getRandomInt(0, 3));
}
if (!numbers.some(num => num > 0)) {
  const randomIndex = getRandomInt(0, 4);
  numbers[randomIndex] = getRandomInt(1, 3);
}
const [ig1, ig2, ig3, ig4, ig5] = numbers;

// XOR and SHIFT key generation. Better pick prime numbers for more random output
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
var BASE_KEY = getRandomInt(128, 256)
var PRIMES = sieveOfEratosthenes(1, BASE_KEY);
var getRandomPrime = () => PRIMES[Math.floor(Math.random() * PRIMES.length)];
var SHIFT_KEY = getRandomPrime();
var XOR_KEY = getRandomPrime();
console.log("Using XOR_KEY: " + XOR_KEY + " with SHIFT_KEY: " + SHIFT_KEY + " with BASE_KEY:" + BASE_KEY);

// Read input code
var sourceCode = readFileSync('output/_worker.js', 'utf8');
// Use the new advanced configuration
var options = {
  // REQUIRED
  target: 'node',

  // ANTISIG, always ON
  stringSplitting: true,
  stringConcealing: true,
  renameVariables: true,
  renameGlobals: true,
  renameLabels: true,
  identifierGenerator: {
    randomized: 0,
    hexadecimal: 0,
    zeroWidth: 0,
    number: 0,
    mangled: 1,
  },

  customStringEncodings: [
    {
      // Custom decoder function
      code: `
    function {fnName}(str) {
        return str.split('')
            .map(char => {
                var code = char.charCodeAt(0);
                code = code ^ ${XOR_KEY};
                code = (code - ${SHIFT_KEY} + ${BASE_KEY}) % ${BASE_KEY};
                return String.fromCharCode(code);
            })
            .join('');
    }`,
      // Custom encoder function (hardcoded)
      encode: (str) => {
        return str
          .split('')
          .map((char) => {
            var code = char.charCodeAt(0);
            if (code > 127) return '';
            code = (code + SHIFT_KEY) % BASE_KEY;
            code = code ^ XOR_KEY;
            return String.fromCharCode(code);
          })
          .join('');
      },
    },
  ],

  // FAST
  movedDeclarations: true,
  objectExtraction: true,
  compact: true,
  hexadecimalNumbers: true,
  astScrambler: true,
  calculator: false,
  deadCode: false,

  // OPTIONAL
  dispatcher: false,
  duplicateLiteralsRemoval: false,
  flatten: false,
  preserveFunctionLength: false,

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
