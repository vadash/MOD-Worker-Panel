import { default as JsConfuser } from 'js-confuser';
import { readFileSync, writeFileSync } from 'fs';

// Helper function to generate a random integer
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Define encryption keys
var BASE_KEY = 128; // Use 256*256 base if you want to keep Unicode
var SHIFT_KEY = getRandomInt(1, BASE_KEY);
var XOR_KEY = getRandomInt(1, BASE_KEY);
console.log("Using XOR_KEY: " + XOR_KEY + " with SHIFT_KEY: " + SHIFT_KEY + " with BASE_KEY: " + BASE_KEY);

// Load sensitive words from file
const sensitiveWords = readFileSync('sensitive_words_auto.txt', 'utf-8')
  .split('\n')
  .map(word => word.trim())
  .filter(word => word.length > 0); // Remove empty lines

// Read input code
var sourceCode = readFileSync('output/_worker.js', 'utf8');

// Define obfuscation options
var options = {
  // REQUIRED
  target: 'node',

  // ANTISIG, always ON
  stringConcealing: (str) => {
    return sensitiveWords.some(word => str.toLowerCase().includes(word));
  },
  renameVariables: true,
  renameGlobals: true,
  renameLabels: true,
  identifierGenerator: "mangled", // Takes the least space

  // Custom string encoding for obfuscation
  customStringEncodings: [
    {
      code: `
        function {fnName}(str) {
          return str.split('')
            .map(char => {
              var code = char.charCodeAt(0);
              code = (code - ${SHIFT_KEY} + ${BASE_KEY}) % ${BASE_KEY};
              code = code ^ ${XOR_KEY};
              return String.fromCharCode(code);
            })
            .join('');
        }`,
      encode: (str) => {
        return str
          .split('')
          .map((char) => {
            var code = char.charCodeAt(0);
            code = code ^ XOR_KEY;
            code = (code + SHIFT_KEY) % BASE_KEY;
            return String.fromCharCode(code);
          })
          .join('');
      },
    },
  ],

  // FAST optimizations
  movedDeclarations: true,
  objectExtraction: true,
  compact: true,
  hexadecimalNumbers: true,
  astScrambler: true,
  calculator: false, // No need for our job
  deadCode: false, // No need for our job

  // OPTIONAL (disabled for performance or compatibility reasons)
  dispatcher: false,
  duplicateLiteralsRemoval: false,
  flatten: false,
  preserveFunctionLength: false, // Enable if code breaks
  stringSplitting: false, // No need for our job

  // SLOW (disabled due to performance constraints on Cloudflare's free plan)
  globalConcealing: false,
  opaquePredicates: false,
  shuffle: false,
  variableMasking: false,
  stringCompression: false,

  // BUGGY (causes issues with Cloudflare or triggers antivirus)
  controlFlowFlattening: false, // Bugs out
  minify: false, // Conflicts with CSS
  rgf: false, // Bugs out

  // OTHER (security locks, disabled for performance)
  lock: {
    antiDebug: false,  // Slow
    integrity: false,  // Slow
    selfDefending: false,  // Slow
    tamperProtection: false,  // Bugs out
  },
};

// Obfuscate the code
JsConfuser.obfuscate(sourceCode, options)
  .then((result) => {
    writeFileSync('output/_worker.js', result.code);
    console.log('Obfuscation completed successfully!');
  })
  .catch((err) => {
    console.error('Obfuscation failed:', err);
  });
