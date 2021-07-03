"""
StringReader class
Description: reads in a single character from input source and keep track
of lines and columns numbers.
"""


class StringReader:
    def __init__(self, source=None):
        self.input = source
        self.pos = -1
        self.line = 0
        self.col = 0

    def read(self):
        self.pos += 1
        c = None
        if self.pos >= len(self.input):
            return c

        c = self.input[self.pos]
        if c == '\n':
            self.line += 1
            self.col = 0
        else:
            self.col += 1
        return c

    def peek(self):
        if not self.is_eof():
            return self.input[self.pos+1]

    def is_eof(self):
        return self.pos + 1 >= len(self.input)
