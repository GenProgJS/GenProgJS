const expect = require('chai').expect;
const should = require('chai').should();
const esprima = require('esprima');

const filters = require('../bin/src/operators/filters/filters');
const msg = require('./message');


describe(msg.message(filters.filter_duplicate_numerics), function () {
    const test_nodes = [
        { type: esprima.Syntax.Literal, value: 5, raw: "5" },
        { type: esprima.Syntax.Literal, value: 18, raw: "18" },
        { type: esprima.Syntax.Literal, value: 666, raw: "666" },
        { type: esprima.Syntax.UnaryExpression, operator: '-', prefix: true, argument: "18" },
        { type: esprima.Syntax.UnaryExpression, operator: '-', prefix: true, argument: "666" }
    ];
    const test_metadata = [
        { start: {offset: 10}, end: {offset: 11} },
        { start: {offset: 33}, end: {offset: 35} },
        { start: {offset: 51}, end: {offset: 54} },
        { start: {offset: 32}, end: {offset: 35} },
        { start: {offset: 50}, end: {offset: 54} }
    ];
    const expected_nodes = [
        { type: esprima.Syntax.Literal, value: 5, raw: "5" },
        { type: esprima.Syntax.UnaryExpression, operator: '-', prefix: true, argument: "18" },
        { type: esprima.Syntax.UnaryExpression, operator: '-', prefix: true, argument: "666" }
    ];
    const expected_metadata = [
        { start: {offset: 10}, end: {offset: 11} },
        { start: {offset: 32}, end: {offset: 35} },
        { start: {offset: 50}, end: {offset: 54} }
    ];

    let nodes, metadata;
    it("Should filter duplicate numeric elements from nodes", function () {
        [nodes, metadata] = filters.filter_duplicate_numerics(test_nodes, test_metadata);

        expect(nodes).to.be.an("array").that.have.lengthOf(expected_nodes.length);
        expect(metadata).to.be.an("array").that.have.lengthOf(expected_metadata.length);
        expect(nodes).to.deep.equal(expected_nodes);
        expect(metadata).to.deep.equal(expected_metadata);
    });

    it("Should return empty arrays, if undefined arrays passed as arguments.", function () {
        [nodes, metadata] = filters.filter_duplicate_numerics();

        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should return empty arrays, if empty arrays passed as arguments.", function () {
        [nodes, metadata] = filters.filter_duplicate_numerics([], []);

        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });
});


describe(msg.message(filters.filter_lower_orders), function () {
    const test_nodes = [
        { type: esprima.Syntax.FunctionDeclaration },
        { type: esprima.Syntax.BlockStatement },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.Identifier },

        { type: esprima.Syntax.VariableDeclaration },
        { type: esprima.Syntax.AssignmentExpression },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.BinaryExpression },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.Literal }
    ];
    const test_metadata = [
        { start: {offset: 0}, end: {offset: 115} },
        { start: {offset: 27}, end: {offset: 115} },
        { start: {offset: 16}, end: {offset: 18} },
        { start: {offset: 20}, end: {offset: 25} },

        { start: {offset: 115 + 40}, end: {offset: 115 + 78} },
        { start: {offset: 115 + 45}, end: {offset: 115 + 78} },
        { start: {offset: 115 + 45}, end: {offset: 115 + 51} },
        { start: {offset: 115 + 53}, end: {offset: 115 + 78} },
        { start: {offset: 115 + 53}, end: {offset: 115 + 66} },
        { start: {offset: 115 + 68}, end: {offset: 115 + 78} }
    ];

    const expected_nodes = [
        { type: esprima.Syntax.FunctionDeclaration },

        { type: esprima.Syntax.VariableDeclaration }
    ];
    const expected_metadata = [
        { start: {offset: 0}, end: {offset: 115} },

        { start: {offset: 115 + 40}, end: {offset: 115 + 78} }
    ];


    let nodes, metadata;
    it("Should remove a node if it is already present in the list, " +
            "within another node, that contains it.", function () {
        [nodes, metadata] = filters.filter_lower_orders(test_nodes, test_metadata);

        expect(nodes).to.be.an("array").that.have.lengthOf(expected_nodes.length);
        expect(metadata).to.be.an("array").that.have.lengthOf(expected_metadata.length);
        expect(nodes).to.deep.equal(expected_nodes);
        expect(metadata).to.deep.equal(expected_metadata);
    });

    it("Should return empty arrays, if undefined arrays passed as arguments.", function () {
        [nodes, metadata] = filters.filter_lower_orders();

        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should return empty arrays, if empty arrays passed as arguments.", function () {
        [nodes, metadata] = filters.filter_lower_orders([], []);

        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });
});


