"""
Virtual Machine
"""
import compiler
import sys

# main stack
stack = []


def run(co_code, co_consts, co_names, co_values):
    global stack
    tos = -1    # top of the stack
    pc = 0      # pointer counter
    while pc < len(co_code):
        opcode = co_code[pc]  # fetch the instruction
        pc += 1  # increment pc
        # check the opcode
        if opcode == compiler.UNARY_NEGATIVE:
            stack[tos] = -stack[tos]

        elif opcode == compiler.BINARY_ADD:
            right = stack.pop()
            left = stack.pop()
            stack.append(left + right)

        elif opcode == compiler.BINARY_MULTIPLY:
            right = stack.pop()
            left = stack.pop()
            stack.append(left * right)

        elif opcode == compiler.PRINT_ITEM:
            value = stack.pop()
            print(value, end='')

        elif opcode == compiler.PRINT_NEW_LINE:
            print()

        elif opcode == compiler.STORE_NAME:
            index = co_code[pc]  # get the index
            pc += 1  # increment pc
            value = stack.pop()
            co_values[index] = value

        elif opcode == compiler.LOAD_CONST:
            index = co_code[pc]  # get the constant index
            pc += 1  # increment pc
            value = co_consts[index]  # get the literal from constants
            if value is None:
                print('No value for ' + co_names[index])
                sys.exit(1)
            stack.append(value)
        elif opcode == compiler.LOAD_NAME:
            index = co_code[pc]  # get the index of the name in co_names
            pc += 1
            value = co_values[index]
            stack.append(value)

        else:
            break
    if len(stack) > 0:
        return stack[-1]
    else:
        return None
