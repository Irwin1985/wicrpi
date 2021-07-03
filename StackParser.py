import Tokenizer


class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = -1
        self.curtok = None
        self.peektok = None
        self.advance()
        self.advance()
        self.stack = []  # operand stack
        self.symtab = {}  # symbol table
        self.sign = 1

    def advance(self):
        self.pos += 1
        self.curtok = self.peektok

        if self.pos >= len(self.tokens):
            self.peektok = None
        else:
            self.peektok = self.tokens[self.pos]

    def consume(self, category):
        if self.curtokenis(category):
            self.advance()
        else:
            raise RuntimeError('Expecting ' + Tokenizer.catnames[category])

    # program ::= (stmt)* EOF
    def program(self):
        while self.curtok.category != Tokenizer.EOF:
            self.stmt()

    # stmt ::= simplestmt NEWLINE
    def stmt(self):
        self.simplestmt()
        self.consume(Tokenizer.NEWLINE)

    # simplestmt ::= assignmentstmt | printstmt | expr
    def simplestmt(self):
        if self.curtokenis(Tokenizer.NAME):
            self.assignment()
        elif self.curtokenis(Tokenizer.PRINT):
            self.printstmt()
        else:
            self.expr()

    # assignment ::= NAME '=' expr
    def assignment(self):
        left = self.curtok.lexeme
        self.advance()
        self.consume(Tokenizer.ASSIGNOP)
        self.expr()
        self.symtab[left] = self.stack.pop()

    # printstmt ::= 'print' '(' expr ')'
    def printstmt(self):
        self.advance()
        self.consume(Tokenizer.LEFTPAREN)
        self.expr()
        print(self.stack[-1])
        self.consume(Tokenizer.RIGHTPAREN)

    # expr ::= term ('+' term)*
    def expr(self):
        self.term()
        while self.curtokenis(Tokenizer.PLUS):
            self.advance()
            self.term()
            right = self.stack.pop()
            left = self.stack.pop()
            self.stack.append(left + right)

    # term ::= factor ('*' factor)*
    def term(self):
        self.sign = 1
        self.factor()
        while self.curtokenis(Tokenizer.TIMES):
            self.advance()
            self.sign = 1
            self.factor()
            right = self.stack.pop()
            left = self.stack.pop()
            self.stack.append((left * right))

    # factor ::= NAME | UNSIGNEDINT | UNSIGNEDFLOAT
    def factor(self):
        if self.curtokenis(Tokenizer.PLUS):
            self.advance()
            self.factor()
        elif self.curtokenis(Tokenizer.MINUS):
            self.sign = -self.sign
            self.advance()
            self.factor()
        elif self.curtokenis(Tokenizer.UNSIGNEDINT):
            self.stack.append(int(self.curtok.lexeme) * self.sign)
            self.advance()
        elif self.curtokenis(Tokenizer.NAME):
            name = self.curtok.lexeme
            if name in self.symtab:
                self.stack.append(self.symtab[name])
            else:
                raise RuntimeError('Name ' + name + ' is not defined')
            self.advance()
        elif self.curtokenis(Tokenizer.LEFTPAREN):
            self.advance()
            oldsign = self.sign
            self.expr()
            # check for oldsign -1
            if oldsign == -1:
                tos = self.stack.pop()
                self.stack.append(-tos)
            self.consume(Tokenizer.RIGHTPAREN)

    def curtokenis(self, cat):
        return self.curtok.category == cat