describe(msg.message(filters.filter_by_offset), function () {
    const test_nodes = [
        { type: esprima.Syntax.FunctionDeclaration },
        { type: esprima.Syntax.BlockStatement },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.Identifier },

        { type: esprima.Syntax.VariableDeclaration },
        { type: esprima.Syntax.AssignmentExpression },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.BinaryExpression },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.Literal }
    ];
    const test_metadata = [
        { start: {offset: 0}, end: {offset: 115} },
        { start: {offset: 27}, end: {offset: 114} },
        { start: {offset: 16}, end: {offset: 18} },
        { start: {offset: 20}, end: {offset: 25} },

        { start: {offset: 125 + 40}, end: {offset: 125 + 98} },
        { start: {offset: 125 + 45}, end: {offset: 125 + 98} },
        { start: {offset: 125 + 45}, end: {offset: 125 + 51} },
        { start: {offset: 125 + 53}, end: {offset: 125 + 95} },
        { start: {offset: 125 + 95}, end: {offset: 125 + 97} },
        { start: {offset: 125 + 96}, end: {offset: 125 + 98} }
    ];

    const expected_nodes = [
        { type: esprima.Syntax.VariableDeclaration },
        { type: esprima.Syntax.AssignmentExpression },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.BinaryExpression },
        { type: esprima.Syntax.Identifier }
    ];
    const expected_metadata = [
        { start: {offset: 125 + 40}, end: {offset: 125 + 98} },
        { start: {offset: 125 + 45}, end: {offset: 125 + 98} },
        { start: {offset: 125 + 45}, end: {offset: 125 + 51} },
        { start: {offset: 125 + 53}, end: {offset: 125 + 95} },
        { start: {offset: 125 + 95}, end: {offset: 125 + 97} }
    ];

    const expected_nodes_left = [
        { type: esprima.Syntax.FunctionDeclaration },
        { type: esprima.Syntax.BlockStatement },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.Identifier },

        { type: esprima.Syntax.VariableDeclaration },
        { type: esprima.Syntax.AssignmentExpression },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.BinaryExpression },
        { type: esprima.Syntax.Identifier }
    ];
    const expected_metadata_left = [
        { start: {offset: 0}, end: {offset: 115} },
        { start: {offset: 27}, end: {offset: 114} },
        { start: {offset: 16}, end: {offset: 18} },
        { start: {offset: 20}, end: {offset: 25} },

        { start: {offset: 125 + 40}, end: {offset: 125 + 98} },
        { start: {offset: 125 + 45}, end: {offset: 125 + 98} },
        { start: {offset: 125 + 45}, end: {offset: 125 + 51} },
        { start: {offset: 125 + 53}, end: {offset: 125 + 95} },
        { start: {offset: 125 + 95}, end: {offset: 125 + 97} }
    ];

    const expected_nodes_right = [
        { type: esprima.Syntax.VariableDeclaration },
        { type: esprima.Syntax.AssignmentExpression },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.BinaryExpression },
        { type: esprima.Syntax.Identifier },
        { type: esprima.Syntax.Literal }
    ];
    const expected_metadata_right = [
        { start: {offset: 125 + 40}, end: {offset: 125 + 98} },
        { start: {offset: 125 + 45}, end: {offset: 125 + 98} },
        { start: {offset: 125 + 45}, end: {offset: 125 + 51} },
        { start: {offset: 125 + 53}, end: {offset: 125 + 95} },
        { start: {offset: 125 + 95}, end: {offset: 125 + 97} },
        { start: {offset: 125 + 96}, end: {offset: 125 + 98} }
    ];



    let nodes, metadata;
    it("Should filter nodes, which fall outside the specified offsets.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_offset(test_nodes, test_metadata,
            { start: {offset: 125 + 45}, end: {offset: 125 + 98} }, 50, 50)).to.not.throw();

        expect(nodes).to.be.an("array").that.have.lengthOf(expected_nodes.length);
        expect(metadata).to.be.an("array").that.have.lengthOf(expected_metadata.length);
        expect(nodes).to.deep.equal(expected_nodes);
        expect(metadata).to.deep.equal(expected_metadata);
    });

    it("Should leave every node as is.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_offset(test_nodes, test_metadata,
            { start: {offset: 125 + 45}, end: {offset: 125 + 98} })).to.not.throw();

        expect(nodes).to.be.an("array").that.have.lengthOf(test_nodes.length);
        expect(metadata).to.be.an("array").that.have.lengthOf(test_metadata.length);
        expect(nodes).to.deep.equal(test_nodes);
        expect(metadata).to.deep.equal(test_metadata);
    });

    it("Should leave every node as is, to the right.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_offset(test_nodes, test_metadata,
            { start: {offset: 125 + 45}, end: {offset: 125 + 98} }, 50)).to.not.throw();

        expect(nodes).to.be.an("array").that.have.lengthOf(expected_nodes_right.length);
        expect(metadata).to.be.an("array").that.have.lengthOf(expected_metadata_right.length);
        expect(nodes).to.deep.equal(expected_nodes_right);
        expect(metadata).to.deep.equal(expected_metadata_right);
    });

    it("Should leave every node as is, to the left.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_offset(test_nodes, test_metadata,
            { start: {offset: 125 + 45}, end: {offset: 125 + 98} }, undefined, 50)).to.not.throw();

        expect(nodes).to.be.an("array").that.have.lengthOf(expected_nodes_left.length);
        expect(metadata).to.be.an("array").that.have.lengthOf(expected_metadata_left.length);
        expect(nodes).to.deep.equal(expected_nodes_left);
        expect(metadata).to.deep.equal(expected_metadata_left);
    });

    it("Should return empty arrays, if undefined arrays passed as arguments.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_offset()).to.not.throw();

        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should return empty arrays, if empty arrays passed as arguments.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_offset([], [])).to.not.throw();

        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should throw if no reference metadata passed.", function () {
        expect(() => filters.filter_by_offset(test_nodes, test_metadata)).to.throw(TypeError);
    });
});


