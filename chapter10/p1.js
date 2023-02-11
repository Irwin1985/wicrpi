/*
<program>           -> <stmt>* EOF
<stmt>              -> <simplestmt> NEWLINE
<simplestmt>        -> <assignmentstmt>
<simplestmt>        -> <printstmt>
<assignmentstmt>    -> NAME '=' <expr>
<printstmt>         -> 'print' '(' <expr> ')'
<expr>              -> <term> ('+' <term>)*
<term>              -> <factor> ('*' <factor>)*
<factor>            -> '+' <factor>
<factor>            -> '-' <factor>
<factor>            -> UNSIGNEDINT
<factor>            -> NAME
<factor>            -> '(' <expr> ')'
*/

const tok = require('../chapter6/t1');
var sign = 1;

// bytecode opcodes
const UNARY_NEGATIVE    = 11    // hex 0B
const BINARY_MULTIPLY   = 20    // hex 14
const BINARY_ADD        = 23    // hex 17
const PRINT_ITEM        = 71    // hex 47
const PRINT_NEWLINE     = 72    // hex 48
const STORE_NAME        = 90    // hex 5A
const LOAD_CONST        = 100   // hex 64
const LOAD_NAME         = 101   // hex 65

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
        this.expr();
        this.co_code.push(STORE_NAME);
        this.co_code.push(namei);
    }

    printstmt() {
        this.advance();     // advance past PRINT token
        this.consume(tok.LEFTPAREN);
        this.expr();
        this.co_code.push(PRINT_ITEM);   // Pop stack and display
        this.co_code.push(PRINT_NEWLINE); // output a newline char
        this.consume(tok.RIGHTPAREN);
    }

    expr() {
        this.term();        // generates bytecode that pushes term's value
        while (this.token.category == tok.PLUS) {
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
            case tok.UNSIGNEDINT:
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
                this.expr();
                if (savesign == -1) {
                    // change sign of expr.
                    this.co_code.push(UNARY_NEGATIVE); // negate expr
                }
                this.consume(tok.RIGHTPAREN);
                break;
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
    BINARY_ADD,
    PRINT_ITEM,
    PRINT_NEWLINE,
    STORE_NAME,
    LOAD_CONST,
    LOAD_NAME,    
};