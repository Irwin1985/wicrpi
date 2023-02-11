/*
<program>           -> <stmt>* EOF
<stmt>              -> <simplestmt> NEWLINE
<stmt>              -> <compoundstmt>

<simplestmt>        -> <assignmentstmt>
<simplestmt>        -> <printstmt>
<simplestmt>        -> <passstmt>

<compoundstmt>      -> <whilestmt>
<compoundstmt>      -> <ifstmt>

<assignmentstmt>    -> NAME '=' <relexpr>
<printstmt>         -> 'print' '(' [<relexpr> (',' <relexpr>)* [',']] ')'
<passstmt>          -> 'pass'
<whilestmt>         -> 'while' <relexpr> ':' <codeblock>
<ifstmt>            -> 'if' <relexpr> ':' <codeblock> ['else' ':' <codeblock>]
<codeblock>         -> NEWLINE INDENT <stmt>+ DEDENT
<relexpr>           -> <expr> [ ('<' | '<=' | '==' | '!=' | '>' | '>=') <expr> ]
<expr>              -> <term> ('+' <term>)*
<term>              -> <factor> ('*' <factor>)*

<factor>            -> '+' <factor>
<factor>            -> '-' <factor>
<factor>            -> UNSIGNEDINT
<factor>            -> UNSIGNEDFLOAT
<factor>            -> NAME
<factor>            -> '(' <relexpr> ')'
<factor>            -> STRING
<factor>            -> 'True'
<factor>            -> 'False'
<factor>            -> 'None'
*/

const tok = require('../chapter14/t2');
var sign = 1;

// bytecode opcodes
const UNARY_NEGATIVE    = 11    // hex 0B
const BINARY_MULTIPLY   = 20    // hex 14
const BINARY_DIVIDE     = 21    // hex 15
const BINARY_ADD        = 23    // hex 17
const BINARY_SUBTRACT   = 24    // hex 18
const PRINT_ITEM        = 71    // hex 47
const PRINT_NEWLINE     = 72    // hex 48
const STORE_NAME        = 90    // hex 5A
const LOAD_CONST        = 100   // hex 64
const LOAD_NAME         = 101   // hex 65
const COMPARE_OP        = 106   // hex 6A
const JUMP_FORWARD      = 110   // hex 6E
const POP_JUMP_IF_FALSE = 111   // hex 6F
const JUMP_ABSOLUTE     = 113   // hex 71

// compare codes
const LT = 0; // '<' code
const LE = 1; // '<=' code
const EQ = 2; // '==' code
const NE = 3; // '!=' code
const GT = 4; // '>' code
const GE = 5; // '>=' code

class Parser {
    constructor(tokenList) {
        this.tokenList = tokenList;
        this.token = null;
        this.tokenIndex = -1;
        this.co_code = [];
        this.co_names = [];
        this.co_consts = [];        
    }

    parse() {
        this.advance(); // prime the first token
        this.program();
        console.log("**********CODE OBJECT**********")
        console.log(this.co_code);
        console.log("**********CONSTANTS**********")
        console.log(this.co_consts);
        console.log("**********NAMES**********")
        console.log(this.co_names);
    }
    // <program>    -> <stmt>* EOF
    program() {
        while (this.token.category == tok.PRINT || this.token.category == tok.NAME) {
            this.stmt();
        }
        if (this.token.category !== tok.EOF) {
            throw new SyntaxError(`Expecting end of file.`);
        }
        console.log("Parser output: Grammar ok!");
    }

    stmt() {
        this.simplestmt();
        this.consume(tok.NEWLINE);
    }

    simplestmt() {
        if (this.token.category == tok.NAME) {
            this.assignmentstmt();
        }
        else if (this.token.category == tok.PRINT) {
            this.printstmt();
        } else {
            this.compoundstmt();
        }
    }

    compoundstmt() {
        if (this.token.category == tok.IF) {
            this.ifstmt();
        }
        else if (this.token.category == tok.WHILE) {
            this.whilestmt();
        } else {
            throw new SyntaxError(`Expecting statement`);
        }
    }

    assignmentstmt() {
        const name = this.token.lexeme;
        let namei = 0;
        if (this.co_names.indexOf(name) >= 0) {
            namei = this.co_names[name];
        } else {
            namei = this.co_names.length;
            this.co_names.push(name);
        }
        this.advance(); // advance past NAME token
        this.consume(tok.ASSIGNOP);
        this.relexpr();
        this.co_code.push(STORE_NAME);
        this.co_code.push(namei);
    }

    printstmt() {
        this.advance();     // advance past PRINT token
        this.consume(tok.LEFTPAREN);
        if (this.token.category !== tok.LEFTPAREN) {
            this.relexpr();
            while (this.token.category == tok.COMMA) {
                this.advance();
                if (this.token.category == tok.RIGHTPAREN) {
                    break;
                }
                this.relexpr();
                this.co_code.push(PRINT_ITEM);
            }
        }
        this.co_code.push(PRINT_ITEM);   // Pop stack and display
        this.co_code.push(PRINT_NEWLINE); // output a newline char
        this.consume(tok.RIGHTPAREN);
    }

    passstmt() {
        this.advance();
    }

    whilestmt() {
        this.advance();
        const backaddress = this.co_code.length; // save position before parsing condition.
        this.relexpr();
        this.consume(tok.COLON);
        this.co_code.push(POP_JUMP_IF_FALSE);
        const forwardaddress = this.co_code.length; // save the instruction position
        this.co_code.push(null); // dummy code
        this.codeblock();
        this.co_code.push(JUMP_ABSOLUTE);
        this.co_code.push(backaddress);
        this.co_code[forwardaddress] = this.co_code.length;
    }

