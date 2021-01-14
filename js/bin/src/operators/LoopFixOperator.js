"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const escodegen_1 = __importDefault(require("escodegen"));
const MutationOperator_1 = require("./base/MutationOperator");
const rand_1 = require("../random/rand");
const filters_1 = require("./filters/filters");
const index_1 = require("./gens/index");
const indent_1 = require("./helpers/indent");
const lodash_1 = __importDefault(require("lodash"));
const undefined_const = {
    name: 'undefined',
    type: esprima_1.Syntax.Identifier
};
const null_const = {
    raw: 'null',
    type: esprima_1.Syntax.Literal,
    value: null
};
function get_names(nodes) {
    if (!nodes || nodes.length <= 0) {
        return [];
    }
    let names = [];
    for (let node of nodes) {
        names.push(index_1.gencode(escodegen_1.default, node));
    }
    return names;
}
function del_props(obj) {
    for (let key in obj) {
        delete obj[key];
    }
}
function add_indent(code, indent) {
    let unformatted_lines = code.split('\n');
    for (let i = 1; i < unformatted_lines.length; ++i) {
        unformatted_lines[i] = ' '.repeat(indent) + unformatted_lines[i];
    }
    return unformatted_lines.join('\n');
}
class LoopFixOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._loops = [];
        this._loops_meta = [];
    }
    _init() {
        this._loops = [];
        this._loops_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.ForStatement ||
                node.type === esprima_1.Syntax.WhileStatement ||
                node.type === esprima_1.Syntax.DoWhileStatement) {
                this._loops.push(node);
                this._loops_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _patch_for(node, metadata, indent = 0) {
        let node_clone = lodash_1.default.cloneDeep(node);
        const body = index_1.extract().from(node_clone.body);
        let init = index_1.extract([esprima_1.Syntax.Identifier, esprima_1.Syntax.MemberExpression]).from(node_clone.init);
        let test = index_1.extract([esprima_1.Syntax.Identifier, esprima_1.Syntax.MemberExpression]).from(node_clone.test);
        let update = index_1.extract([esprima_1.Syntax.Identifier, esprima_1.Syntax.MemberExpression]).from(node_clone.update);
        let loop_stops = index_1.extract([esprima_1.Syntax.ReturnStatement, esprima_1.Syntax.BreakStatement]).from(node_clone.body);
        let init_meta = index_1.get_metadata(test);
        [init, init_meta] = filters_1.filter_lower_orders(init, init_meta);
        let test_meta = index_1.get_metadata(test);
        [test, test_meta] = filters_1.filter_lower_orders(test, test_meta);
        let update_meta = index_1.get_metadata(update);
        [update, update_meta] = filters_1.filter_lower_orders(update, update_meta);
        let for_loop;
        (function (for_loop) {
            for_loop[for_loop["init"] = 0] = "init";
            for_loop[for_loop["test"] = 1] = "test";
            for_loop[for_loop["update"] = 2] = "update";
        })(for_loop || (for_loop = {}));
        const rnd_rule = Math.random();
        const rnd_select = () => rnd_rule < 1. / 3. ? for_loop.init : rnd_rule < 2. / 3. ? for_loop.test : for_loop.update;
        const all_routes = {
            init: true,
            test: true,
            update: true
        };
        Object.freeze(all_routes);
        let been_there = {
            init: false,
            test: false,
            update: false
        };
        let testing = rnd_select();
        const max_tries = 5;
        let tries = 0;
        while (!lodash_1.default.isEqual(all_routes, been_there) && tries < max_tries) {
            switch (testing) {
                case for_loop.init: {
                    been_there.init = true;
                    ++tries;
                    if (init.length <= 0) {
                        testing = Math.random() < 0.5 ? for_loop.test : for_loop.update;
                        break;
                    }
                    const mod = Math.random() < 0.5 ? 1 : 2;
                    const mod_test = Math.random() < 0.5;
                    switch (mod) {
                        case 2:
                            if (!mod_test) {
                                if (test.length > 0) {
                                    let replace_me = test[rand_1.Rand.range(test.length)];
                                    let replacement = init[rand_1.Rand.range(init.length)];
                                    lodash_1.default.assign(replace_me, replacement);
                                }
                            }
                            else {
                                if (update.length > 0) {
                                    let replace_me = update[rand_1.Rand.range(update.length)];
                                    let replacement = init[rand_1.Rand.range(init.length)];
                                    lodash_1.default.assign(replace_me, replacement);
                                }
                            }
                        // fallthrough
                        case 1:
                            if (mod_test) {
                                if (test.length > 0) {
                                    let replace_me = test[rand_1.Rand.range(test.length)];
                                    let replacement = init[rand_1.Rand.range(init.length)];
                                    lodash_1.default.assign(replace_me, replacement);
                                }
                            }
                            else {
                                if (update.length > 0) {
                                    let replace_me = update[rand_1.Rand.range(update.length)];
                                    let replacement = init[rand_1.Rand.range(init.length)];
                                    lodash_1.default.assign(replace_me, replacement);
                                }
                            }
                    }
                    return add_indent(index_1.gencode(escodegen_1.default, node_clone), indent);
                }
                case for_loop.test: {
                    been_there.test = true;
                    ++tries;
                    let test_var_names = get_names(test);
                    let update_var_names = get_names(update);
                    // no test variables in for loop
                    if (test_var_names.length <= 0) {
                        // try to evaluate the loop condition, if present
                        if (node_clone.test) {
                            let evaled = eval(index_1.gencode(escodegen_1.default, node_clone.test));
                            if (!evaled)
                                return this.node_code(node);
                            else if (loop_stops.length <= 0)
                                return '// GenprogJS: removed possibly infinite for loop';
                            testing = Math.random() < 0.5 ? for_loop.init : for_loop.update;
                            break;
                        }
                        // loop condition not present
                        else {
                            // no condition and no loop stops => possible infinite loop
                            if (loop_stops.length <= 0) {
                                return '// GenprogJS: removed possibly infinite for loop';
                            }
                            return this.node_code(node);
                        }
                    }
                    if (update.length <= 0) {
                        return this.node_code(node);
                    }
                    let present = false;
                    for (let updater of update_var_names) {
                        if (test_var_names.includes(updater)) {
                            present = true;
                        }
                    }
                    // test variable not found among update vars
                    if (!present) {
                        let replace_me = update[rand_1.Rand.range(update.length)];
                        let replacement = test[rand_1.Rand.range(test.length)];
                        lodash_1.default.assign(replace_me, replacement);
                        return add_indent(index_1.gencode(escodegen_1.default, node_clone), indent);
                    }
                    return this.node_code(node);
                }
                case for_loop.update: {
                    been_there.update = true;
                    ++tries;
                    if (update.length <= 0) {
                        testing = Math.random() < 0.5 ? for_loop.init : for_loop.test;
                        break;
                    }
                    // delete all in-loop update variable assignments
                    let assignments = index_1.extract([esprima_1.Syntax.AssignmentExpression, esprima_1.Syntax.UpdateExpression]).from(node_clone.body);
                    let update_var_names = get_names(update);
                    for (let assignment of assignments) {
                        let myname;
                        if (assignment.type === esprima_1.Syntax.AssignmentExpression) {
                            myname = get_names([assignment.left])[0];
                        }
                        else {
                            myname = get_names([assignment.argument])[0];
                        }
                        const replace_with = (obj, property) => {
                            if (obj[property] === assignment) {
                                if (assignment.type === esprima_1.Syntax.AssignmentExpression) {
                                    lodash_1.default.assign(obj[property], assignment.left);
                                }
                                else {
                                    lodash_1.default.assign(obj[property], assignment.argument);
                                }
                            }
                        };
                        if (update_var_names.includes(myname)) {
                            update_nodes(node_clone.body, replace_with);
                        }
                    }
                    function update_nodes(obj, func, ...args) {
                        function deep_visit(node, func, ...args) {
                            // if the node passed is not null or undefined,
                            // AND not a default Object instance, but still an object, then continue the recursion
                            const deeper = !(node === null || node === undefined) && !(Object.keys(node).length === 0 && node.constructor === Object) && node instanceof Object;
                            if (deeper) {
                                for (let property in node) {
                                    let node_obj = node;
                                    if (node_obj[property] instanceof Object) {
                                        func(node_obj, property, ...args);
                                        deep_visit(node_obj[property], func, ...args);
                                    }
                                }
                            }
                        }
                        deep_visit(obj, func, ...args);
                    }
                    const mod = Math.random() < 0.5 ? 1 : 2;
                    const mod_test = Math.random() < 0.5;
                    switch (mod) {
                        case 2:
                            if (!mod_test) {
                                if (test.length > 0) {
                                    let replace_me = test[rand_1.Rand.range(test.length)];
                                    let replacement = update[rand_1.Rand.range(update.length)];
                                    lodash_1.default.assign(replace_me, replacement);
                                }
                            }
                            else {
                                if (init.length > 0) {
                                    let replace_me = init[rand_1.Rand.range(init.length)];
                                    let replacement = update[rand_1.Rand.range(update.length)];
                                    lodash_1.default.assign(replace_me, replacement);
                                }
                            }
                        // fallthrough
                        case 1:
                            if (mod_test) {
                                if (test.length > 0) {
                                    let replace_me = test[rand_1.Rand.range(test.length)];
                                    let replacement = update[rand_1.Rand.range(update.length)];
                                    lodash_1.default.assign(replace_me, replacement);
                                }
                            }
                            else {
                                if (init.length > 0) {
                                    let replace_me = init[rand_1.Rand.range(init.length)];
                                    let replacement = update[rand_1.Rand.range(update.length)];
                                    lodash_1.default.assign(replace_me, replacement);
                                }
                            }
                    }
                    return add_indent(index_1.gencode(escodegen_1.default, node_clone), indent);
                }
                default:
                    return this.node_code(node);
            }
        }
        return this.node_code(node);
    }
    _patch_while(node, metadata, indent = 0) {
        let node_clone = lodash_1.default.cloneDeep(node);
        let loop_stops = index_1.extract([esprima_1.Syntax.ReturnStatement, esprima_1.Syntax.BreakStatement]).from(node_clone.body);
        let test = index_1.extract([esprima_1.Syntax.Identifier, esprima_1.Syntax.MemberExpression]).from(node_clone.test);
        let test_meta = index_1.get_metadata(test);
        [test, test_meta] = filters_1.filter_lower_orders(test, test_meta);
        // no test variables in for loop
        if (test.length <= 0) {
            // try to evaluate the loop condition
            let evaled = eval(index_1.gencode(escodegen_1.default, node_clone.test));
            if (!evaled)
                return this.node_code(node);
            else if (loop_stops.length <= 0)
                return '// GenprogJS: removed possibly infinite while loop';
        }
        let assignments = index_1.extract([esprima_1.Syntax.AssignmentExpression, esprima_1.Syntax.UpdateExpression]).from(node_clone.body);
        let test_var_names = get_names(test);
        let assignment_var_names = get_names(assignments);
        let present = false;
        for (let assignment of assignment_var_names) {
            if (test_var_names.includes(assignment)) {
                present = true;
            }
        }
        // try replacing one of the assigned variables in the body
        // with a variable present in the loop condition (present === true => assignments.length > 0)
        if (!present && assignments.length > 0) {
            let replace_indices = rand_1.Rand.generate(rand_1.Rand.range(1, assignments.length), rand_1.Rand.range, assignments.length);
            replace_indices = Array.from(new Set(replace_indices));
            for (const index of replace_indices) {
                let replace_me = assignments[rand_1.Rand.range(assignments.length)];
                let replacement = test[rand_1.Rand.range(test.length)];
                if (replace_me.type === esprima_1.Syntax.AssignmentExpression) {
                    lodash_1.default.assign(replace_me.left, replacement);
                }
                else {
                    lodash_1.default.assign(replace_me.argument, replacement);
                }
            }
            return add_indent(index_1.gencode(escodegen_1.default, node_clone), indent);
        }
        return '// GenprogJS: removed possibly infinite while loop';
    }
    _patch_dowhile(node, metadata, indent = 0) {
        return this._patch_while(node, metadata, indent);
    }
    _patch(node, metadata) {
        var _a;
        let indent = (_a = node.loc) === null || _a === void 0 ? void 0 : _a.start.column;
        if (indent == null) {
            indent = 0;
        }
        switch (node.type) {
            case esprima_1.Syntax.ForStatement:
                return this._patch_for(node, metadata, indent);
            case esprima_1.Syntax.WhileStatement:
                return this._patch_while(node, metadata, indent);
            case esprima_1.Syntax.DoWhileStatement:
                return this._patch_dowhile(node, metadata, indent);
            default:
                return this.node_code(node);
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let loops = this._loops.filter(value => { return super.node_id(value) === 0; });
        let loops_meta = this._loops_meta.filter(value => { return super.node_id(value) === 0; });
        if (loops.length > 0) {
            const index = rand_1.Rand.range(loops.length);
            const node = loops[index];
            const meta = loops_meta[index];
            const patch = this._patch(node, meta);
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.LoopFixOperator = LoopFixOperator;
class WhileToDoWhileOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._loops = [];
        this._loops_meta = [];
    }
    _init() {
        this._loops = [];
        this._loops_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.WhileStatement) {
                this._loops.push(node);
                this._loops_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        var _a;
        if (this._err !== null)
            return super.cleaned_code;
        let loops = this._loops.filter(value => { return super.node_id(value) === 0; });
        let loops_meta = this._loops_meta.filter(value => { return super.node_id(value) === 0; });
        if (loops.length > 0) {
            const index = rand_1.Rand.range(loops.length);
            const node = loops[index];
            const meta = loops_meta[index];
            let node_cp = node;
            node_cp.type = esprima_1.Syntax.DoWhileStatement;
            let patch = index_1.gencode(escodegen_1.default, node_cp);
            patch = indent_1.re_indent(patch, (_a = node_cp.loc) === null || _a === void 0 ? void 0 : _a.start.column);
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.WhileToDoWhileOperator = WhileToDoWhileOperator;
class DoWhileToWhileOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._loops = [];
        this._loops_meta = [];
    }
    _init() {
        this._loops = [];
        this._loops_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.DoWhileStatement) {
                this._loops.push(node);
                this._loops_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        var _a;
        if (this._err !== null)
            return super.cleaned_code;
        let loops = this._loops.filter(value => { return super.node_id(value) === 0; });
        let loops_meta = this._loops_meta.filter(value => { return super.node_id(value) === 0; });
        if (loops.length > 0) {
            const index = rand_1.Rand.range(loops.length);
            const node = loops[index];
            const meta = loops_meta[index];
            let node_cp = node;
            node_cp.type = esprima_1.Syntax.WhileStatement;
            let patch = index_1.gencode(escodegen_1.default, node_cp);
            patch = indent_1.re_indent(patch, (_a = node_cp.loc) === null || _a === void 0 ? void 0 : _a.start.column);
            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }
        return super.cleaned_code;
    }
}
exports.DoWhileToWhileOperator = DoWhileToWhileOperator;
class LoopBreakerChangeOperator extends MutationOperator_1.MutationOperator {
    constructor(code, buggy_line) {
        super(code, buggy_line);
        this._loops = [];
        this._loops_meta = [];
    }
    _init() {
        this._loops = [];
        this._loops_meta = [];
        super._init();
    }
    _operator(node, metadata) {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === esprima_1.Syntax.ForStatement ||
                node.type === esprima_1.Syntax.WhileStatement ||
                node.type === esprima_1.Syntax.DoWhileStatement) {
                this._loops.push(node);
                this._loops_meta.push(metadata);
                this.stash(node, metadata);
            }
        }
    }
    _generate_patch() {
        if (this._err !== null)
            return super.cleaned_code;
        let loops = this._loops.filter(value => { return super.node_id(value) === 0; });
        let loops_meta = this._loops_meta.filter(value => { return super.node_id(value) === 0; });
        if (loops.length > 0) {
            let loop_breakers = index_1.extract([esprima_1.Syntax.ReturnStatement, esprima_1.Syntax.BreakStatement, esprima_1.Syntax.ContinueStatement]).from(loops);
            let mode = rand_1.Rand.range(3);
            let break_modes;
            (function (break_modes) {
                break_modes[break_modes["return_mode"] = 0] = "return_mode";
                break_modes[break_modes["break_mode"] = 1] = "break_mode";
                break_modes[break_modes["continue_mode"] = 2] = "continue_mode";
            })(break_modes || (break_modes = {}));
            mode = mode === 0 ? break_modes.return_mode : mode === 1 ? break_modes.break_mode : break_modes.continue_mode;
            if (loop_breakers.length > 0) {
                const index = rand_1.Rand.range(loops.length);
                const node = loops[index];
                const meta = loops_meta[index];
                const indices = new Set(rand_1.Rand.generate(loop_breakers.length, rand_1.Rand.range, loop_breakers.length));
                loop_breakers = loop_breakers.filter((val, i) => {
                    return indices.has(i);
                });
                switch (mode) {
                    case break_modes.return_mode: {
                        const empty_return_statement = {
                            type: esprima_1.Syntax.ReturnStatement
                        };
                        loop_breakers.map(val => {
                            lodash_1.default.assign(val, empty_return_statement);
                        });
                        break;
                    }
                    case break_modes.break_mode: {
                        const break_statement = {
                            type: esprima_1.Syntax.BreakStatement
                        };
                        loop_breakers.map(val => {
                            lodash_1.default.assign(val, break_statement);
                        });
                        break;
                    }
                    case break_modes.continue_mode: {
                        const continue_statement = {
                            type: esprima_1.Syntax.ContinueStatement
                        };
                        loop_breakers.map(val => {
                            lodash_1.default.assign(val, continue_statement);
                        });
                        break;
                    }
                }
                const patch = index_1.gencode(escodegen_1.default, node);
                return super.cleaned_code.slice(0, meta.start.offset) +
                    patch + super.cleaned_code.slice(meta.end.offset);
            }
        }
        return super.cleaned_code;
    }
}
exports.LoopBreakerChangeOperator = LoopBreakerChangeOperator;
