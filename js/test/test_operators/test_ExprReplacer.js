const expect = require('chai').expect;
const should = require('chai').should();

const esprima = require('esprima');
const op = require('../../bin/src/operators/ExprReplacerOperator');
const msg = require('../message');


const test_iter = 20;
describe(msg.message(op.ExprReplacerOperator), function () {

    const programs1 = [
        "cls.prop + 5;\ncls.prop = obj.mem * 10;\n",
        "cls.prop + 5;\ncls.prop = obj.mem + 5;\n",
        "cls.prop + 5;\ncls.prop = cls.prop * 10;\n",
        "cls.prop + 5;\ncls.prop = cls.prop + 5;\n",
        "cls.prop + 5;\nobj.mem = obj.mem + 5;\n",
        "cls.prop + 5;\nobj.mem = obj.mem * 10;\n",
        "cls.prop + 5;\nobj.mem = cls.prop + 5;\n",
        "cls.prop + 5;\nobj.mem = cls.prop * 5;\n"
    ];
    const programs2 = [
        "cls.prop = 5;\ncls.prop = 10;\n",
        "cls.prop = 5;\ncls.prop = 5;\n"
    ];
    const programs3 = [
        "cls.prop = 5;\ncls.prop = 10;\ncls.prop = 15;\ncls.prop = 20;\n\ncls.prop = 25;\n"
    ];

    for (let i = 1; i <= test_iter; ++i) {
        it("Should replace one of the expr. statements found in code: Round " + i + ".", function () {
            let mocking = new op.ExprReplacerOperator(programs1[0], 2);
            mocking.operate();

            let code = mocking.code;

            expect(programs1).to.contain(code);
        });
    }

    for (let i = 1; i <= test_iter; ++i) {
        it("Should replace assignment in code.", function () {
            let mocking = new op.ExprReplacerOperator(programs2[0], 2);
            mocking.operate();

            let code = mocking.code;

            expect(programs2).to.contain(code);
        });
    }

    it("Should leave program alone if, no expressions found in specified line.", function () {
        let mocking = new op.ExprReplacerOperator(programs3[0], 5);

        mocking.operate()
        let code = mocking.code;

        expect(code).to.be.equal(programs3[0]);
    });

    it("Should return original code if error flag is set.", function () {
        let mocking = new op.ExprReplacerOperator(programs1[0], 1);
        mocking._err = Error("flag");

        let code = mocking._generate_patch();

        expect(code).to.be.equal(programs1[0]);
    });

    it("Should leave code alone since configuration excludes all expression types found in code.", function () {
        let mocking = new op.ExprReplacerOperator(programs3[0], 2);
        op.ExprReplacerOperator._exclude = [esprima.Syntax.AssignmentExpression]
        mocking.operate();

        let code = mocking.code;

        expect(code).to.be.equal(programs3[0])
    });
});