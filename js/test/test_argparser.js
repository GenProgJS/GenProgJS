const assert = require('assert');
const tests = require('mocha');
const expect = require('chai').expect;
const should = require('chai').should();

const parser = require("../bin/src/argparser/ArgParser");
const msg = require('./message');

describe(msg.message(parser.ArgParser), function () {
    const decoded_program = "This \ncode \nwill \nbe \nencoded.\n";
    const encoded_program = "This ___EOL___code ___EOL___will ___EOL___be ___EOL___encoded.___EOL___";

    it("Should encode newline characters in program by changing '\\n' to '___EOL___'.", function () {
        const code = parser.ArgParser.encode_src(decoded_program);

        expect(code).to.be.equal(encoded_program);
    });

    it("Should decode newline characters in program by changing '___EOL___' to '\\n'.", function () {
        const code = parser.ArgParser.decode_src(encoded_program);

        expect(code).to.be.equal(decoded_program);
    });
})
