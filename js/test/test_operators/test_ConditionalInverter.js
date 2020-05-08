const expect = require('chai').expect;
const should = require('chai').should();

const op = require('../../bin/src/operators/ConditionalInverterOperator');
const msg = require('../message');


describe(msg.message(op.ConditionalInverterOperator), function () {
    const test_prog1 =
        "if (!trust(agent) && is_the_one(Neo)) {\n" +
        "    return Neo.save.world;\n" +
        "}\n";
    const expected_prog1 =
        "if (!(!trust(agent) && is_the_one(Neo))) {\n" +
        "    return Neo.save.world;\n" +
        "}\n";
    const test_prog2 = expected_prog1;
    const expected_prog2 = test_prog1;

    const test_prog3 =
        "if (!(!(!trust(agent) && !trust(Smith)) || is_stronger(agent)) && is_the_one(Neo)) {\n" +
        "    return Neo.save.world;\n" +
        "}\n";
    const expected_prog3 =
        "if (!(!(!(!trust(agent) && !trust(Smith)) || is_stronger(agent)) && is_the_one(Neo))) {\n" +
        "    return Neo.save.world;\n" +
        "}\n";


    it("Should invert whole conditional statement.", function () {
        let mocking = new op.ConditionalInverterOperator(test_prog1, 1);
        mocking.operate();
        expect(mocking.code).to.satisfy(function (code) {
            return code === expected_prog1;
        });

        expect(mocking._conditionals).to.be.an('array').that.have.lengthOf(1);
        expect(mocking._conditionals_meta).to.be.an('array').that.have.lengthOf(1);
        expect(mocking._test_range).to.be.an('array').that.have.lengthOf(1);
    });
    it("Should invert whole conditional statement, while removing redundant inversions.", function () {
        let mocking = new op.ConditionalInverterOperator(test_prog2, 1);
        mocking.operate();
        expect(mocking.code).to.satisfy(function (code) {
            return code === expected_prog2;
        });

        expect(mocking._conditionals).to.be.an('array').that.have.lengthOf(1);
        expect(mocking._conditionals_meta).to.be.an('array').that.have.lengthOf(1);
        expect(mocking._test_range).to.be.an('array').that.have.lengthOf(1);
    });
    it("Should invert whole conditional statement, while leaving the seemingly redundant inversions.", function () {
        let mocking = new op.ConditionalInverterOperator(test_prog3, 1);
        mocking.operate();
        expect(mocking.code).to.satisfy(function (code) {
            return code === expected_prog3;
        });

        expect(mocking._conditionals).to.be.an('array').that.have.lengthOf(1);
        expect(mocking._conditionals_meta).to.be.an('array').that.have.lengthOf(1);
        expect(mocking._test_range).to.be.an('array').that.have.lengthOf(1);
    });
    it("Should leave the code alone, since there are no conditions on the specified line.", function () {
        let mocking = new op.ConditionalInverterOperator(test_prog1, 2);
        mocking.operate();
        expect(mocking.code).to.satisfy(function (code) {
            return code === test_prog1;
        });

        expect(mocking._conditionals).to.be.an('array').that.have.lengthOf(0);
        expect(mocking._conditionals_meta).to.be.an('array').that.have.lengthOf(0);
        expect(mocking._test_range).to.be.an('array').that.have.lengthOf(0);
    });
    it("Should leave the code alone, it is not a valid JS code.", function () {
        let mocking = new op.ConditionalInverterOperator("Not valid java script code.\n", 1);
        let result_code = mocking._generate_patch();
        expect(result_code).to.equal("Not valid java script code.\n");
    });
});

