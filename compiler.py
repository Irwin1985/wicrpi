import Tokenizer

# opcodes
UNARY_NEGATIVE = 11
BINARY_MULTIPLY = 20
BINARY_ADD = 23
PRINT_ITEM = 71
PRINT_NEW_LINE = 72
STORE_NAME = 90
LOAD_CONST = 100
LOAD_NAME = 101

# displayable opcodes names
opname = {
    11: 'UNARY_NEGATIVE',
    20: 'BINARY_MULTIPLY',
    23: 'BINARY_ADD',
    71: 'PRINT_ITEM',
    72: 'PRINT_NEW_LINE',
    90: 'STORE_NAME',
    100: 'LOAD_CONST',
    101: 'LOAD_NAME',
}


class Compiler:
    def __init__(self, tokens, co_names, co_const, debug=None):
        self.tokens = tokens
        self.pos = -1
        self.curtok = None
        self.peektok = None
        self.advance()
        self.advance()
        self.sign = 1
        self.debug = debug

        self.co_code = []           # op-code list
        self.co_names = co_names    # symbols table
        self.co_consts = co_const   # constant list

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
        if self.curtokenis(Tokenizer.NAME) and self.peektok.category == Tokenizer.ASSIGNOP:
            self.assignment()
        elif self.curtokenis(Tokenizer.PRINT):
            self.printstmt()
        else:
            self.expr()

    # assignment ::= NAME '=' expr
    def assignment(self):
        name = self.curtok.lexeme
        if name in self.co_names:
            index = self.co_names.index(name)
        else:
            index = len(self.co_names)
            self.co_names.append(name)

        self.advance()
        self.consume(Tokenizer.ASSIGNOP)
        self.expr()
        self.co_code.append(STORE_NAME)
        self.co_code.append(index)
        self.print_debug(STORE_NAME, index)  # debug

    # printstmt ::= 'print' '(' expr ')'
    def printstmt(self):
        self.advance()
        self.consume(Tokenizer.LEFTPAREN)
        self.expr()
        self.co_code.append(PRINT_ITEM)
        self.print_debug(PRINT_ITEM)  # debug
        self.co_code.append(PRINT_NEW_LINE)
        self.print_debug(PRINT_NEW_LINE)  # debug
        self.consume(Tokenizer.RIGHTPAREN)

    # expr ::= term ('+' term)*
    def expr(self):
        self.term()
        while self.curtokenis(Tokenizer.PLUS):
            self.advance()
            self.term()
            self.co_code.append(BINARY_ADD)
            self.print_debug(BINARY_ADD)  # debug

    # term ::= factor ('*' factor)*
    def term(self):
        self.sign = 1
        self.factor()
        while self.curtokenis(Tokenizer.TIMES):
            self.advance()
            self.sign = 1
            self.factor()
            self.co_code.append(BINARY_MULTIPLY)
            self.print_debug(BINARY_MULTIPLY)  # debug

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
            v = int(self.curtok.lexeme) * self.sign
            if v in self.co_consts:
                index = self.co_consts.index(v)
            else:
                index = len(self.co_consts)
                self.co_consts.append(v)

            self.co_code.append(LOAD_CONST)
            self.co_code.append(index)
            self.print_debug(LOAD_CONST, index)  # debug
            self.advance()
        elif self.curtokenis(Tokenizer.NAME):
            name = self.curtok.lexeme
            if name in self.co_names:
                index = self.co_names.index(name)
            else:
                raise RuntimeError('Name ' + name + ' is not defined')
            self.co_code.append(LOAD_NAME)
            self.co_code.append(index)
            self.print_debug(LOAD_NAME, index)  # debug
            if self.sign == -1:
                self.co_code.append(UNARY_NEGATIVE)
                self.print_debug(UNARY_NEGATIVE)  # debug
            self.advance()
        elif self.curtokenis(Tokenizer.LEFTPAREN):
            self.advance()
            oldsign = self.sign
            self.expr()
            # check for oldsign -1
            if oldsign == -1:
                self.co_code.append(UNARY_NEGATIVE)
                self.print_debug(UNARY_NEGATIVE)  # debug
            self.consume(Tokenizer.RIGHTPAREN)
        else:
            raise RuntimeError('Expecting factor')

    def curtokenis(self, cat):
        return self.curtok.category == cat

    def print_debug(self, opcode, index=None):
        if self.debug:
            if index is not None:
                if opcode in [90, 101]:
                    symbol = self.co_names[index]
                    print(opname[opcode] + '\t' + symbol)
                else:
                    constant = self.co_consts[index]
                    print(opname[opcode] + '\t' + str(constant))
            else:
                print(opname[opcode])