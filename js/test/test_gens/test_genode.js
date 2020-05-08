const expect = require('chai').expect;
const should = require('chai').should();

const lodash = require("lodash");
const esprima = require('esprima');
const Genode_initializer = require("../../bin/src/operators/gens/genode/genode")._initGenode
const Genode = require("../../bin/src/operators/gens/genode/genode")._Genode
const msg = require('../message');


describe(msg.message(Genode_initializer), function () {
    it("Should initialize a Genode object.", function () {
        let type = "mytype";
        let obj = Genode_initializer(type);

        expect(obj instanceof Genode).to.be.true;
        expect(obj._types).to.equal(type);
    });
});


describe(msg.message(Genode), function () {
    let nodes = [];
    function visitor(node, metadata) { if (node.type !== esprima.Syntax.Program) nodes.push(node); }

    const program_v1 = "let mycode = \"this is valid js code\";\nlet life = 42;\n";
    const program_v2 = "let mycode = 42;\nlet life = \"this is valid js code\";\n";
    const ast_v1 = esprima.parseScript(program_v1, null, visitor);
    const ast_v2 = esprima.parseScript(program_v2, null, visitor);
    const types = ["Literal"];
    
    
    it("Should throw if empty or no array passed.", function () {
        let obj = new Genode(types);

        expect(() => obj.using()).to.throw(Error);
        expect(() => obj.using([])).to.throw(RangeError);
    });

    it("Should throw if empty or no array passed.", function () {
        let obj = new Genode(types);

        expect(() => obj.using()).to.throw(Error);
        expect(() => obj.using([])).to.throw(RangeError);
    });

    it("Should not throw, even if initialized with empty constructor.", function () {
        expect(() => new Genode()).to.not.throw();
    });

    it("Should set inner class' parent to the parent class' reference.", function () {
        let obj = new Genode(types);

        expect(obj._types).to.be.equal(types);
        expect(obj._sim._parent).to.equal(obj);
    });

    for (let i = 1; i <= 10; ++i) {
        it("Should include resulting node: Round " + i + ".", function () {
            let obj = new Genode(types);
            
            let result = obj.using(nodes);

            expect(function () {
                for (let i = 0; i < nodes.length; ++i) {
                    if (lodash.isEqual(nodes[i], result)) {
                        return true;
                    }
                }
                return false;
            }()).to.be.true;


            obj = new Genode();
            
            result = obj.using(nodes);

            expect(function () {
                for (let i = 0; i < nodes.length; ++i) {
                    if (lodash.isEqual(nodes[i], result)) {
                        return true;
                    }
                }
                return false;
            }()).to.be.true;
        });
    }

    it("Should return undefined result.", function () {
        let obj = new Genode();
        let sim = obj._sim;
        expect(sim.prototype.using()).to.be.undefined;
    });
});
