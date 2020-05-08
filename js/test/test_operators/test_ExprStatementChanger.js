const expect = require('chai').expect;
const should = require('chai').should();

const op = require('../../bin/src/operators/ExprStatementChangerOperator');
const msg = require('../message');


test_iter = 20
describe(msg.message(op.ExprStatementChangerOperator), function () {

    const programs1 = [
        "n1 + n2;\nn3 + n4; n4 * n5;\n\nIGNORE && THIS;\n",

        "n3 + n4;\nn3 + n4; n4 * n5;\n\nIGNORE && THIS;\n",
        "n4 * n5;\nn3 + n4; n4 * n5;\n\nIGNORE && THIS;\n"
    ];

    const programs2 = [
        "n1 + n2;\nn3 + n4; n4 * n5;\n\nIGNORE && THIS;\n",

        "n1 + n2;\nn1 + n2; n4 * n5;\n\nIGNORE && THIS;\n",
        "n1 + n2;\nn3 + n4; n1 + n2;\n\nIGNORE && THIS;\n",
        "n1 + n2;\nn3 + n4; n3 + n4;\n\nIGNORE && THIS;\n",
        "n1 + n2;\nn4 * n5; n4 * n5;\n\nIGNORE && THIS;\n"
    ];

    for (let i = 1; i <= test_iter; ++i) {
        it("Should replace an ExpressionStatement with a similar one, found in code: Round " + i + ".", function () {
            let mocking = new op.ExprStatementChangerOperator(programs1[0], 1);
            mocking.operate();

            let code = mocking.code;

            expect(programs1).to.contain(code);

            mocking = new op.ExprStatementChangerOperator(programs2[0], 2);
            mocking.operate();

            code = mocking.code;

            expect(programs2).to.contain(code);
        });
    }

    it("Should leave program alone if, no expressions found in specified line.", function () {
        let mocking = new op.ExprStatementChangerOperator(programs1[0], 3);
        let code = mocking._generate_patch();

        expect(code).to.be.equal(programs1[0]);
    });

    it("Should return original code if error flag is set.", function () {
        let mocking = new op.ExprStatementChangerOperator(programs2[0], 2);
        mocking._err = Error("flag");

        let code = mocking._generate_patch();

        expect(code).to.be.equal(programs2[0]);
    });

    it("Should leave code alone if no similar ExpressionStatements found in code.", function () {
        let mocking = new op.ExprStatementChangerOperator(programs1[0], 4);

        mocking.operate()
        let code = mocking.code

        expect(code).to.be.equal(programs1[0]);
    });
});