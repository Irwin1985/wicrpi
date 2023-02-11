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

// new keywords
const NONE          = 12;   // 'None' keyword
const TRUE          = 13;   // 'True' keyword
const FALSE         = 14;   // 'False' keyword
const PASS          = 15;   // 'pass' keyword
const IF            = 16;   // 'if' keyword
const ELSE          = 17;   // 'else' keyword
const WHILE         = 18;   // 'while' keyword

// new types
const UNSIGNEDFLOAT = 19;   // number with a decimal point
const STRING        = 20;   // string delimited by single quotes

// relational operators category numbers
const EQUAL         = 21;   // '=='
const NOTEQUAL      = 22;   // '!='
const LESSTHAN      = 23;   // '<'
const LESSEQUAL     = 24;   // '<='
const GREATERTHAN   = 25;   // '>'
const GREATEREQUAL  = 26;   // '>='

// new arithmetic operators
const DIV           = 27;   // '/'

// new punctuation
const COMMA         = 28;   // ','
const COLON         = 29;   // ':'

// python indentation
const INDENT        = 30;
const DEDENT        = 31;

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
    "NONE",
    "TRUE",
    "FALSE",
    "PASS",
    "IF",
    "ELSE",
    "WHILE",
    "UNSIGNEDFLOAT",
    "STRING",
    "EQUAL",
    "NOTEQUAL",
    "LESSTHAN",
    "LESSEQUAL",
    "GREATERTHAN",
    "GREATEREQUAL",
    "DIV",
    "COMMA",
    "COLON",
    "INDENT",
    "DEDENT",
];

// keywords and their token categories
const keywords = {
    'print': PRINT,
    'None': NONE,
    'True': TRUE,
    'False': FALSE,
    'pass': PASS,
    'if': IF,
    'else': ELSE,
    'while': WHILE,
};

// one-character tokens and their token categories
const smallTokens = {
    '=': ASSIGNOP,    
    '==': EQUAL,
    '<': LESSTHAN,
    '<=': LESSEQUAL,
    '>': GREATERTHAN,
    '>=': GREATEREQUAL,
    '!': ERROR,
    '!=': NOTEQUAL,    
    '(': LEFTPAREN,
    ')': RIGHTPAREN,
    '+': PLUS,
    '-': MINUS,
    '*': TIMES,
    "\n": NEWLINE,
    '': EOF,
    ',': COMMA,
    ':': COLON,
    '/': DIV,
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
        this.inString = false;
        this.indentStack = [1];  // global indentation level is always 1
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
            const token = new Token(this.line, this.column, null, '');

            if (/^\d+/.test(this.curchar) || this.curchar === '.') {         // start of unsigned int?
                token.category = (this.curchar === '.') ? UNSIGNEDFLOAT : UNSIGNEDINT;
                while (true) {
                    token.lexeme += this.curchar;    // append curchar to lexeme
                    this.curchar = this.getchar();        // get next character
                    if (!/^\d+/.test(this.curchar)) {
                        if (this.curchar === '.') {
                            if (token.category === UNSIGNEDFLOAT) {
                                console.error(`Invalid number format.`);
                                process.exit(1);
                            }
                            token.category = UNSIGNEDFLOAT;
                        } else {
                            break;                  // break if not a digit
                        }
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
            else if (this.curchar === "'") {
                this.inString = true;
                this.curchar = this.getchar();
                token.category = STRING;
                while (this.curchar !== "'") {
                    if (this.curchar === '\\') {
                        this.curchar = this.getchar();
                        switch (this.curchar) {
                            case this.curchar === 't':
                                token.lexeme += '\t';
                                break;
                            case this.curchar === 'r':
                                token.lexeme += '\r';                                
                                break;
                            case this.curchar === 'n':
                                token.lexeme += '\n';
                                break;
                            case this.curchar === 'v':
                                token.lexeme += '\v';                        
                                break;
                            case this.curchar === '\\':
                                token.lexeme += '\\';
                                break;
                            case this.curchar === "'":
                                token.lexeme += "'";
                                break;
                            default:
                                this.lexeme += this.curchar;
                                break;                                
                        }                        
                    } else {
                        token.lexeme += this.curchar;
                    }
                    this.curchar = this.getchar();
                }
                this.curchar = this.getchar();
                this.inString = false;                
            }
            else if (smallTokens.hasOwnProperty(this.curchar)) {
                const save = this.curchar;
                this.curchar = this.getchar();
                const twochar = save + this.curchar;
                if (smallTokens.hasOwnProperty(twochar)) {
                    token.category = smallTokens[twochar];
                    token.lexeme = twochar;
                    this.curchar = this.getchar();                    // move to first character after token
                } else {
                    token.category = smallTokens[save];  // get category
                    token.lexeme = save;                 
                }
            } else {
                token.category = ERROR;     // invalid token
                token.lexeme = this.curchar;     // save lexeme
                throw new SyntaxError(`\nError on '${token.lexeme}' line ${token.line} column ${token.column}\nmessage: invalid character ${this.curchar}`);
            }

            // check for change in indentation when starting a new line
            if (this.tokenList.length === 0 || this.tokenList[this.tokenList.length-1].category === NEWLINE) {
                if (this.indentStack[this.indentStack.length-1] < token.column) { // identation
                    this.indentStack.push(token.column);
                    const indentToken = new Token(token.line, token.column, INDENT, '{');
                    this.tokenList.push(indentToken);
                    if (this.trace) {
                        console.log(`${indentToken.line}\t${indentToken.column}\t${catNames[indentToken.category]}\t"${indentToken.lexeme}"`);
                    }                    
                }
                else if (this.indentStack[this.indentStack.length-1] > token.column) { // dedentation
                    while (true) {
                        const dedentToken = new Token(token.line, token.column, DEDENT, '}');
                        this.tokenList.push(dedentToken);
                        if (this.trace) {
                            console.log(`${dedentToken.line}\t${dedentToken.column}\t${catNames[dedentToken.category]}\t"${dedentToken.lexeme}"`);
                        }                        
                        this.indentStack.pop();
                        if (this.indentStack[this.indentStack.length-1] == token.column) {
                            break; // same indentation level
                        }
                        else if (this.indentStack[this.indentStack.length-1] < token.column) {
                            throw new SyntaxError('Bad indentation level.');
                        }
                    }
                }
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
        if (c === '#' && !this.inString) {   // skip comments until new line
            while (c !== '\n') {
                c = this.getchar();
            }
        }
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
    NONE,
    TRUE,
    FALSE,
    PASS,
    IF,
    ELSE,
    WHILE,
    UNSIGNEDFLOAT,
    STRING,
    EQUAL,
    NOTEQUAL,
    LESSTHAN,
    LESSEQUAL,
    GREATERTHAN,
    GREATEREQUAL,
    DIV,
    COMMA,
    COLON,
    INDENT,
    DEDENT,
};