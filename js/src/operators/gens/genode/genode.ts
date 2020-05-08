import { Node } from "estree";
import { Rand } from "../../../random/rand";
import lodash from "lodash";
import { _extract as extract } from "../extractor/extractor";
import { _type_filter_callback as filter_callback } from "../extractor/extractor";

/**
 * @brief _Genode - class for AST node generation from a set of nodes
 */
export class _Genode {
    private _types: Array<string> | string | undefined;

    private _sim = class _sim {
        public static _parent: _Genode;
        private _sample: Node;

        /**
         * @brief constructor - deep copies a sample provided and stores it in the object
         * 
         * @param {Node} sample - a node sample
         */
        public constructor(sample: Node) {
            this._sample = lodash.cloneDeep(sample);
        }

        /**
         * @brief using - method which will generate the new AST node
         * by the sample provided to the constructor
         * 
         * @param {Array<Node>} nodes - generate new AST node using these nodes
         */
        using(nodes: Array<Node>): Node {
            if (nodes instanceof Array && nodes.length > 0) {
                const gentype = _sim._parent._types;

                // create and use the extractor
                let extracted = extract(gentype).from(this._sample);

                for (let i = 0; i < extracted.length; ++i) {
                    let extr = extracted[i];

                    // filter all nodes by type of current extraction value type
                    let candidates = nodes.filter(value =>
                        value.type === extr.type);
                
                    // concat the extracted value, too since the type of it, too
                    // satisfies the criteria
                    candidates = candidates.concat(extr);

                    // change the inner sample by changing the reference
                    // to its nodes
                    const index = Rand.range(candidates.length);
                    let mutation = lodash.cloneDeep(candidates[index]);
                    extr = Object.assign(extr, mutation);

                    extracted = extract(gentype).from(this._sample);
                }
            }
    
            // return modified or unmodified sample,
            // or undefined if no sample passed
            return this._sample;
        }
    }

    /**
     * @brief sim - function to wrap _sim constructor, for simpler usage
     * 
     * @param {Node} sample - sample node provided to constructor
     */
    sim(sample: Node) {
        let invocator = this._sim;
        return new invocator(sample);
    }

    /**
     * @brief using - generate new AST node from a random node
     * 
     * @param {Array<Node>} nodes - AST nodes, one will be selected, and a new AST node will be
     * generated by it 
     */
    using(nodes: Array<Node>): Node {
        if (nodes.length > 0) {
            if (this._types) {
                let cnodes = filter_callback(nodes, this._types);

                const index = Rand.range(cnodes.length);
                let sample = cnodes[index];

                return this.sim(sample).using(cnodes);
            }
            else {
                let cnodes = lodash.cloneDeep(nodes);

                const index = Rand.range(cnodes.length);
                let sample = cnodes[index];

                return this.sim(sample).using(cnodes);
            }
        }

        throw RangeError("Empty array of nodes passed.");
    }

    /**
     * @brief constructor
     * 
     * @param {Array|String} types - accepted types, only these will remain in the provided node set
     */
    public constructor(types: Array<string> | string | undefined) {
        this._types = types;
        this._sim._parent = this;
    }
}

/**
 * @brief init - returns a new @a _Genode object
 * 
 * @param {Array<string> | string} types - types parameter will be provided, to the new object
 */
export function _initGenode(types: Array<string> | string): _Genode {
    return new _Genode(types);
}