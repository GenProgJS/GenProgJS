"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima = __importStar(require("esprima"));
const config = __importStar(require("../config/config.json"));
const BaseOperator_1 = require("./BaseOperator");
class idNode {
    constructor(id, node, metadata) {
        this._id = id;
        this._node = node;
        this._metadata = metadata;
    }
    get id() { return this._id; }
    get node() { return this._node; }
    get metadata() { return this._metadata; }
}
class MutationOperator extends BaseOperator_1.BaseOperator {
    constructor(code, buggy_line) {
        super();
        this._origin = '';
        this._cleaned_code = '';
        this._id = 0;
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
            this._origin = BaseOperator_1.BaseOperator.preprocess(code, BaseOperator_1.PreprocessOpt.replace);
            this._cleaned_code = BaseOperator_1.BaseOperator.preprocess(code);
        }
        catch (err) {
            this._err = err;
            this._err.message += "::Could not preprocess code.";
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
        }
        catch (err) {
            this._err = err;
        }
    }
    _init() {
        this._stash.length = 0;
        this._id = 0;
        this._ast = esprima.parseScript(this._cleaned_code, config.esprima, this._operator.bind(this));
        // expand search space
        this._id = 1;
        if (this._cleaned_code !== this._origin) {
            esprima.parseScript(this._origin, config.esprima, this._operator.bind(this));
        }
    }
    /**
     * @brief which_node - searches for a node in the stashed nodes and returns the index, if found
     *
     * @param find - find out the index of this node
     * @returns {number} the index of the node in the stash
     */
    which_node(find) {
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
    node_id(node) {
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
    stash(node, metadata) {
        this._stash.push(new idNode(this._id, node, metadata));
    }
    /**
     * @brief node_code - finds the source code of a given and existing node
     *
     * @param node - the node to get the code from
     * @returns {string} - the source code of the given node
     */
    node_code(node) {
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
    get cleaned_code() { return this._cleaned_code; }
    get origin() { return this._origin; }
    get id() { return this._id; }
    get codes() { return [this._cleaned_code, this._origin]; }
}
exports.MutationOperator = MutationOperator;
