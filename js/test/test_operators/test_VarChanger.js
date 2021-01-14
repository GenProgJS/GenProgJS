const expect = require('chai').expect;
const should = require('chai').should();

const op = require('../../bin/src/operators/VarChangerOperator');
const msg = require('../message');


test_iter = 5
describe(msg.message(op.VarChangerOperator), function () {

    const programs1 = [
        "myvar1 = 5;\n\nmyvar2 = myvar1 * 3;\n1+2;\nobj.call()\n",

        "myvar1 = 5;\n\nmyvar1 = myvar1 * 3;\n1+2;\nobj.call()\n",
        "myvar1 = 5;\n\nmyvar2 = myvar2 * 3;\n1+2;\nobj.call()\n"
    ];

    for (let i = 1; i <= test_iter; ++i) {
        it("Should replace one of the variables found in code: Round " + i + ".", function () {
            let mocking = new op.VarChangerOperator(programs1[0], 3);
            mocking.operate();

            let code = mocking.code;

            expect(programs1).to.contain(code);
        });
    }

    it("Should leave program alone if, no variables found in specified line.", function () {
        let mocking = new op.VarChangerOperator(programs1[0], 4);

        mocking.operate()
        let code = mocking.code;

        expect(code).to.be.equal(programs1[0]);
    });

    it("Should return original code if error flag is set.", function () {
        let mocking = new op.VarChangerOperator(programs1[0], 1);
        mocking._err = Error("flag");

        let code = mocking._generate_patch();

        expect(code).to.be.equal(programs1[0]);
    });
});
