const expect = require('chai').expect;
const should = require('chai').should();

const lodash = require('lodash');
const esprima = require('esprima');
const op = require('../../bin/src/operators/CallChangerOperator');
const msg = require('../message');

const iter = 20;

describe(msg.message(op.CallChangerOperator), function () {
    let nodes, program;
    let nodes_v1 = [], nodes_v2 = [], nodes_v3 = [];
    function visitor(node, metadata) { if (node.type !== esprima.Syntax.Program) nodes.push(node); }

    const program_v1 = "let repl1 = -5, repl2 = \"literal\", repl3 = 42;\nfunction_call(param1, param2);\nconsole.log(member.property);\n";
    const program_v2 = "let repl1 = -5, repl2 = \"literal\", repl3 = 42;\nfunction_call(param1);\nconsole.log(member.property);\n";
    const program_v3 = "let repl1 = -5, repl2 = \"literal\", repl3 = 42;\nfunction_call();\nconsole.log(member.property);\n";
    
    program = program_v1;
    nodes = nodes_v1;
    esprima.parseModule(program, null, visitor);

    program = program_v2;
    nodes = nodes_v2;
    esprima.parseModule(program, null, visitor);

    program = program_v3;
    nodes = nodes_v3;
    esprima.parseModule(program, null, visitor);


    for (let i = 1; i <= iter; ++i) {
        it("Should change calls, either add, remove or change a parameter passed to function (argc: 2): Round " + i + ".", function () {
            let mocking = new op.CallChangerOperator(program_v1, 2);
            mocking.operate();
            expect(mocking.err).to.be.null;

            let generated_args;

            function post_visitor(node, metadata) { if (node.callee && node.callee.name === "function_call") generated_args = node.arguments; }
            let next_ast = esprima.parseScript(mocking.code, null, post_visitor);

            expect(generated_args.length).to.be.within(1, 3);
            expect(function() {
                for (let i = 0; i < generated_args.length; ++i) {
                    let find = lodash.find(nodes_v1, generated_args[i]);
                    if (find === undefined)
                        return false;
                } return true;
            }()).to.be.true;
        });
    }
    
    for (let i = 1; i <= iter; ++i) {
        it("Should change calls, either add, remove or change a parameter passed to function (argc: 1): Round " + i + ".", function () {
            let mocking = new op.CallChangerOperator(program_v2, 2);
            mocking.operate();
            expect(mocking.err).to.be.null;

            let generated_args;

            function post_visitor(node, metadata) { if (node.callee && node.callee.name === "function_call") generated_args = node.arguments; }
            let next_ast = esprima.parseScript(mocking.code, null, post_visitor);

            expect(generated_args.length).to.be.within(0, 2);
            expect(function() {
                for (let i = 0; i < generated_args.length; ++i) {
                    let find = lodash.find(nodes_v2, generated_args[i]);
                    if (find === undefined)
                        return false;
                } return true;
            }()).to.be.true;
        });
    }

    program = program_v3;
    nodes = nodes_v3;
    for (let i = 1; i <= iter; ++i) {
        it("Should change calls, either add, remove or change a parameter passed to function (argc: 0): Round " + i + ".", function () {
            let mocking = new op.CallChangerOperator(program_v3, 2);
            mocking.operate();
            expect(mocking.err).to.be.null;

            let generated_args;

            function post_visitor(node, metadata) { if (node.callee && node.callee.name === "function_call") generated_args = node.arguments; }
            let next_ast = esprima.parseScript(mocking.code, null, post_visitor);

            expect(generated_args.length).to.be.within(0, 1);
            expect(function() {
                for (let i = 0; i < generated_args.length; ++i) {
                    let find = lodash.find(nodes_v3, generated_args[i]);
                    if (find === undefined)
                        return false;
                } return true;
            }()).to.be.true;
        });
    }

    for (let i = 1; i <= iter; ++i) {
        it("Should change calls, either add, remove or change a parameter passed to function (excluding member calls): Round " + i + ".", function () {
            op.CallChangerOperator._config.exclude_member_calls = true;
            let mocking = new op.CallChangerOperator(program_v1, 2);
            mocking.operate();
            expect(mocking.err).to.be.null;

            let generated_args;

            function post_visitor(node, metadata) { if (node.callee && node.callee.name === "function_call") generated_args = node.arguments; }
            let next_ast = esprima.parseScript(mocking.code, null, post_visitor);
            
            expect(generated_args.length).to.be.within(1, 3);
            expect(function() {
                for (let i = 0; i < generated_args.length; ++i) {
                    let find = lodash.find(nodes_v1, generated_args[i]);
                    if (find === undefined)
                        return false;
                } return true;
            }()).to.be.true;
        });
    }

    it("Should return original code if error flag is set.", function () {
        let mocking = new op.CallChangerOperator(program_v1, 2);
        mocking._err = Error("Error flag.");

        let code = mocking._generate_patch();
        expect(code).to.equal(program_v1);
    });

    it("Should return original code if inner array is empty.", function () {
        let mocking = new op.CallChangerOperator(program_v1, 2);
        mocking._calls = [];
        mocking._calls_meta = [];

        let code = mocking._generate_patch();
        expect(code).to.equal(program_v1);

        mocking._calls = ["Not empty."];
        mocking._calls_meta = ["Not empty"];
        mocking._idents = [];
        mocking._idents_meta = [];
        mocking._members = [];
        mocking._members_meta = [];

        code = mocking._generate_patch();
        expect(code).to.equal(program_v1);
    });
});