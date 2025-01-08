import { default as JsConfuser } from 'js-confuser';
import { readFileSync, writeFileSync } from 'fs';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
var BASE_KEY = 128; // use 256*256 base if you want to keep unicode
var SHIFT_KEY = getRandomInt(1, BASE_KEY);
var XOR_KEY = getRandomInt(1, BASE_KEY);
console.log("Using XOR_KEY: " + XOR_KEY + " with SHIFT_KEY: " + SHIFT_KEY + " with BASE_KEY:" + BASE_KEY);

// Read input code
var sourceCode = readFileSync('output/_worker.js', 'utf8');
// Use the new advanced configuration
var options = {
  // REQUIRED
  target: 'node',

  // ANTISIG, always ON
  stringConcealing: (str) => {
    if (str === 'websocket') return false;
    if (str === 'Upgrade') return false;
    if (str === '/tr') return false;
    return true;
  },
  renameVariables: true,
  renameGlobals: true,
  renameLabels: true,
  stringSplitting: false, // no need for our job
  identifierGenerator: "mangled", // Takes the less space

  customStringEncodings: [ // Custom encode/decode optimized for speed and protect against automatic deobfuscation
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
            if (code > 127) return ''; // Remove unicode
            code = code ^ XOR_KEY;            
            code = (code + SHIFT_KEY) % BASE_KEY;
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
  calculator: false, // no need for our job
  deadCode: false, // no need for our job

  // OPTIONAL
  dispatcher: false,
  duplicateLiteralsRemoval: false,
  flatten: false,
  preserveFunctionLength: false, // if you have problems with code working try to enable this

  // SLOW, cant afford on free CF plan with 10 ms CPU
  globalConcealing: false,
  opaquePredicates: false,
  shuffle: false,
  variableMasking: false,
  stringCompression: false,

  // BUGS out CF (doesnt support eval or triggers CF antivirus)
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
