const expect = require('chai').expect;
const should = require('chai').should();

const extractor = require('../../bin/src/operators/gens/extractor/extractor')._extractor;
const extract_initializer = require('../../bin/src/operators/gens/extractor/extractor')._extract;
const callback_func = require('../../bin/src/operators/gens/extractor/extractor')._type_filter_callback;
const msg = require('../message');


describe(msg.message(extract_initializer), function () {

    it("Should initialize an extractor object.", function () {
        let type = "mytype";
        let obj = extract_initializer(type);

        expect(obj instanceof extractor).to.be.true;
        expect(obj._types).to.be.an('array').that.deep.equals([type]);
    });
});

describe(msg.message(extractor), function () {
    
    it("Should not throw on construct even if types are undefined.", function () {
        expect(() => new extractor).to.not.throw();
    });

    it("Should not throw types are defined.", function () {
        expect(() => new extractor("defined")).to.not.throw();
    });

    it("Should return empty array if passed nodes are not Objects.", function () {
        let mocking = new extractor("...");
        expect(mocking.from("not an object")).to.be.an('array').that.is.empty;
    });

    it("Private _deep visit method should do nothing if passed object is of type Object.", function () {
        let result = [];
        expect(() => extractor.prototype._deep_visit(new Object(), result)).to.not.throw();
        expect(result).to.be.an('array').that.is.empty;
    });

    it("Should return every nested object in the passed array, if its type property matches with one of the given types.", function () {
        const test_objects = [{ type: "T0"}, { type: "T1"}, { type: "T2"}, { type: "T0"}, { type: "T1"}]
        const expected_objects = [test_objects[0], test_objects[1], test_objects[3], test_objects[4]];

        let mocking = new extractor(["T0", "T1"]);
        let result;
        expect(result = mocking.from(test_objects)).to.be.an('array').that.is.deep.equal(expected_objects).that.have.lengthOf(expected_objects.length);
        expect(retval = function () {
            all_true = true;

            for (let i = 0; i < expected_objects.length; ++i) {
                if (result[i] !== expected_objects[i]) {
                    all_true = false;
                    break;
                }
            }

            return all_true;
        }()).to.be.true;
    });

    it("Should return every nested object in the passed array.", function () {
        const test_objects = [{ type: "T0"}, { type: "T1"}, { type: "T2"}, { type: "T0"}, { type: "T1"}]
        const expected_objects = [test_objects[0], test_objects[1], test_objects[2], test_objects[3], test_objects[4]];

        let mocking = new extractor();
        let result;
        expect(result = mocking.from(test_objects)).to.be.an('array').that.is.deep.equal(expected_objects).that.have.lengthOf(expected_objects.length);
        expect(retval = function () {
            all_true = true;

            for (let i = 0; i < expected_objects.length; ++i) {
                if (result[i] !== expected_objects[i]) {
                    all_true = false;
                    break;
                }
            }

            return all_true;
        }()).to.be.true;
    });
});


describe(msg.message(callback_func), function () {
    const test_objects = [
        { type: '0' }, { type: '1' }, { type: '2' }, { type: '0' }, { type: '0' }, { type: '1' }
    ];
    const test_filter_t1 = ['1', '2'];
    const expected_objects1 = [
        { type: '1' }, { type: '2' }, { type: '1' }
    ];
    const test_filter_t2 = '0';
    const expected_objects2 = [
        { type: '0' }, { type: '0' }, { type: '0' }
    ];

    it("Should filter every unspecified type in the passed array, and return a new one. (array like types)", function () {
        let output = callback_func(test_objects, test_filter_t1);

        expect(output).to.be.an('array').that.deep.equal(expected_objects1).that.have.lengthOf(expected_objects1.length);
    });

    it("Should filter every unspecified type in the passed array, and return a new one. (single type)", function () {
        let output = callback_func(test_objects, test_filter_t2);

        expect(output).to.be.an('array').that.deep.equal(expected_objects2).that.have.lengthOf(expected_objects2.length);
    });
});