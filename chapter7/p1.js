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

class Parser {
    constructor(tokenList) {
        this.tokenList = tokenList;
        this.token = null;
        this.tokenIndex = -1;
    }

    parse() {
        this.advance(); // prime the first token
        return this.program();
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
        this.advance(); // advance past NAME token
        this.consume(tok.ASSIGNOP);
        this.expr();
    }

    printstmt() {
        this.advance();     // advance past PRINT token
        this.consume(tok.LEFTPAREN);
        this.expr();
        this.consume(tok.RIGHTPAREN);
    }

    expr() {
        this.term();
        while (this.token.category == tok.PLUS) {
            this.advance();     // no need for this.consume() here.
            this.term();
        }
    }

    term() {
        this.factor();
        while (this.token.category == tok.TIMES) {
            this.advance();
            this.factor();
        }
    }

    factor() {
        switch (this.token.category) {
            case tok.PLUS:
                this.advance();
                this.factor();
                break;
            case tok.MINUS:
                this.advance();
                this.factor();
                break;
            case tok.UNSIGNEDINT:
                this.advance();
                break;
            case tok.NAME:
                this.advance();
                break;
            case tok.LEFTPAREN:
                this.advance();
                this.expr();
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
};