describe(msg.message(filters.filter_expr_type), function () {
    const test_nodes = [
        { type: esprima.Syntax.AssignmentExpression },
        { type: esprima.Syntax.ArrayExpression },
        { type: esprima.Syntax.BinaryExpression },
        { type: esprima.Syntax.ArrayExpression },
        { expression: { type: esprima.Syntax.CallExpression } },
        { type: esprima.Syntax.CallExpression }
    ];
    const test_metadata = [
        { start: {offset: 0}, end: {offset: 55} },
        { start: {offset: 4}, end: {offset: 6} },
        { start: {offset: 9}, end: {offset: 32} },
        { start: {offset: 15}, end: {offset: 48} },
        { start: {offset: 66}, end: {offset: 70} },
        { start: {offset: 66}, end: {offset: 69} }
    ];

    const expected_expr = [
        { type: esprima.Syntax.ArrayExpression },
        { type: esprima.Syntax.ArrayExpression }
    ];
    const expected_expr_meta = [
        { start: {offset: 4}, end: {offset: 6} },
        { start: {offset: 15}, end: {offset: 48} }
    ];
    const expected_exprment = [
        { expression: { type: esprima.Syntax.CallExpression } },
        { type: esprima.Syntax.CallExpression }
    ];
    const expected_exprment_meta = [
        { start: {offset: 66}, end: {offset: 70} },
        { start: {offset: 66}, end: {offset: 69} }
    ];

    let nodes, metadata;
    it("Should filter for provided expression type", function () {
        expect(() => [nodes, metadata] = filters.filter_expr_type(test_nodes, test_metadata, esprima.Syntax.ArrayExpression)).to.not.throw();

        expect(nodes).to.be.an("array").that.have.lengthOf(2);
        expect(metadata).to.be.an("array").that.have.lengthOf(2);
        expect(nodes).to.deep.equal(expected_expr);
        expect(metadata).to.deep.equal(expected_expr_meta);
    });

    it("Should filter for provided expression statement type, too", function () {
        expect(() => [nodes, metadata] = filters.filter_expr_type(test_nodes, test_metadata, esprima.Syntax.CallExpression)).to.not.throw();

        expect(nodes).to.be.an("array").that.have.lengthOf(2);
        expect(metadata).to.be.an("array").that.have.lengthOf(2);
        expect(nodes).to.deep.equal(expected_exprment);
        expect(metadata).to.deep.equal(expected_exprment_meta);
    });

    it("Should return empty arrays, if undefined arrays passed as arguments.", function () {
        expect(() => [nodes, metadata] = filters.filter_expr_type()).to.not.throw();

        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should return empty arrays, if empty arrays passed as arguments.", function () {
        expect(() => [nodes, metadata] = filters.filter_expr_type([], [])).to.not.throw();

        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should throw type error, if no expr_type provided to filter by.", function () {
        expect(() => filters.filter_expr_type(test_nodes, test_metadata)).to.throw(TypeError);
    });
});


