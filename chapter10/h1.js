const {UNARY_NEGATIVE} = require('./p1');
const {BINARY_MULTIPLY} = require('./p1');
const {BINARY_ADD} = require('./p1');
const {PRINT_ITEM} = require('./p1');
const {PRINT_NEWLINE} = require('./p1');
const {STORE_NAME} = require('./p1');
const {LOAD_CONST} = require('./p1');
const {LOAD_NAME} = require('./p1');


class Interpreter {    
    constructor(co_code, co_names, co_consts) {
        this.co_code = co_code;
        this.co_names = co_names;
        this.co_consts = co_consts;
        this.co_values = [];
        this.stack = [];
        this.sp = 0; // stack pointer

        // initialize co_values with same size of co_names
        for (var i=0; i<this.co_names.length; i++) {
            this.co_values.push(null); // None
        }
    }

    run() {
        while (this.sp < this.co_code.length) {
            const opcode = this.co_code[this.sp];
            this.sp += 1;

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
            else if (opcode === PRINT_ITEM) {
                console.log(this.stack.pop());
            }
            else if (opcode === PRINT_NEWLINE) {
                console.log('\n');
            }
            else if (opcode === STORE_NAME) {
                const namei = this.co_code[this.sp];
                this.sp += 1; // skip argument and pass to next instruction.
                this.co_values[namei] = this.stack.pop();
            }
            else if (opcode === LOAD_CONST) {
                const consti = this.co_code[this.sp];
                this.sp += 1; // skip the argument and pass to next instruction.
                const value = this.co_consts[consti];
                this.stack.push(value);
            }
            else if (opcode === LOAD_NAME) {
                const namei = this.co_code[this.sp];
                this.sp += 1; // skip the argument and pass to next instruction.
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