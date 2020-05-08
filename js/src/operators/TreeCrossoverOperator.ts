import * as esprima from "esprima";
import { Node } from "estree";

import { CrossoverOperator } from "./base/CrossoverOperator";
import { Rand } from "../random/rand";


export class TreeCrossoverOperator extends CrossoverOperator {
    _nodes1: Array<Node> = [];
    _nodes2: Array<Node> = [];
    _meta1: Array<any> = [];
    _meta2: Array<any> = [];

    // used as pointer like variables
    // pointing to the above defined variables
    _nodes: Array<Array<Node>> = [this._nodes1, this._nodes2];
    _meta: Array<any> = [this._meta1, this._meta2];


    public constructor(code1: string, code2: string, buggy_line: number)
    { super(code1, code2, buggy_line); }

    protected _init(): void {
        this._nodes1.length = 0;
        this._meta1.length = 0;
        this._nodes2.length = 0;
        this._meta2.length = 0;
        super._init();
    }

    /**
     * @brief _operator - defines the behavior of the operator
     * @param node
     * @param metadata
     * @private
     */
    protected _operator(node: Node, metadata: any) {
        if (node.type !== esprima.Syntax.Program) {
            if (this.is_buggy_line(metadata, false)) {
                this._nodes[this.n].push(node);
                this._meta[this.n].push(metadata);
            }
        }
    }

    protected _generate_patch(): string {
        if (this._err !== null)
            return super.code;

        if (this._nodes1.length > 0 && this._nodes2.length > 0) {
            let rnd: number;
            // father and mother selection
            // will the mother be the first or second code?
            let father = this._nodes[rnd = Rand.range(2)];
            let mother = this._nodes[(rnd + 1) % 2];
            let father_meta = this._meta[rnd];
            let mother_meta = this._meta[(rnd + 1) % 2];

            // insertion will happen on, well ...
            // get an index for the gene from the mother
            let mgene_n = Rand.range(mother.length);
            // get an index for the gene from the father
            let fgene_n = Rand.range(father.length);
            // select the genes
            let mother_gene = mother[mgene_n];
            let mother_gene_meta = mother_meta[mgene_n];
            let father_gene = father[fgene_n];
            let father_gene_meta = father_meta[fgene_n];

            // get the father's and mother's code based on who
            // was selected to be the mother and father
            let code_m = rnd ? this._code1 : this._code2;
            let code_f = rnd ? this._code2 : this._code1;
            let patch = code_f.slice(father_gene_meta.start.offset, father_gene_meta.end.offset);

            // there is no guarantee, that this patch will be a valid one
            // on invalid code, the returned code will be the first argument
            return code_m.slice(0, mother_gene_meta.start.offset) +
                patch + code_m.slice(mother_gene_meta.end.offset);
        }

        return super.code;
    }
}
