// TODO: update test file

//const expect = require('chai').expect;
//const should = require('chai').should();
//
//const esprima = require("esprima");
//const op = require('../../bin/src/operators/ConditionalTypeChangerOperator');
//const msg = require('../message');
//
//
//describe(msg.message(op.ConditionalTypeChangerOperator), function () {
//    let nodes = [];
//    function visitor(node, metadata) { if (node.type === esprima.Syntax.BinaryExpression) nodes.push(node); }
//    
//    const program_v1 = "let binexpr = 13 && 14;\nbinexpr = binexpr | 15, binexpr = \"not\" + \"stored\";\nconsole.log(\"Hidden Message: \" + binexpr);\n";
//    const ast = esprima.parseModule(program_v1, null, visitor);
//
//
//    for (let i = 1; i <= 10; ++i) {
//        it("Should replace binary expression in the code, with another one: Round " + i + ".", function () {
//            let mocking = new op.ConditionalTypeChangerOperator(program_v1, 2);
//            mocking.operate();
//
//            let oop_index = program_v1.indexOf('|');
//            let code = mocking.code;
//            expect(op.mutations).to.contain(code.substring(oop_index, code.indexOf(' ', oop_index)));
//        });
//    }
//
//    it("Should return original code if error flag is set.", function () {
//        let mocking = new op.ConditionalTypeChangerOperator(program_v1, 2);
//        mocking._err = Error("Error flag.");
//
//        let code = mocking._generate_patch();
//        expect(code).to.equal(program_v1);
//    });
//
//    it("Should return original code if inner array is empty.", function () {
//        let mocking = new op.ConditionalTypeChangerOperator(program_v1, 2);
//        mocking._binaries = [];
//        mocking._binaries_meta = [];
//
//        let code = mocking._generate_patch();
//        expect(code).to.equal(program_v1);
//    });
//});