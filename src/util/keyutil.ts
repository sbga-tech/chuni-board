// function vimKeyToEvent(vimKey) {
//     // Base structure of the KeyboardEvent-like object
//     const eventTemplate = {
//       keyCode: 0,
//       code: '',
//       altKey: false,
//       ctrlKey: false,
//       metaKey: false,
//       shiftKey: false,
//       repeat: false
//     };

//     // Trim whitespace just in case
//     vimKey = vimKey.trim();

//     // Special-case map of known bracketed keys
//     const specialMap = {
//       '<CR>':  { keyCode: 13,  code: 'Enter' },
//       '<Enter>': { keyCode: 13, code: 'Enter' },  // sometimes also used
//     };

//     // If it’s exactly in our specialMap
//     if (specialMap[vimKey]) {
//       eventTemplate.keyCode = specialMap[vimKey].keyCode;
//       eventTemplate.code = specialMap[vimKey].code;
//       return eventTemplate;
//     }

//     // Function-key check: <F1>, <F2>, ...
//     // F1 = 112, F2 = 113, F3 = 114, etc.  =>  111 + n
//     const fnMatch = vimKey.match(/^<F(\d+)>$/i);
//     if (fnMatch) {
//       const n = parseInt(fnMatch[1], 10);
//       eventTemplate.keyCode = 111 + n;
//       // code (e.g. "F1", "F2", "F3")
//       eventTemplate.code = 'F' + n;
//       return eventTemplate;
//     }

//     // Parse bracketed modifiers, e.g. <C-a>, <S-x>, <A-a>, <M-a>
//     // possible patterns: <C-...>, <M-...>, <A-...>, <S-...>, etc.
//     const bracketModMatch = vimKey.match(/^<([CMSAHD]+)-(.)>$/i);
//     // For example, <C-a> => bracketModMatch[1] = "C", bracketModMatch[2] = "a"
//     if (bracketModMatch) {
//       const mods = bracketModMatch[1].toUpperCase();
//       let charPart = bracketModMatch[2];  // the character after the dash

//       // Set known modifiers:
//       if (mods.includes('C')) eventTemplate.ctrlKey = true;
//       if (mods.includes('S')) eventTemplate.shiftKey = true;
//       if (mods.includes('A') || mods.includes('M')) eventTemplate.altKey = true;
//       if (mods.includes('D') || mods.includes('CMD')) eventTemplate.metaKey = true;

//       // Hardcode "repeat" for <C-a> example only (as in your sample):
//       if (mods.includes('C') && charPart.toLowerCase() === 'a') {
//         eventTemplate.repeat = true;
//       }

//       // Now figure out the key code / code
//       // If it’s a letter
//       if (/[a-zA-Z]/.test(charPart)) {
//         // keyCode for uppercase letter
//         eventTemplate.keyCode = charPart.toUpperCase().charCodeAt(0);
//         eventTemplate.code = 'Key' + charPart.toUpperCase();
//       }
//       // else if it's a digit
//       else if (/\d/.test(charPart)) {
//         eventTemplate.keyCode = charPart.charCodeAt(0);
//         eventTemplate.code = 'Digit' + charPart;
//       }
//       // Could add more logic for punctuation, arrows, etc. as needed.

//       return eventTemplate;
//     }

//     // If it’s a single punctuation or single character like '!'
//     // We'll interpret common shift-based punctuation.
//     // e.g. '!' => SHIFT + '1' => keyCode = 49
//     // If it’s a single uppercase letter, or a single digit, etc., handle that.
//     if (vimKey.length === 1) {
//       const ch = vimKey;
//       // Check if ch is uppercase letter:
//       if (/[A-Z]/.test(ch)) {
//         // keyCode is the ASCII code
//         eventTemplate.keyCode = ch.charCodeAt(0);
//         // For uppercase letter, code could be "KeyX"
//         eventTemplate.code = 'Key' + ch;
//         // SHIFT might not necessarily be set – up to you if you want to interpret typed uppercase as shiftKey = true.
//       }
//       // Check if ch is lowercase letter:
//       else if (/[a-z]/.test(ch)) {
//         eventTemplate.keyCode = ch.toUpperCase().charCodeAt(0);
//         eventTemplate.code = 'Key' + ch.toUpperCase();
//         // By default, that means no shift
//       }
//       // Check if digit:
//       else if (/\d/.test(ch)) {
//         eventTemplate.keyCode = ch.charCodeAt(0);
//         eventTemplate.code = 'Digit' + ch;
//       }
//       // Otherwise, handle punctuation:
//       else {
//         // We'll do some minimal punctuation checks:
//         // '!' => shift+1 => keyCode=49
//         // '@' => shift+2 => keyCode=50
//         // '#' => shift+3 => keyCode=51
//         // etc.
//         // This is a simplified approach and only covers a few typical US keyboard SHIFT combos:
//         const shiftMap = {
//           '!': { base: '1', baseKeyCode: 49 },
//           '@': { base: '2', baseKeyCode: 50 },
//           '#': { base: '3', baseKeyCode: 51 },
//           '$': { base: '4', baseKeyCode: 52 },
//           '%': { base: '5', baseKeyCode: 53 },
//           '^': { base: '6', baseKeyCode: 54 },
//           '&': { base: '7', baseKeyCode: 55 },
//           '*': { base: '8', baseKeyCode: 56 },
//           '(': { base: '9', baseKeyCode: 57 },
//           ')': { base: '0', baseKeyCode: 48 },
//         };

//         if (shiftMap[ch]) {
//           eventTemplate.keyCode = shiftMap[ch].baseKeyCode;
//           eventTemplate.shiftKey = true;
//           // The code property in JS is typically 'Digit1', 'Digit2', etc., but
//           // we can put 'Digit' + base for clarity:
//           eventTemplate.code = 'Digit' + shiftMap[ch].base;
//         } else {
//           // Fallback for any other symbol:
//           eventTemplate.keyCode = ch.charCodeAt(0);
//           // code for punctuation is not strictly standardized across browsers,
//           // you can do best-effort or skip it:
//           eventTemplate.code = 'Unidentified';
//         }
//       }
//       return eventTemplate;
//     }

//     // If we got here, we didn't handle the input
//     // Return something indicating it's unrecognized
//     return {
//       keyCode: 0,
//       code: '',
//       altKey: false,
//       ctrlKey: false,
//       metaKey: false,
//       shiftKey: false,
//       repeat: false,
//       unrecognized: true
//     };
//   }
