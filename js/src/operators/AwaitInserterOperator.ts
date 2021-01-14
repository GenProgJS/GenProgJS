import { Syntax } from "esprima";
import escodegen from "escodegen";
import estree from "estree";
import { MutationOperator } from "./base/MutationOperator";
import { Rand } from "../random/rand";
import { filter_lower_orders, filter_type } from "./filters/filters";
import lodash from "lodash";
import { gencode } from "./gens"


export class AwaitInserterOperator extends MutationOperator {
    private _entries: Array<estree.Identifier | estree.MemberExpression | estree.CallExpression> = [];
    private _entries_meta: Array<any> = [];
    private _removeables: Array<estree.Node> = [];
    private _removeables_meta: Array<any> = [];
    private _container: Array<estree.Node> = [];
    private _container_meta: Array<any> = [];


    public constructor(code: string, buggy_line: number)
    { super(code, buggy_line); }


    protected _init(): void {
        this._entries = [];
        this._entries_meta = [];
        this._removeables = [];
        this._removeables_meta = [];
        this._container = [];
        this._container_meta = [];
        super._init();
    }


    protected _operator(node: estree.Node, metadata: any): void {
        // get identifiers from the buggy line
        if (this.is_buggy_line(metadata, false)) {
            if (node.type === Syntax.Identifier ||
                node.type === Syntax.MemberExpression ||
                node.type === Syntax.CallExpression) {
                this._entries.push(node);
                this._entries_meta.push(metadata);

                this.stash(node, metadata);
            }
            else if (node.type === Syntax.VariableDeclarator) {
                this._removeables.push(node.id);
                const artifical_meta = {start: {offset: node.id.range?.[0]}, end: {offset: node.id.range?.[1]}};
                this._removeables_meta.push(artifical_meta);
            
                this.stash(node, artifical_meta);
            }
            else if (node.type === Syntax.AssignmentExpression) {
                this._removeables.push(node.left);
                const artifical_meta = {start: {offset: node.left.range?.[0]}, end: {offset: node.left.range?.[1]}};
                this._removeables_meta.push(artifical_meta);
            
                this.stash(node, artifical_meta);
            }
            else if (node.type === Syntax.AwaitExpression) {
                this._removeables.push(node.argument);
                const artifical_meta = {start: {offset: node.argument.range?.[0]}, end: {offset: node.argument.range?.[1]}};
                this._removeables_meta.push(artifical_meta);
            
                this.stash(node, artifical_meta);
            }
            else if (node.type === Syntax.FunctionDeclaration) {
                if (node.id) {
                    this._removeables.push(node.id);
                    const artifical_meta = {start: {offset: node.id.range?.[0]}, end: {offset: node.id.range?.[1]}};
                    this._removeables_meta.push(artifical_meta);

                    this.stash(node, artifical_meta);
                }

                for (const param of node.params) {
                    this._removeables.push(param);
                    const artifical_meta = {start: {offset: param.range?.[0]}, end: {offset: param.range?.[1]}};
                    this._removeables_meta.push(artifical_meta);

                    this.stash(node, artifical_meta);
                }
            }
            else {
                this._container.push(node);
                this._container_meta.push(metadata);

                this.stash(node, metadata);
            }
        }
    }


    protected _generate_patch(): string {
        if (this._err !== null)
            return super.cleaned_code;

        let entries: estree.Node[] = this._entries.filter(value => { return super.node_id(value) === 0; });
        let entries_meta = this._entries_meta.filter(value => { return super.node_id(value) === 0; });
        let removeables: estree.Node[] = this._removeables.filter(value => { return super.node_id(value) === 0; });
        let removeables_meta = this._removeables_meta.filter(value => { return super.node_id(value) === 0; });
        let container = this._container.filter(value => { return super.node_id(value) === 0; });
        let container_meta = this._container_meta.filter(value => { return super.node_id(value) === 0; });

        let identifiers, identifiers_meta;
        [identifiers, identifiers_meta] = filter_type(entries, entries_meta, Syntax.Identifier);
        let member_expressions, member_expressions_meta;
        [member_expressions, member_expressions_meta] = filter_type(entries, entries_meta, Syntax.MemberExpression);
        [identifiers, identifiers_meta] = filter_type(entries, entries_meta, Syntax.Identifier);
        let calls, calls_meta: any[];
        [calls, calls_meta] = filter_type(entries, entries_meta, Syntax.CallExpression);
        let func_args: estree.Node[] = [], func_args_meta: any[] = [];
        calls.forEach((call: estree.CallExpression) => {
            func_args = func_args.concat(call.arguments);
            func_args_meta = func_args_meta.concat(call.arguments.map(val => {
                return {start: {offset: val.range?.[0]}, end: {offset: val.range?.[1]}}
            }));
        });
        
        [entries, entries_meta] = filter_lower_orders(entries, entries_meta);
        entries = entries.concat(func_args);
        entries_meta = entries_meta.concat(func_args_meta);
        entries = entries.filter((val, index) => {
            const included = removeables.includes(val);
        
            if (included) {
                entries_meta[index] = undefined;
            }
        
            return !included;
        });
        entries_meta = entries_meta.filter(val => val !== undefined)

        if (entries.length > 0) {
            let true_container, true_container_meta;
            [true_container, true_container_meta] = filter_lower_orders(container, container_meta);
            true_container = true_container[0];
            true_container_meta = true_container_meta[0];

            const indices = Array.from(new Set(Rand.generate(entries.length, Rand.range, entries.length)));

            for (const index of indices) {
                const node = entries[index];
                const meta = entries_meta[index];

                const new_node: estree.AwaitExpression = {
                    argument: lodash.cloneDeep(node) as estree.Expression,
                    type: Syntax.AwaitExpression
                }

                lodash.assign(node, new_node);
            }

            const patch = gencode(escodegen, true_container);

            return super.cleaned_code.slice(0, true_container_meta.start.offset) +
                patch + super.cleaned_code.slice(true_container_meta.end.offset);
        }

        return super.cleaned_code;
    }
}