describe(msg.message(filters.remove_brackets), function () {
    const test_str = "(string with brackets)";
    const expected_str = "string with brackets";

    it("Should leave string as is, if it does not contain left and right brackets.", function () {
        expect(filters.remove_brackets(expected_str)).to.equal(expected_str);
    });

    it("Should remove matching left and right brackets.", function () {
        expect(filters.remove_brackets(test_str)).to.equal(expected_str);
    });

    it("Should return null or undefined string.", function () {
        expect(filters.remove_brackets()).to.be.undefined;
        expect(filters.remove_brackets(null)).to.be.null;
    });

    it("Should return empty string if empty string is passed.", function () {
        expect(filters.remove_brackets('')).to.equal('');
        expect(filters.remove_brackets("")).to.equal("");
    });
});


describe(msg.message(filters.filter_by_operator), function () {
    const test_nodes = [
        { operator: "+" }, { operator: "*" }, { operator: "+" },
        { operator: "+" }, { operator: "**" }, { operator: "-" }
    ];
    const test_metadata = [
        0, 1, 2, 3, 4, 5
    ];
    const expected_nodes = [
        { operator: "+" }, { operator: "+" }, { operator: "+" }
    ];
    const expected_metadata = [
        0, 2, 3
    ];


    let nodes, metadata;
    it("Should remove all nodes, " +
        "except for the ones that contain the provided operator.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_operator(test_nodes, test_metadata, "+")).to.not.throw();

        expect(nodes).to.be.lengthOf(expected_nodes.length);
        expect(metadata).to.be.lengthOf(expected_metadata.length);
        expect(nodes).to.deep.equal(expected_nodes);
        expect(metadata).to.deep.equal(expected_metadata);
    });

    it("Should return empty arrays if empty or undefined nodes or metadata passed.",
        function () {
        expect(() => [nodes, metadata] = filters.filter_by_operator()).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;

        expect(() => [nodes, metadata] = filters.filter_by_operator([], [])).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should throw if undefined operator has been passed.", function () {
        expect(() => filters.filter_by_operator(test_nodes, test_metadata)).to.throw(TypeError);
    });
});


describe(msg.message(filters.filter_by_operator_type), function () {
    const test_nodes = [
        { operator: "+" }, { operator: "^" }, { operator: "**" },
        { operator: "-" }, { operator: "|" }, { operator: "-=" }
    ];
    const test_metadata = [
        0, 1, 2, 3, 4, 5
    ];
    const expected_nodes = [
        { operator: "+" }, { operator: "**" }, { operator: "-" }
    ];
    const expected_metadata = [
        0, 2, 3
    ];


    let nodes, metadata;
    it("Should remove all nodes, " +
        "except for the ones that contain the provided operator type.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_operator_type(test_nodes, test_metadata, "/")).to.not.throw();

        expect(nodes).to.be.lengthOf(expected_nodes.length);
        expect(metadata).to.be.lengthOf(expected_metadata.length);
        expect(nodes).to.deep.equal(expected_nodes);
        expect(metadata).to.deep.equal(expected_metadata);
    });

    it("Should return empty arrays if empty or undefined nodes or metadata passed.",
        function () {
        expect(() => [nodes, metadata] = filters.filter_by_operator_type()).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;

        expect(() => [nodes, metadata] = filters.filter_by_operator_type([], [])).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should return empty arrays if unexpected operator type passed.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_operator_type(
            test_nodes, test_metadata, '???')).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should throw if undefined operator type has been passed.", function () {
        expect(() => filters.filter_by_operator_type(test_nodes, test_metadata)).to.throw(TypeError);
    });
});


