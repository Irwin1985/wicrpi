const {UNARY_NEGATIVE} = require('./p2');
const {BINARY_MULTIPLY} = require('./p2');
const {BINARY_DIVIDE} = require('./p2');
const {BINARY_ADD} = require('./p2');
const {BINARY_SUBTRACT} = require('./p2');
const {PRINT_ITEM} = require('./p2');
const {PRINT_NEWLINE} = require('./p2');
const {STORE_NAME} = require('./p2');
const {LOAD_CONST} = require('./p2');
const {LOAD_NAME} = require('./p2');
const {COMPARE_OP} = require('./p2');
const {JUMP_FORWARD} = require('./p2');
const {POP_JUMP_IF_FALSE} = require('./p2');
const {JUMP_ABSOLUTE} = require('./p2');
const {LT} = require('./p2');
const {LE} = require('./p2');
const {EQ} = require('./p2');
const {NE} = require('./p2');
const {GT} = require('./p2');


class Interpreter {    
    constructor(co_code, co_names, co_consts) {
        this.co_code = co_code;
        this.co_names = co_names;
        this.co_consts = co_consts;
        this.co_values = [];
        this.stack = [];
        this.ip = 0; // stack pointer

        // initialize co_values with same size of co_names
        for (var i=0; i<this.co_names.length; i++) {
            this.co_values.push(null); // None
        }
    }

    run() {
        while (this.ip < this.co_code.length) {
            const opcode = this.co_code[this.ip];
            this.ip += 1;

            if (opcode === UNARY_NEGATIVE) {
                this.stack[this.stack.length-1] = -this.stack[this.stack.length-1];
            }
            else if (opcode === BINARY_MULTIPLY) {
                const right = this.stack.pop();
                const left = this.stack.pop();
                this.stack.push(left * right);
            }
            else if (opcode === BINARY_ADD) {
                const right = this.stack.pop();
                const left = this.stack.pop();
                this.stack.push(left + right);
            }
            else if (opcode === COMPARE_OP) {
                const right = this.stack.pop();
                const left = this.stack.pop();
                const op = this.co_code[this.ip];
                this.ip += 1;
                switch (op) {
                    case EQ:
                        this.stack.push(left == right);
                        break;
                    case NE:
                        this.stack.push(left != right);
                        break;
                    case LT:
                        this.stack.push(left < right);
                        break;
                    case LE:
                        this.stack.push(left <= right);
                        break;
                    case GT:
                        this.stack.push(left > right);
                        break;
                    case GE:
                        this.stack.push(left >= right);
                        break;                    
                }
            }
            else if (opcode === JUMP_FORWARD) {
                const reladdr = this.co_code[this.ip];
                this.ip += 1; // skip the argument
                this.ip = this.ip + reladdr; // update the new instruction location
            }
            else if (opcode === POP_JUMP_IF_FALSE) {
                const condition = this.stack.pop();
                if (!condition) {
                    this.ip = this.co_code[this.ip]; // get the new instruction location
                } else {
                    this.ip += 1; // skip opcode argument because condition is true so continue...
                }
            }
            else if (opcode === JUMP_ABSOLUTE) {
                this.ip = this.co_code[this.ip]; // get the new instruction location
            }
            else if (opcode === PRINT_ITEM) {
                console.log(this.stack.pop());
            }
            else if (opcode === PRINT_NEWLINE) {
                console.log('\n');
            }
            else if (opcode === STORE_NAME) {
                const namei = this.co_code[this.ip];
                this.ip += 1; // skip argument and pass to next instruction.
                this.co_values[namei] = this.stack.pop();
            }
            else if (opcode === LOAD_CONST) {
                const consti = this.co_code[this.ip];
                this.ip += 1; // skip the argument and pass to next instruction.
                const value = this.co_consts[consti];
                this.stack.push(value);
            }
            else if (opcode === LOAD_NAME) {
                const namei = this.co_code[this.ip];
                this.ip += 1; // skip the argument and pass to next instruction.
                if (this.co_values[namei] == null) {
                    console.error(`Variable ${this.co_names[namei]} not defined.`);
                    process.exit(1);
                } else {
                    const value = this.co_values[namei];
                    this.stack.push(value);
                }
            }
        }
    }
}

module.exports = {
    Interpreter,
};