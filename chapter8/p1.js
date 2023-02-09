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

const symtab = {};
const operandStack = [];
var sign = 1;

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
        const left = this.token.lexeme;     // save lexeme of the current token
        this.advance(); // advance past NAME token
        this.consume(tok.ASSIGNOP);
        this.expr();
        symtab[left] = operandStack.pop();
    }

    printstmt() {
        this.advance();     // advance past PRINT token
        this.consume(tok.LEFTPAREN);
        this.expr();
        console.log(operandStack.pop());
        this.consume(tok.RIGHTPAREN);
    }

    expr() {
        this.term();        // pushes value of term onto top of stack
        while (this.token.category == tok.PLUS) {
            this.advance();     // no need for this.consume() here.            
            this.term();    // pushes value of term onto top of stack
            const rightOperand = operandStack.pop();
            const leftOperand = operandStack.pop();
            operandStack.push(leftOperand + rightOperand);
        }
    }

    term() {
        sign = 1;       // initialize sign before calling factor
        this.factor();  // leaves value of term on top of stack
        while (this.token.category == tok.TIMES) {
            this.advance();
            sign = 1;   // initialize sign begore calling factor
            this.factor(); // leave value of term on top of stack
            const leftOperand = operandStack.pop();
            const rightOperand = operandStack.pop();
            operandStack.push(leftOperand * rightOperand);
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
                operandStack.push(sign*Number(this.token.lexeme));
                this.advance();
                break;
            case tok.NAME:
                if (symtab.hasOwnProperty(this.token.lexeme)) {
                    operandStack.push(sign * symtab[this.token.lexeme]);
                    this.advance();
                } else {
                    throw new ReferenceError(`${this.token.lexeme} is not defined.`);
                }
                break;
            case tok.LEFTPAREN:
                this.advance();
                // save sign because expr() calls term() which resets sign to 1.
                const savesign = sign;
                this.expr();
                if (savesign == -1) {
                    // change sign of expr.
                    operandStack[operandStack.length-1] = -operandStack[operandStack.length-1];
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
};