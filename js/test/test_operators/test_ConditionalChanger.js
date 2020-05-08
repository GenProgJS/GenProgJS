const expect = require('chai').expect;
const should = require('chai').should();

const op = require('../../bin/src/operators/ConditionalChangerOperator');
const msg = require('../message');


describe(msg.message(op.ConditionalChangerOperator), function () {
    function visitor(node, metadata) { if (node.type !== esprima.Syntax.Program) nodes.push(node); }

    const program_v1 = "if (mybool && another) {\n    do_sth();\n}\n";
    const program_v2 = "if (false) {\n    do_sth();\n}\n";
    const program_v3 = "if (true) {\n    do_sth();\n}\n";
    const program_v4 = "let no_if_here = 42;\n";

    it("Should insert false or true inside if statement.", function () {
        let mocking = new op.ConditionalChangerOperator(program_v1, 1);
        mocking.operate();

        let code = mocking.code;

        expect(code === program_v2 || code === program_v3).to.be.true;
    });

    it("Should insert false or true inside if statement.", function () {
        let mocking = new op.ConditionalChangerOperator(program_v2, 1);
        mocking.operate();

        let code = mocking.code;

        expect(code === program_v2 || code === program_v3).to.be.true;
    });

    it("Should insert false or true inside if statement.", function () {
        let mocking = new op.ConditionalChangerOperator(program_v3, 1);
        mocking.operate();

        let code = mocking.code;

        expect(code === program_v2 || code === program_v3).to.be.true;
    });

    it("Should leave program alone if, no conditional statements found in specified line.", function () {
        let mocking = new op.ConditionalChangerOperator(program_v4, 1);
        mocking.operate();

        let code = mocking.code;

        expect(code === program_v4).to.be.true;
    });

    it("Should return original code if error flag is set.", function () {
        let mocking = new op.ConditionalChangerOperator(program_v1, 1);
        mocking._err = Error("flag");

        let code = mocking._generate_patch();

        expect(code === program_v1).to.be.true;
    });
});