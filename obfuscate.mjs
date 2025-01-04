import { default as JsConfuser } from 'js-confuser';
import { readFileSync, writeFileSync } from 'fs';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
var BASE_KEY = 128;
var SHIFT_KEY = getRandomInt(1, 128);
var XOR_KEY = getRandomInt(1, 128);
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