describe(msg.message(filters.filter_by_computed_member), function () {
    const test_nodes = [
        { computed: true }, { computed: false }, { computed: true },
        { computed: true }, { computed: false }, { computed: false }
    ];
    const test_metadata = [
        0, 1, 2, 3, 4, 5
    ];
    const expected_nodes1 = [
        { computed: true }, { computed: true }, { computed: true }
    ];
    const expected_metadata1 = [
        0, 2, 3
    ];
    const expected_nodes2 = [
        { computed: false }, { computed: false }, { computed: false }
    ];
    const expected_metadata2 = [
        1, 4, 5
    ];


    let nodes, metadata;
    it("Should remove all non-member nodes, " +
        "and filters computed ones.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_computed_member(
            test_nodes, test_metadata, true)).to.not.throw();

        expect(nodes).to.be.lengthOf(expected_nodes1.length);
        expect(metadata).to.be.lengthOf(expected_metadata1.length);
        expect(nodes).to.deep.equal(expected_nodes1);
        expect(metadata).to.deep.equal(expected_metadata1);
    });

    it("Should remove all non-member nodes, " +
        "and filters non-computed ones.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_computed_member(
            test_nodes, test_metadata, false)).to.not.throw();

        expect(nodes).to.be.lengthOf(expected_nodes2.length);
        expect(metadata).to.be.lengthOf(expected_metadata2.length);
        expect(nodes).to.deep.equal(expected_nodes2);
        expect(metadata).to.deep.equal(expected_metadata2);
    });

    it("Should return empty arrays if no, or undefined nodes or metadata passed.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_computed_member()).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;

        expect(() => [nodes, metadate] = filters.filter_by_computed_member([], [])).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should throw if computed parameter is undefined.", function () {
        expect(() => filters.filter_by_computed_member(
            test_nodes, test_metadata)).to.throw(TypeError);
    });
});


describe(msg.message(filters.filter_by_left_right), function () {
    const test_nodes = [
        { left: { type: "keep" }, right: { type: "keep" } },
        { left: { type: "nkeep" }, right: { type: "keep" } },
        { left: { type: "keep" }, right: { type: "nkeep" } },
        { left: { type: "nkeep" }, right: { type: "nkeep" } },
        { left: { type: "keep" }, right: { type: "keep" } }
    ];
    const test_metadata = [
        0, 1, 2, 3, 4
    ];
    const expected_nodes = [
        { left: { type: "keep" }, right: { type: "keep" } },
        { left: { type: "keep" }, right: { type: "keep" } }
    ];
    const expected_metadata = [
        0, 4
    ];


    let nodes, metadata;
    it("Should keep nodes which left- and righthand-side " +
        "expressions are the same as the one provided.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_left_right(
            test_nodes, test_metadata, { left: { type: "keep" }, right: { type: "keep" } })).to.not.throw();

        expect(nodes).to.be.lengthOf(expected_nodes.length);
        expect(metadata).to.be.lengthOf(expected_metadata.length);
    });

    it("Should return empty arrays if no, or undefined nodes or metadata passed.", function () {
        expect(() => [nodes, metadata] = filters.filter_by_left_right()).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;

        expect(() => [nodes, metadate] = filters.filter_by_left_right([], [])).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should throw if computed parameter is undefined.", function () {
        expect(() => filters.filter_by_left_right(
            test_nodes, test_metadata)).to.throw(TypeError);
    });
});


describe(msg.message(filters.filter_between), function () {
    const test_nodes = [
        "keep", "nkeep", "nkeep", "nkeep", "keep"
    ];
    const test_metadata = [
        { start: { offset: 0 }, end: { offset: 5 } },
        { start: { offset: 5 }, end: { offset: 10 } },
        { start: { offset: 10 }, end: { offset: 15 } },
        { start: { offset: 15 }, end: { offset: 20 } },
        { start: { offset: 20 }, end: { offset: 25 } }
    ];
    const expected_nodes = [
        "keep", "keep"
    ];
    const expected_metadata = [
        { start: { offset: 0 }, end: { offset: 5 } },
        { start: { offset: 20 }, end: { offset: 25 } }
    ];


    let nodes, metadata;
    it("Should keep nodes between provided left and right offsets.", function () {
        expect(() => [nodes, metadata] = filters.filter_between(
            test_nodes, test_metadata, 5, 20)).to.not.throw();

        expect(nodes).to.be.lengthOf(expected_nodes.length);
        expect(metadata).to.be.lengthOf(expected_metadata.length);
    });

    it("Should return empty arrays if no, or undefined nodes or metadata passed.", function () {
        expect(() => [nodes, metadata] = filters.filter_between()).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;

        expect(() => [nodes, metadate] = filters.filter_between([], [])).to.not.throw();
        expect(nodes).to.be.an("array").that.is.empty;
        expect(metadata).to.be.an("array").that.is.empty;
    });

    it("Should throw if filtering offsets are undefined.", function () {
        expect(() => filters.filter_between(
            test_nodes, test_metadata)).to.throw(TypeError);
    });
});