    ifstmt() {
        this.advance();
        this.relexpr();
        this.consume(tok.COLON);
        this.co_code.push(POP_JUMP_IF_FALSE);
        const address1 = this.co_code.length;
        this.co_code.push(null); // dummy value (we'll update it later)
        this.codeblock();
        if (this.token.category == tok.ELSE) {
            this.advance();
            this.consume(tok.COLON);
            this.co_code.push(JUMP_FORWARD);
            const address2 = this.co_code.length;
            this.co_code.push(null); // dummy value
            const startaddress = this.co_code.length;
            this.co_code[address1] = this.co_code.length;
            this.codeblock();
            this.co_code[address2] = this.co_code.length-startaddress;
        }
    }

    relexpr() {
        this.expr();
        while (this.token.category == tok.EQUAL || this.token.category == tok.NOTEQUAL ||
            this.token.category == tok.LESSTHAN || this.token.category == tok.LESSEQUAL ||
            this.token.category == tok.GREATERTHAN || this.token.category == tok.GREATEREQUAL) {
            const savecat = this.token.category;
            let compare_code = null;
            this.advance();
            this.expr();
            this.co_code.push(COMPARE_OP);
            switch (savecat) {
                case tok.EQUAL:
                    compare_code = EQ;
                    break;
                case tok.NOTEQUAL:
                    compare_code = NE;
                    break;
                case tok.LESSTHAN:
                    compare_code = LT;
                    break;
                case tok.LESSEQUAL:
                    compare_code = LE;
                    break;
                case tok.GREATERTHAN:
                    compare_code = GT;
                    break;
                case tok.GREATEREQUAL:
                    compare_code = GE;
                    break;
            }
            this.co_code.push(compare_code);
        }
    }

    expr() {
        this.term();        // generates bytecode that pushes term's value
        while (this.token.category == tok.PLUS || this.token.category == tok.MINUS) {
            this.advance();     // no need for this.consume() here.            
            this.term();    // generates bytecode that pushes term's value
            this.co_code.push(BINARY_ADD); // generate the add instruction
        }
    }

    term() {
        sign = 1;       // initialize sign before calling factor
        this.factor();
        while (this.token.category == tok.TIMES) {
            this.advance();
            sign = 1;   // initialize sign begore calling factor
            this.factor(); // leave value of term on top of stack
            this.co_code.push(BINARY_MULTIPLY);
        }
    }

    factor() {
        switch (this.token.category) {
            case tok.PLUS:  // sign does not change its value.
                this.advance();
                this.factor();
                break;
            case tok.MINUS:
                sign = -sign;   // flip sign value
                this.advance();
                this.factor();
                break;
            case tok.UNSIGNEDINT, tok.UNSIGNEDFLOAT:
                const v = sign*Number(this.token.lexeme);
                let consti = 0;
                // this literal v already exists?
                if (this.co_consts.indexOf(v) >= 0) {
                    consti = this.co_consts[v]; // use the same index to avoid unnecessary literal duplicate
                } else {
                    consti = this.co_consts.length; // index of next available slot
                    this.co_consts.push(v); // add value to co_consts
                }
                this.co_code.push(LOAD_CONST);    // LOAD_CONST has an argument
                this.co_code.push(consti);        // index is the argument of LOAD_CONST
                this.advance();
                break;
            case tok.NAME:
                let namei; // index of name
                if (this.co_names.indexOf(this.token.lexeme) >= 0) {
                    namei = this.co_names.indexOf(this.token.lexeme);
                    this.advance();
                } else {
                    throw new ReferenceError(`${this.token.lexeme} is not defined.`);
                }
                this.co_code.push(LOAD_NAME);    // LOAD_NAME has an argument
                this.co_code.push(namei);        // namei is the argument. (index of name)
                if (sign == -1) {
                    this.co_code.push(UNARY_NEGATIVE);
                }
                break;
            case tok.LEFTPAREN:
                this.advance();
                // save sign because expr() calls term() which resets sign to 1.
                const savesign = sign;
                this.relexpr();
                if (savesign == -1) {
                    // change sign of expr.
                    this.co_code.push(UNARY_NEGATIVE); // negate expr
                }
                this.consume(tok.RIGHTPAREN);
                break;
            case tok.TRUE:
                let index;
                if (this.co_consts.indexOf(true) >= 0) {
                    index = this.co_consts.indexOf(true);
                } else {
                    index = this.co_consts.length;
                    this.co_consts.push(true);
                }
                this.co_code.push(LOAD_CONST);
                this.co_code.push(index);
                this.advance();
            default:
                throw new SyntaxError(`Expecting factor.`);
        }
    }

    advance() {
        this.tokenIndex += 1;   // move to next token
        if (this.tokenIndex >= this.tokenList.length) {
            throw new SyntaxError(`Unexpected end of file.`);
        }
        this.token = this.tokenList[this.tokenIndex];   // token is the current token
    }

    consume(expectedCat) {
        if (this.token.category === expectedCat) {
            this.advance();
        } else {
            throw new SyntaxError(`Expecting ${tok.catNames[expectedCat]}`);
        }
    }

}

module.exports = {
    Parser,
    UNARY_NEGATIVE,
    BINARY_MULTIPLY,
    BINARY_DIVIDE,
    BINARY_ADD,
    BINARY_SUBTRACT,
    PRINT_ITEM,
    PRINT_NEWLINE,
    STORE_NAME,
    LOAD_CONST,
    LOAD_NAME,
    COMPARE_OP,
    JUMP_FORWARD,
    POP_JUMP_IF_FALSE,
    JUMP_ABSOLUTE,
    LT,
    LE,
    EQ,
    NE,
    GT,
    GE,
};