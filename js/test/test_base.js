const expect = require('chai').expect;
const should = require('chai').should();

const base = require('../bin/src/operators/base/BaseOperator');
const msg = require('./message');


describe(msg.message(base.BaseOperator), function () {
    let code = 'let my_test = "42";\n\
    let my_res = Number(my_test);\n\
    \n\
    ___ORIGIN___:if (!isNaN(my_res))\n\
    if (isNaN(my_res))\n\
        console.log("is a number");\n\
    else\n\
        console.log("is not a number");\n';
    
    let preprocessed_code_rem = 'let my_test = "42";\n\
    let my_res = Number(my_test);\n\
    \n\
    if (isNaN(my_res))\n\
        console.log("is a number");\n\
    else\n\
        console.log("is not a number");\n';

    let preprocessed_code_rep = 'let my_test = "42";\n\
    let my_res = Number(my_test);\n\
    \n\
    if (!isNaN(my_res))\n\
        console.log("is a number");\n\
    else\n\
        console.log("is not a number");\n';


    it("Should remove old code from passed, not yet preprocessed code.", function () {
        let new_code = base.BaseOperator.preprocess(code);
        expect(preprocessed_code_rem).to.equal(new_code);
    });

    it("Should replace the line after the '___ORIGIN___:' sign, with the code found inside it.", function () {
        let new_code = base.BaseOperator.preprocess(code, base.PreprocessOpt.replace);
        expect(preprocessed_code_rep).to.equal(new_code);
    });
});
