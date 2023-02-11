const tok = require('./chapter6/t1');
const fs = require('fs');
const path = require('path');
const DEBUG_MODE = true;
const {Parser} = require('./chapter10/p1');
const {Interpreter} = require('./chapter10/h1');


function main() {
    if (DEBUG_MODE) {
        fileName = "test.in";
        console.log(fileName);
        source = String(fs.readFileSync(fileName));
    } else {
        if (process.argv.length === 3) {    // check if correct number of cmd line args
            try {                
                source = String(fs.readFileSync(process.argv[2]));
            } catch(e) {
                console.error(`Cannot read input file "${process.argv[2]}"`);
                process.exit(1);
            }        
        } else {
            console.log('Wrong number of command line arguments');
            console.log(`format: node ${path.basename(__filename)} file.py <infile>`);
            process.exit(1);
        }
    }

    // add new line to end if missing
    if (source.slice(-1) !== '\n') {
        source += '\n';
    }

    const tokenizer = new tok.Tokenizer(source);    
    try {
        tokenizer.tokenizer();
        const parser = new Parser(tokenizer.tokenList);
        parser.parse();
        const interpreter = new Interpreter(parser.co_code, parser.co_names, parser.co_consts);
        interpreter.run();
    } catch(e) {
        console.error(e.message);
    }
}

main();