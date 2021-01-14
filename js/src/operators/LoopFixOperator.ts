import { Syntax } from "esprima";
import escodegen from "escodegen";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { filter_lower_orders, remove_duplicates } from "./filters/filters";
import { extract, get_metadata, gencode } from "./gens/index";
import { re_indent } from "./helpers/indent";
import lodash from "lodash";


type Loop = estree.ForStatement | estree.WhileStatement | estree.DoWhileStatement;

const undefined_const: estree.Identifier = {
    name: 'undefined',
    type: Syntax.Identifier
}

const null_const: estree.Literal = {
    raw: 'null',
    type: Syntax.Literal,
    value: null
}


function get_names(nodes: Array<estree.Node>): Array<string> {
    if (!nodes || nodes.length <= 0) {
        return [];
    }

    let names: Array<string> = [];
    for (let node of nodes) {
        names.push(gencode(escodegen, node));
    }

    return names;
}


function del_props(obj: { [key: string]: any}): void {
    for (let key in obj) {
        delete obj[key];
    }
}


function add_indent(code: string, indent: number): string {
    let unformatted_lines: string[] = code.split('\n');
    for (let i = 1; i < unformatted_lines.length; ++i) {
        unformatted_lines[i] = ' '.repeat(indent) + unformatted_lines[i];
    }
    return unformatted_lines.join('\n');
}


