const expect = require('chai').expect;
const should = require('chai').should();

const esprima = require('esprima');
const escodegen = require('escodegen');
const gencode = require('../../bin/src/operators/gens/gencode/gencode').gencode;
const msg = require('../message');


describe(msg.message(gencode), function () {
    const program = "let mycode = \"this is valid js code\";\nlet life = 42;\n";
    const ast = esprima.parseScript(program);
    const generated_code = escodegen.generate(ast);

    it("Should generate same code as the passed generator does.", function () {
        expect(gencode(escodegen, ast)).to.equal(generated_code);
    });

    it("Should throw if generator is not passed.", function () {
        expect(() => gencode()).to.throw(TypeError);
    });
});