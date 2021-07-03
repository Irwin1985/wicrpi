"""
This is the Tokenizer for the Hybrid Interpreter called wic
"""
import sys
import StreamReader
import Token

# global variables
source = ''         # receives entire source program
sourceindex = 0     # index into source
line = 0            # current line number
column = 0          # current column number
tokenlist = []      # list of tokens created by tokenizer
prevchar = '\n'     # '\n' in prevchar signals start of new line
blankline = True    # reset to False if line is not blank
instring = False    # True when processing a string
parenlevel = 0      # nesting level of parentheses


class Scanner:
    def __init__(self, source=None):
        self.input = source
        self.sr = StreamReader(self.input)
        self.c = self.sr.read()

    def consume(self):
        self.c = self.sr.read()

    def ws(self):
        while self.c is not None and self.c != '\n':
            self.consume()

    def number(self):
        tok = Token(self.sr.line, self.sr.col, Token.UNSIGNEDINT, None)
        lexeme = ""
        while self.c is not None and (self.c.isdigit() or self.c == '.'):
            lexeme += self.c
            self.consume()
        if '.' in lexeme:
            tok.category = Token.UNSIGNEDFLOAT
        return tok

    def string(self):
        lexeme = ""
        self.consume()
        tok = Token(self.sr.line, self.sr.col, Token.STRING, None)
        while self.c is not None and (self.c.isalnum() or self.c == '_'):
            lexeme += self.c
            self.consume()
        tok.lexeme = lexeme
        return tok

    def next_token(self):
        tok = Token(self.sr.line, self.sr.col, Token.EOF, '')
        while self.c is not None:
            pass

        return tok



# main() reads input file and calls tokenizer()
def main():
    global source

    # simulate the source code
    source = """
print(-59 + 20*3)
a = 2
bb_1 = -a + 12
print(a*bb_1 + a*3*(-1 + -1 + -1))
    """

    # add newline to end if missing
    if source[-1] != '\n':
        source += '\n'

    try:
        tokenizer()  # tokenize source code in source
    except RuntimeError as emsg:
        # output slash n in place of newline
        lexeme = token.lexeme.replace('\n', '\\n')
        print('\nError on ' + "'" + lexeme + "'" + ' line ' + str(token.line) + ' column ' + str(token.column))
        print(emsg)
        sys.exit(1)  # 1 return code indicates an error has occurred


# getchar() gets next char from source and adjusts line and column
def getchar():
    global sourceindex, column, line, prevchar, blankline

    # check if starting a new line
    if prevchar == '\n':    # '\n' signals start of a new line
        line += 1           # increment line number
        column = 0          # reset column number
        blankline = True    # initialize blankline

    if sourceindex >= len(source):  # at end of source code?
        column = 1                  # set EOF column to 1
        prevchar = ''               # save current char for next call
        return ''                   # null str signals end of source

    c = source[sourceindex]     # get next char in the source program
    sourceindex += 1            # increment sourceindex to next character
    column += 1                 # increment column number

    if c == '#' and not instring: # skip over comment
        while True:
            c = source[sourceindex]
            sourceindex += 1
            if c == '\n':
                break

    if not c.isspace():         # if c not whitespace then line not blank
        blankline = False       # indicate line not blank
    prevchar = c                # save current char for next call

    # if at end of blank line, return space in place of '\n'
    if c == '\n' and blankline:
        return ' '
    else:
        return c  # return character to tokenizer()


####################
# tokenizer        #
####################
def tokenizer():
    global token, instring
    curchar = ' '  # prime curchar with space
    indentstack = [1]

    while True:
        # skip whitespace but not newlines
        while curchar != '\n' and curchar.isspace():
            curchar = getchar()  # get next char from source program

        # construct and initialize a new token
        token = Token(line, column, None, '')

        if curchar.isdigit() or curchar == '.':               # start of unsigned int?
            token.category = UNSIGNEDINT    # save category of token
            if curchar == '.':
                token.category = UNSIGNEDFLOAT
            while True:
                token.lexeme += curchar     # append curchar to lexeme
                curchar = getchar()         # get next character
                if token.category == UNSIGNEDINT and curchar == '.':
                    token.category = UNSIGNEDFLOAT
                elif not curchar.isdigit():   # break if not a digit
                    break
        elif curchar == "'":
            instring = True
            while True:
                curchar = getchar()  # skip the first [']
                if curchar == '' or curchar == '\n':
                    raise RuntimeError('Unterminated string')
                if curchar == "'":
                    curchar = getchar()  # skip the last [']
                    token.category = STRING
                    instring = False
                    break
                if curchar == '\\':  # start of scape character
                    curchar = getchar()  # skip the '\'
                    if curchar == 'n':
                        token.lexeme += '\n'
                    elif curchar == 't':
                        token.lexeme += '\t'
                    elif curchar == '\n':
                        pass
                    elif curchar == "'":
                        token.lexeme += "'"
                    else:
                        token.lexeme += curchar  # just put back the '\'
                else:
                    token.lexeme += curchar

        elif curchar.isalpha() or curchar == '_':  # start of name?
            while True:
                token.lexeme += curchar     # append curchar to lexeme
                curchar = getchar()         # get next character
                # break if not letter, '_', or digit
                if not (curchar.isalnum() or curchar == '_'):
                    break
            # determine if lexeme is a keyword or name of variable
            if token.lexeme in keywords:
                token.category = keywords[token.lexeme]
            else:
                token.category = NAME

        elif curchar in smalltokens:
            save = curchar  # save the first character
            curchar = getchar()  # get the next character
            twochar = save + curchar  # build the 2 length character
            if twochar in smalltokens:
                token.category = smalltokens[twochar]
                token.lexeme = twochar
                curchar = getchar()
            else:
                token.category = smalltokens[save]  # get category
                token.lexeme = save
        else:
            token.category = ERROR  # invalid token
            token.lexeme = curchar  # save lexeme
            raise RuntimeError('Invalid token')

        # check for change in indentation when starting a new line
        if len(tokenlist) == 0 or tokenlist[-1].category == NEWLINE:
            if indentstack[-1] < token.column:      # indentation
                indentstack.append(token.column)
                indenttoken = Token(token.line, token.column, INDENT, '{')
                tokenlist.append(indenttoken)
            elif indentstack[-1] > token.column:    # dedentation
                while True:
                    dedenttoken = Token(token.line, token.column, DEDENT, '}')
                    tokenlist.append(dedenttoken)
                    indentstack.pop()
                    if indentstack[-1] == token.column:
                        break
                    elif indentstack[-1] < token.column:
                        raise RuntimeError('Indentation error')

        tokenlist.append(token)     # append token to tokens list

        if token.category == EOF:
            break


####################
# start of program #
####################
if __name__ == '__main__':
    main()  # call main function
    for token in tokenlist:
        print(token.__str__())