export class LoopFixOperator extends MutationOperator {
    private _loops: Array<Loop> = [];
    private _loops_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._loops = [];
        this._loops_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.ForStatement ||
                node.type === Syntax.WhileStatement ||
                node.type === Syntax.DoWhileStatement) {
                this._loops.push(node);
                this._loops_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    private _patch_for(node: estree.ForStatement, metadata: any, indent: number = 0): string {
        let node_clone = lodash.cloneDeep(node);


        const body = extract().from(node_clone.body);
        let init = extract([Syntax.Identifier, Syntax.MemberExpression]).from(node_clone.init as estree.Node);
        let test = extract([Syntax.Identifier, Syntax.MemberExpression]).from(node_clone.test as estree.Node);
        let update = extract([Syntax.Identifier, Syntax.MemberExpression]).from(node_clone.update as estree.Node);
        let loop_stops = extract([Syntax.ReturnStatement, Syntax.BreakStatement]).from(node_clone.body);

        let init_meta = get_metadata(test);
        [init, init_meta] = filter_lower_orders(init, init_meta);
        let test_meta = get_metadata(test);
        [test, test_meta] = filter_lower_orders(test, test_meta);
        let update_meta = get_metadata(update);
        [update, update_meta] = filter_lower_orders(update, update_meta);

        enum for_loop {
            init, test, update
        }
        const rnd_rule = Math.random();
        const rnd_select = () => rnd_rule < 1./3. ? for_loop.init : rnd_rule < 2./3. ? for_loop.test : for_loop.update;

        const all_routes: { [key: string]: boolean } = {
            init: true,
            test: true,
            update: true
        };
        Object.freeze(all_routes);

        let been_there: { [key: string]: boolean } = {
            init: false,
            test: false,
            update: false
        };        

        let testing = rnd_select();
        const max_tries = 5;
        let tries = 0;
        while (!lodash.isEqual(all_routes, been_there) && tries < max_tries) {
            switch (testing) {
                case for_loop.init: {
                    been_there.init = true; ++tries;

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
                                    let replace_me = test[Rand.range(test.length)];
                                    let replacement = init[Rand.range(init.length)];
                                    lodash.assign(replace_me, replacement);
                                }
                            }
                            else {
                                if (update.length > 0) {
                                    let replace_me = update[Rand.range(update.length)];
                                    let replacement = init[Rand.range(init.length)];
                                    lodash.assign(replace_me, replacement);
                                }
                            }
                            // fallthrough
                        case 1:
                            if (mod_test) {
                                if (test.length > 0) {
                                    let replace_me = test[Rand.range(test.length)];
                                    let replacement = init[Rand.range(init.length)];
                                    lodash.assign(replace_me, replacement);
                                }
                            }
                            else {
                                if (update.length > 0) {
                                    let replace_me = update[Rand.range(update.length)];
                                    let replacement = init[Rand.range(init.length)];
                                    lodash.assign(replace_me, replacement);
                                }
                            }
                    }

                    return add_indent(gencode(escodegen, node_clone), indent);
                }
                case for_loop.test: {
                    been_there.test = true; ++tries;

                    let test_var_names = get_names(test);
                    let update_var_names = get_names(update);

                    // no test variables in for loop
                    if (test_var_names.length <= 0) {
                        // try to evaluate the loop condition, if present
                        if (node_clone.test) {
                            let evaled = eval(gencode(escodegen, node_clone.test));

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
                        let replace_me = update[Rand.range(update.length)];
                        let replacement = test[Rand.range(test.length)];
                        lodash.assign(replace_me, replacement);
                        return add_indent(gencode(escodegen, node_clone), indent);
                    }

                    return this.node_code(node);
                }
                case for_loop.update: {
                    been_there.update = true; ++tries;

                    if (update.length <= 0) {
                        testing = Math.random() < 0.5 ? for_loop.init : for_loop.test;
                        break;
                    }

                    // delete all in-loop update variable assignments
                    let assignments = extract([Syntax.AssignmentExpression, Syntax.UpdateExpression]).from(node_clone.body) as Array<estree.AssignmentExpression | estree.UpdateExpression>;

                    let update_var_names = get_names(update);
                    for (let assignment of assignments) {
                        let myname: string;
                        if (assignment.type === Syntax.AssignmentExpression) {
                            myname = get_names([assignment.left])[0];
                        }
                        else {
                            myname = get_names([assignment.argument])[0];
                        }

                        const replace_with = (obj: { [key: string ]: estree.Node }, property: string) => {
                            if (obj[property] === assignment) {
                                if (assignment.type === Syntax.AssignmentExpression) {
                                    lodash.assign(obj[property], assignment.left);
                                }
                                else {
                                    lodash.assign(obj[property], assignment.argument);
                                }
                            }
                        }

                        if (update_var_names.includes(myname)) {
                            update_nodes(node_clone.body, replace_with);
                        }
                    }

                    function update_nodes(obj: estree.Node, func: Function, ...args: any[]) {
                        function deep_visit(node: estree.Node, func: Function, ...args: any[]) {
                            // if the node passed is not null or undefined,
                            // AND not a default Object instance, but still an object, then continue the recursion
                            const deeper = !(node === null || node === undefined) && !(Object.keys(node).length === 0 && node.constructor === Object) && node instanceof Object;
                            
                            if (deeper) {
                                for (let property in node) {
                                    let node_obj = node as { [key: string]: any };
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
                                    let replace_me = test[Rand.range(test.length)];
                                    let replacement = update[Rand.range(update.length)];
                                    lodash.assign(replace_me, replacement);
                                }
                            }
                            else {
                                if (init.length > 0) {
                                    let replace_me = init[Rand.range(init.length)];
                                    let replacement = update[Rand.range(update.length)];
                                    lodash.assign(replace_me, replacement);
                                }
                            }
                            // fallthrough
                        case 1:
                            if (mod_test) {
                                if (test.length > 0) {
                                    let replace_me = test[Rand.range(test.length)];
                                    let replacement = update[Rand.range(update.length)];
                                    lodash.assign(replace_me, replacement);
                                }
                            }
                            else {
                                if (init.length > 0) {
                                    let replace_me = init[Rand.range(init.length)];
                                    let replacement = update[Rand.range(update.length)];
                                    lodash.assign(replace_me, replacement);
                                }
                            }
                    }

                    return add_indent(gencode(escodegen, node_clone), indent);
                }
                default:
                    return this.node_code(node);
            }
        }


        return this.node_code(node);
    }

    private _patch_while(node: estree.WhileStatement, metadata: any, indent: number = 0): string {
        let node_clone = lodash.cloneDeep(node);


        let loop_stops = extract([Syntax.ReturnStatement, Syntax.BreakStatement]).from(node_clone.body);
        let test = extract([Syntax.Identifier, Syntax.MemberExpression]).from(node_clone.test as estree.Node);
        
        let test_meta = get_metadata(test);
        [test, test_meta] = filter_lower_orders(test, test_meta);

        // no test variables in for loop
        if (test.length <= 0) {
            // try to evaluate the loop condition
            let evaled = eval(gencode(escodegen, node_clone.test));

            if (!evaled)
                return this.node_code(node);
            else if (loop_stops.length <= 0)
                return '// GenprogJS: removed possibly infinite while loop';
        }

        let assignments = extract([Syntax.AssignmentExpression, Syntax.UpdateExpression]).from(node_clone.body) as Array<estree.AssignmentExpression | estree.UpdateExpression>;        
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
            let replace_indices = Rand.generate(Rand.range(1, assignments.length), Rand.range, assignments.length);
            replace_indices = Array.from(new Set(replace_indices));

            for (const index of replace_indices) {
                let replace_me = assignments[Rand.range(assignments.length)];
                let replacement = test[Rand.range(test.length)];

                if (replace_me.type === Syntax.AssignmentExpression) {
                    lodash.assign(replace_me.left, replacement);
                }
                else {
                    lodash.assign(replace_me.argument, replacement);
                }
            }

            return add_indent(gencode(escodegen, node_clone), indent);
        }


        return '// GenprogJS: removed possibly infinite while loop';
    }

    private _patch_dowhile(node: estree.DoWhileStatement, metadata: any, indent: number = 0): string {
        return this._patch_while(node as unknown as estree.WhileStatement, metadata, indent);
    }

    private _patch(node: Loop, metadata: any): string {
        let indent = node.loc?.start.column;

        if (indent == null) {
            indent = 0;
        }

        switch (node.type) {
            case Syntax.ForStatement:
                return this._patch_for(node, metadata, indent);
            case Syntax.WhileStatement:
                return this._patch_while(node, metadata, indent);
            case Syntax.DoWhileStatement:
                return this._patch_dowhile(node, metadata, indent);
            default:
                return this.node_code(node);
        }
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let loops = this._loops.filter(value => { return super.node_id(value) === 0; });
        let loops_meta = this._loops_meta.filter(value => { return super.node_id(value) === 0; });


        if (loops.length > 0) {
            const index = Rand.range(loops.length);
            const node = loops[index];
            const meta = loops_meta[index];

            const patch = this._patch(node, meta);

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}


export class WhileToDoWhileOperator extends MutationOperator {
    private _loops: Array<estree.WhileStatement> = [];
    private _loops_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._loops = [];
        this._loops_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.WhileStatement) {
                this._loops.push(node);
                this._loops_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let loops = this._loops.filter(value => { return super.node_id(value) === 0; });
        let loops_meta = this._loops_meta.filter(value => { return super.node_id(value) === 0; });


        if (loops.length > 0) {
            const index = Rand.range(loops.length);
            const node = loops[index];
            const meta = loops_meta[index];

            let node_cp = node as unknown as estree.DoWhileStatement;
            node_cp.type = Syntax.DoWhileStatement;
            let patch = gencode(escodegen, node_cp);

            patch = re_indent(patch, node_cp.loc?.start.column as number);

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}


export class DoWhileToWhileOperator extends MutationOperator {
    private _loops: Array<estree.DoWhileStatement> = [];
    private _loops_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._loops = [];
        this._loops_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.DoWhileStatement) {
                this._loops.push(node);
                this._loops_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;


        let loops = this._loops.filter(value => { return super.node_id(value) === 0; });
        let loops_meta = this._loops_meta.filter(value => { return super.node_id(value) === 0; });


        if (loops.length > 0) {
            const index = Rand.range(loops.length);
            const node = loops[index];
            const meta = loops_meta[index];

            let node_cp = node as unknown as estree.WhileStatement;
            node_cp.type = Syntax.WhileStatement;
            let patch = gencode(escodegen, node_cp);

            patch = re_indent(patch, node_cp.loc?.start.column as number);

            return super.cleaned_code.slice(0, meta.start.offset) +
                patch + super.cleaned_code.slice(meta.end.offset);
        }

        return super.cleaned_code;
    }
}


export class LoopBreakerChangeOperator extends MutationOperator {
    private _loops: Array<Loop> = [];
    private _loops_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._loops = [];
        this._loops_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.ForStatement ||
                node.type === Syntax.WhileStatement ||
                node.type === Syntax.DoWhileStatement) {
                this._loops.push(node);
                this._loops_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let loops = this._loops.filter(value => { return super.node_id(value) === 0; });
        let loops_meta = this._loops_meta.filter(value => { return super.node_id(value) === 0; });

        if (loops.length > 0) {
            let loop_breakers = extract([Syntax.ReturnStatement, Syntax.BreakStatement, Syntax.ContinueStatement]).from(loops as unknown as estree.Node);

            let mode = Rand.range(3);
            enum break_modes {
                return_mode,
                break_mode,
                continue_mode
            }
            mode = mode === 0 ? break_modes.return_mode : mode === 1 ? break_modes.break_mode : break_modes.continue_mode;

            if (loop_breakers.length > 0) {
                const index = Rand.range(loops.length);
                const node = loops[index];
                const meta = loops_meta[index];

                const indices = new Set(Rand.generate(loop_breakers.length, Rand.range, loop_breakers.length));
                loop_breakers = loop_breakers.filter((val, i) => {
                    return indices.has(i);
                });

                switch (mode)
                {
                    case break_modes.return_mode: {
                        const empty_return_statement: estree.ReturnStatement = {
                            type: Syntax.ReturnStatement
                        };

                        loop_breakers.map(val => {
                            lodash.assign(val, empty_return_statement);
                        });

                        break;
                    }
                    
                    case break_modes.break_mode: {
                        const break_statement: estree.BreakStatement = {
                            type: Syntax.BreakStatement
                        };

                        loop_breakers.map(val => {
                            lodash.assign(val, break_statement);
                        });

                        break;
                    }

                    case break_modes.continue_mode: {
                        const continue_statement: estree.ContinueStatement = {
                            type: Syntax.ContinueStatement
                        };

                        loop_breakers.map(val => {
                            lodash.assign(val, continue_statement);
                        });

                        break;
                    }
                }

                const patch = gencode(escodegen, node);

                return super.cleaned_code.slice(0, meta.start.offset) +
                    patch + super.cleaned_code.slice(meta.end.offset);
            }
        }

        return super.cleaned_code;
    }
}
