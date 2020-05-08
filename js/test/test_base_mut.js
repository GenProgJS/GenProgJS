const expect = require('chai').expect;
const should = require('chai').should();

const base = require('../bin/src/operators/base/MutationOperator');
const msg = require('./message');


describe(msg.message(base.MutationOperator), function () {
    it("Should set object's error flag.", function () {
        let op = new base.MutationOperator("one line program", 2);
        should.exist(op.err);
    });
    it("Object's error flag should be null.", function () {
        let op = new base.MutationOperator("three\nline\nprogram", 3);
        should.not.exist(op.err);
    });
    it("Empty program, error flag should NOT be null.", function () {
        let op = new base.MutationOperator("", 1);
        should.exist(op.err);
    });
    it("Undefined program, error flag should NOT be null.", function () {
        let op = new base.MutationOperator(undefined, 1);
        should.exist(op.err);
    });
    it("No bugs in program, error flag should be set to warn.", function () {
        let op = new base.MutationOperator("two\nlines", 0);
        should.exist(op.err);
    });
    it("Operate should not throw if program is defined properly.", function () {
        let op = new base.MutationOperator("let a = 1;\nlet obj = new Obj();\nconst str = \"text\"\n", 2);
        expect(op.operate.bind(op)).to.not.throw();
        expect(op.err).to.be.null;
    });
    it("Operate should not throw, even if the program is ill formed. Instead error flag should be set.", function () {
        let op = new base.MutationOperator("this is not javascript\n", 1);
        expect(op.operate.bind(op)).to.not.throw();
        expect(op.err).to.not.be.null;
    });
    it("Operate should catch errors if patch generation produces ill-formed code. Error flag should be set.", function () {
        let op = new base.MutationOperator("console.log(\"Hello Test\");", 1);
        op._generate_patch = function() { return "ill-formed JavaScript"; };
        expect(op.operate.bind(op)).to.not.throw();
        expect(op.err).to.not.be.null;
    });
    it("Buggy line test should return true.", function () {
        let buggy_line = 1;
        let op = new base.MutationOperator("let a = 1;\nlet obj = new Obj();\nconst str = \"text\"\n", buggy_line);
        let metadata = {
            start: {line: buggy_line},
            end: {line: buggy_line}
        };

        expect(op.is_buggy_line.bind(op, metadata)).to.not.throw();
        expect(op.err).to.be.null;
        expect(op.is_buggy_line(metadata)).to.be.true;
    });
    it("Buggy line test should return false, if the buggy code does not end on the same line.", function () {
        let buggy_line = 1;
        let op = new base.MutationOperator("let a = 1;\nlet obj = new Obj();\nconst str = \"text\"\n", buggy_line);
        let metadata = {
            start: {line: buggy_line},
            end: {line: buggy_line + 1}
        };

        expect(op.is_buggy_line.bind(op, metadata)).to.not.throw();
        expect(op.err).to.be.null;
        expect(op.is_buggy_line(metadata)).to.not.be.true;
    });
    it("Buggy line test should return true, even if the buggy code does not end on the same line.", function () {
        let buggy_line = 1;
        let op = new base.MutationOperator("let a = 1;\nlet obj = new Obj();\nconst str = \"text\"\n", buggy_line);
        let metadata = {
            start: {line: buggy_line},
            end: {line: buggy_line + 1}
        };

        expect(op.is_buggy_line.bind(op, metadata, false)).to.not.throw();
        expect(op.err).to.be.null;
        expect(op.is_buggy_line(metadata, false)).to.be.true;
    });
    it("Buggy line test should return false, if buggy code is not in the specified line.", function () {
        let buggy_line = 1;
        let op = new base.MutationOperator("let a = 1;\nlet obj = new Obj();\nconst str = \"text\"\n", buggy_line);
        let metadata = {
            start: {line: buggy_line + 1},
            end: {line: buggy_line + 1}
        };

        expect(op.is_buggy_line.bind(op, metadata)).to.not.throw();
        expect(op.err).to.be.null;
        expect(op.is_buggy_line(metadata)).to.be.false;
    });
    it("Generated code and input code should be the same.", function () {
        let buggy_line = 1;
        const program = "let a = 1;\nlet obj = new Obj();\nconst str = \"text\"\n";
        let op = new base.MutationOperator(program, buggy_line);
        op.operate();

        expect(op.code).to.satisfy(function(code) {
            return code === program;
        });
    });
    it("Should return AST unchanged.", function () {
        let op = new base.MutationOperator("console.log(\"Hello Test\");", 1);
        const inner_ast = op._ast;
        const property_ast = op.ast;

        expect(inner_ast === property_ast).to.be.true;
    });
});
