"""
Token and TokenTypes
"""

# constants that represent token categories
EOF = 0             # end of file
PRINT = 1           # 'print' keyword
UNSIGNEDINT = 2     # integer
NAME = 3            # identifier that is not a keyword
ASSIGNOP = 4        # '=' assignment operator
LEFTPAREN = 5       # '('
RIGHTPAREN = 6      # ')'
PLUS = 7            # '+'
MINUS = 8           # '-'
TIMES = 9           # '*'
NEWLINE = 10        # newline character
ERROR = 11          # if not any of the above, then error

# new keywords
NONE = 12           # 'None' keyword
TRUE = 13           # 'True' keyword
FALSE = 14          # 'False' keyword
PASS = 15           # 'pass' keyword
IF = 16             # 'if' keyword
ELSE = 17           # 'else' keyword
WHILE = 18          # 'while' keyword

# new types
UNSIGNEDFLOAT = 19  # number with a decimal point
STRING = 20         # string delimited by single quotes

# relational operators category numbers
EQUAL = 21          # '=='
NOTEQUAL = 22       # '!='
LESSTHAN = 23       # '<'
LESSEQUAL = 24      # '<='
GREATERTHAN = 25    # '>'
GREATEREQUAL = 26   # '>='

# new arithmetic operators
DIV = 27  # '/' floating point divide

# new punctuation
COMMA = 28  # ','
COLON = 29  # ':'

# python identation
INDENT = 30 # indentation
DEDENT = 31 # outdentation


# displayable names for each token category
catnames = [
    'EOF',
    'PRINT',
    'UNSIGNEDINT',
    'NAME',
    'ASSIGNOP',
    'LEFTPAREN',
    'RIGHTPAREN',
    'PLUS',
    'MINUS',
    'TIMES',
    'NEWLINE',
    'ERROR',
    'NONE',
    'TRUE',
    'FALSE',
    'PASS',
    'IF',
    'ELSE',
    'WHILE',
    'UNSIGNEDFLOAT',
    'STRING',
    'EQUAL',
    'NOTEQUAL',
    'LESSTHAN',
    'LESSEQUAL',
    'GREATERTHAN',
    'GREATEREQUAL',
    'DIV',
    'COMMA',
    'COLON',
    'INDENT',
    'DEDENT',
]

# keywords and their token categories
keywords = {
    'print': PRINT,
    'none': NONE,
    'True': TRUE,
    'False': FALSE,
    'pass': PASS,
    'if': IF,
    'else': ELSE,
    'while': WHILE,
}

# one-character tokens and their token categories
smalltokens = {
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
    '\n': NEWLINE,
    '': EOF,
    ',': COMMA,
    ':': COLON,
    '/': DIV,
}


class Token:
    def __init__(self, line, column, category, lexeme):
        self.line = line
        self.column = column
        self.category = category
        self.lexeme = lexeme

    def __str__(self):
        return "%3s %4s  %-14s %s" % (str(self.line), str(self.column), catnames[self.category], self.lexeme)

    __repr__ = __str__


def loopup_ident(ident):
    if ident in keywords:
        return keywords[ident]
    return NAME
