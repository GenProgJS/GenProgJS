import * as esprima from "esprima";
import { Node } from "estree";

import * as config from "../config/config.json";
import { BaseOperator, PreprocessOpt } from "./BaseOperator"


class idNode {
    private _id: number;
    private _node: Node;
    private _metadata: any;

    public constructor(id: number, node: Node, metadata: any) {
        this._id = id;
        this._node = node;
        this._metadata = metadata;
    }

    public get id(): number
    { return this._id; }
    public get node(): Node
    { return this._node; }
    public get metadata(): any
    { return this._metadata; }
}

export abstract class MutationOperator extends BaseOperator {
    protected _origin: string = '';
    protected _cleaned_code: string = '';
    private _id: number = 0;
    private _stash: Array<idNode>;


    public constructor(code: string, buggy_line: number) {
        super()
        this._code = code;
        this._buggy_line = buggy_line;
        this._err = null;
        this._ast = null;
        this._stash = [];


        if (!this._code || !buggy_line) {
            this._err = TypeError("ERROR: undefined program or buggy_line");
            return;
        }

        try {
            this._origin = BaseOperator.preprocess(code, PreprocessOpt.replace)
            this._cleaned_code = BaseOperator.preprocess(code);
        }
        catch (err) {
            this._err = err;
            (this._err as Error).message += "::Could not preprocess code.";
            return;
        }

        if ((this._cleaned_code.match(/\n/g) || '').length + 1 < buggy_line) {
            this._err = RangeError("ERROR: buggy line greater, than lines in code");
            return;
        }

        if (buggy_line <= 0) {
            this._err = RangeError("WARNING: no bugs specified in code; line = " + buggy_line.toString());
            return;
        }
            

        try {
            this._ast = esprima.parseScript(this._cleaned_code, config.esprima);
        } catch (err) {
            this._err = err;
        }
    }

    protected _init(): void {
        this._stash.length = 0;

        this._id = 0;
        this._ast = esprima.parseScript(
            this._cleaned_code,
            config.esprima,
            this._operator.bind(this)
        );

        // expand search space
        this._id = 1;
        if (this._cleaned_code !== this._origin) {
            esprima.parseScript(
                this._origin,
                config.esprima,
                this._operator.bind(this)
            )
        }
    }

    /**
     * @brief which_node - searches for a node in the stashed nodes and returns the index, if found
     * 
     * @param find - find out the index of this node
     * @returns {number} the index of the node in the stash
     */
    private which_node(find: Node | any): number {
        for (let i = 0; i < this._stash.length; ++i) {
            if (find === this._stash[i].node || find === this._stash[i].metadata)
                return i;
        }
        return -1;
    }

    /**
     * @brief node_id - get the id of a given node, if found
     * 
     * @param node - find out the id of this node
     * @returns {number} the id of this node
     */
    protected node_id(node: Node | any): number {
        let index = this.which_node(node);
        let element = this._stash[index];
        
        return element.id;
    }

    /**
     * @brief stash - pushes a node item into the stash
     * 
     * @param node - put the node in the stash
     * @param metadata - put the node's metadata in the stash
     */
    protected stash(node: Node, metadata: any) {
        this._stash.push(new idNode(this._id, node, metadata));
    }

    /**
     * @brief node_code - finds the source code of a given and existing node
     * 
     * @param node - the node to get the code from
     * @returns {string} - the source code of the given node
     */
    protected node_code(node: Node | any): string {
        let index = this.which_node(node);
        let element = this._stash[index];
        
        if (element.id === 0) {
            return this._cleaned_code.substring(element.metadata.start.offset, element.metadata.end.offset);
        }
        else if (element.id === 1) {
            return this._origin.substring(element.metadata.start.offset, element.metadata.end.offset);
        }

        throw Error("Code could not be found or generated from node or metadata passed.");
    }

    protected get cleaned_code(): string
    { return this._cleaned_code; }

    protected get origin(): string
    { return this._origin; }

    protected get id(): number
    { return this._id; }

    protected get codes(): Array<string>
    { return [this._cleaned_code, this._origin]; }
}
