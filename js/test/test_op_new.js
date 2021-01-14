const expect = require('chai').expect;
const should = require('chai').should();

const ops = require("../bin/src/operators/info/ops").ops;
const ops_t = require("../bin/src/operators/info/ops.json").operators;
const Base = require("../bin/src/operators/base/BaseOperator").BaseOperator;
const msg = require('./message');


describe("Testing operator instantiation.", function () {

    context("Creating " + Object.keys(ops).length + " operators:", function () {
        let i = 0;

        for (let op in ops) { 
            it("Should create a valid " + op + " object.", function () {
                let test_op_cls = ops(op);
    
                let test_op_obj;
                expect(test_op_obj = new test_op_cls()).to.not.throw;
                expect(test_op_obj instanceof Base).to.be.true;
                ++i;
            });
        }

        after(function () {
            expect(i === Object.keys(ops).length).to.be.true;
        });
    });
});
