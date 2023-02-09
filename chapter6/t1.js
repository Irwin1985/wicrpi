// const fs = require('fs');
// const path = require('path');

// constants that represent token categories
const EOF           = 0;    // end of file
const PRINT         = 1;    // 'print' keyword
const UNSIGNEDINT   = 2;    // integer
const NAME          = 3;    // identifier that is not a keyword
const ASSIGNOP      = 4;    // '=' assignment operator
const LEFTPAREN     = 5;    // '('
const RIGHTPAREN    = 6;    // ')'
const PLUS          = 7;    // '+'
const MINUS         = 8;    // '-'
const TIMES         = 9;    // '*'
const NEWLINE       = 10;   // new line character
const ERROR         = 11;   // if not any of the above, then is an error.

// displayable names for each token category
const catNames = [
    "EOF",
    "PRINT",
    "UNSIGNEDINT",
    "NAME",
    "ASSIGNOP",
    "LEFTPAREN",
    "RIGHTPAREN",
    "PLUS",
    "MINUS",
    "TIMES",
    "NEWLINE",
    "ERROR",
];

// keywords and their token categories
const keywords = {
    'print': PRINT,
};

// one-character tokens and their token categories
const smallTokens = {
    '=': ASSIGNOP,
    '(': LEFTPAREN,
    ')': RIGHTPAREN,
    '+': PLUS,
    '-': MINUS,
    '*': TIMES,
    "\n": NEWLINE,
    '': EOF,
};

// const DEBUG_MODE = true;

class Token {
    constructor(line, column, category, lexeme) {
        this.line = line;           // line number of the token
        this.column = column;       // column in which token starts
        this.category = category;   // category of the token
        this.lexeme = lexeme;       // token in string from
    }

    toString() {
        return `Token(${catNames[this.category]}, '${this.lexeme}')`;
    }
}

class Tokenizer {
    constructor(source) {
        // global variables
        this.trace = true;       // controls token trace
        this.source = source;    // receives entire source program
        this.sourceIndex = 0;    // index into source
        this.column = 0;
        this.line = 0;           // current column number
        this.prevChar = "\n";    // '\n' in prevchar signals start of new line
        this.blankLine = true;   // reset to false if line is not blank
        this.tokenList = [];     // list of tokens created by tokenizer
        this.curchar = ' ';      // prime curchar with space
    }

    // tokenizer
    tokenizer() {
        // for token trace
        if (this.trace) {
            console.log(`Line\tCol\tCategory\tLexeme\n`);
        }        
        while (true) {
            // skip whitespace but not newlines
            while (this.curchar !== '\n' && this.isSpace(this.curchar)) {
                this.curchar = this.getchar();
            }
            // construct and initialize a new token
            var token = new Token(this.line, this.column, null, '');

            if (/^\d+/.test(this.curchar)) {         // start of unsigned int?
                token.category = UNSIGNEDINT;   // save category of token
                while (true) {
                    token.lexeme += this.curchar;    // append curchar to lexeme
                    this.curchar = this.getchar();        // get next character
                    if (!/^\d+/.test(this.curchar)) {
                        break;                  // break if not a digit
                    }
                }
            }
            else if (/^\w+/.test(this.curchar)) {    // start of name?
                while (true) {
                    token.lexeme += this.curchar;    // append curchar to lexeme
                    this.curchar = this.getchar();        // get next character
                    // break if not letter, '_' or digit
                    if (!/[a-zA-Z0-9_]/.test(this.curchar)) {
                        break;
                    }
                }
                // determine if lexeme is a keyword or name of variable
                if (keywords.hasOwnProperty(token.lexeme)) {
                    token.category = keywords[token.lexeme];
                } else {
                    token.category = NAME;
                }
            }
            else if (smallTokens.hasOwnProperty(this.curchar)) {
                token.category = smallTokens[this.curchar];  // get category
                token.lexeme = this.curchar;                 
                this.curchar = this.getchar();                    // move to first character after token
            } else {
                token.category = ERROR;     // invalid token
                token.lexeme = this.curchar;     // save lexeme
                throw new SyntaxError(`\nError on '${token.lexeme}' line ${token.line} column ${token.column}\nmessage: invalid character ${this.curchar}`);
            }
            this.tokenList.push(token);  // append token to token list
            if (this.trace) {
                console.log(`${token.line}\t${token.column}\t${catNames[token.category]}\t"${token.lexeme}"`);
            }
            if (token.category === EOF) { // finished tokenizing?
                break;
            }
        }
    }

    // getchar(): gets next char from source and adjusts line and column
    getchar() {
        // check if starting a new line
        if (this.prevChar === '\n') {    // \n signals start of a new line
            this.line += 1;              // increment line number
            this.column = 0;             // reset column number
            this.blankLine = true;       // initialize blankline
        }

        if (this.sourceIndex >= this.source.length) { // at end of source code?
            this.column = 1      // set EOF column to 1
            this.prevChar = ''   // save current char for next call
            return '';           // null str signals end of source
        }

        var c = this.source[this.sourceIndex];    // get next char in the source program
        this.sourceIndex += 1;               // increment sourceindex to next character
        this.column += 1;                    // increment column number
        if (!this.isSpace(c)) {              // if c not whitespace then line not blank
            this.blankLine = false;          // indicate line not blank
        }
        this.prevChar = c;                   // save current char for next call

        // if at end of blank line, return space in place of '\n'
        if (c === '\n' && this.blankLine) {
            return " ";
        }
        return c;   // return character to tokenizer
    }

    isSpace(char) {
        return /[ \t\v\r\n\f]/.test(char);
    }
}

// // main(): reads input file and calls tokenizer()
// function main() {
//     if (DEBUG_MODE) {
//         fileName = `${path.basename(__dirname) + "\\test.in"}`;
//         console.log(fileName);
//         source = String(fs.readFileSync(fileName));
//     } else {
//         if (process.argv.length === 3) {    // check if correct number of cmd line args
//             try {                
//                 source = String(fs.readFileSync(process.argv[2]));
//             } catch(e) {
//                 console.error(`Cannot read input file "${process.argv[2]}"`);
//                 process.exit(1);
//             }        
//         } else {
//             console.log('Wrong number of command line arguments');
//             console.log(`format: node ${path.basename(__filename)} file.py <infile>`);
//             process.exit(1);
//         }
//     }

//     // add new line to end if missing
//     if (source.slice(-1) !== '\n') {
//         source += '\n';
//     }

//     const tokenizer = new Tokenizer(source);    

//     try {
//         tokenizer.tokenizer();
//     } catch(e) {
//         console.error(e.message);
//     }
// }

// // call main function
// if (DEBUG_MODE) {
//     main();
// }


module.exports = {
    // Tokenizer
    Tokenizer,
    // Token Types
    EOF,
    PRINT,
    UNSIGNEDINT,
    NAME,
    ASSIGNOP,
    LEFTPAREN,
    RIGHTPAREN,
    PLUS,
    MINUS,
    TIMES,
    NEWLINE,
    ERROR,   
};