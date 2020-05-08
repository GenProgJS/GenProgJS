const expect = require('chai').expect;
const should = require('chai').should();

const rnd = require('../bin/src/random/rand');
const msg = require('./message');


describe(msg.message(rnd.Rand), function () {
    it("Random range should return integer between 4 and 10, only including 4.", function () {
        const random = rnd.Rand.range(4, 10);
        expect(Number.isInteger(random)).to.be.true;
        expect(random >= 4 && random < 10).to.be.true;
    });
    it("Random range should return number between 15 and 19, only including 15.", function () {
        const random = rnd.Rand.range(15, 19, false);
        expect(isNaN(random)).to.be.false;
        expect(random >= 15 && random < 19).to.be.true;
    });
    it("Random range should return number between 666 and 555 (reversed), only including 666.", function () {
        const random = rnd.Rand.range(666, 555, false);
        expect(isNaN(random)).to.be.false;
        expect(random > 555 && random <= 666).to.be.true;
    });
    it("Random range should return integer between 0 and 101, only including 0.", function () {
        const random = rnd.Rand.range(101);
        expect(Number.isInteger(random)).to.be.true;
        expect(random >= 0 && random < 101).to.be.true;
    });
});
