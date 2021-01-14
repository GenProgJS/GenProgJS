import estree from "estree";
import { isArray } from "lodash";

/**
 * @brief _extractor - class from extracting nested nodes of a kind from a single node
 */
class _extractor {
    _types: Array<string>;


    public constructor(types: Array<string> | string | undefined = undefined) {
        if (types instanceof Array)
            this._types = types;
        else if (typeof types === 'string')
            this._types = [types];
        else
            this._types = [];
    }

    public from(node: estree.Node) {
        let nested: estree.Node[] = [];

        if (node.type != null) {
            for (let i = 0; i < this._types.length; ++i) {
                if (node.type.indexOf(this._types[i]) >= 0) {
                    nested.push(node);
                    break;
                }
            }
        }
        

        // visit every nested node recursively
        if (node instanceof Object) {
            this._deep_visit(node, nested);
        }

        return nested;
    }

    /**
     * @brief _deep_visit - recursively visits nested nodes of a node
     * 
     * @param {estree.Node} node - the node to extract from
     * @param {Array<estree.Node>} result - a valid array that will contain the results
     */
    private _deep_visit(node: estree.Node, result: Array<estree.Node>) {
        // if the node passed is not a default Object instance, but still an object, then continue the recursion
        const deeper = !(Object.keys(node).length === 0 && node.constructor === Object) && node instanceof Object;
        
        if (deeper) {
            for (let property in node) {
                const node_obj = node as { [key: string]: any };
                if (node_obj[property] instanceof Object) {
                    // if the nested node is of the specified type, then push it to the results
                    if (node_obj[property].type) {
                        if (this._types.length > 0) {
                            for (let i = 0; i < this._types.length; ++i) {
                                if (node_obj[property].type.indexOf(this._types[i]) >= 0) {
                                    result.push(node_obj[property]);
                                    break;
                                }
                            }
                        }
                        else {
                            result.push(node_obj[property]);
                        }
                    }
                    
                    // continue the recursion
                    this._deep_visit(node_obj[property], result);
                }
            }
        }
    }
}

function _extract(types: Array<string> | string | undefined = undefined) {
    return new _extractor(types);
}

function _type_filter_callback(nodes: Array<estree.Node>, types: Array<string> | string): Array<estree.Node> {
    return nodes.filter(value => {
        if (types instanceof Array) {
            for (let i = 0; i < types.length; ++i) {
                if (value.type.indexOf(types[i]) >= 0) return true;
            } return false;
        }
        return value.type.indexOf(types) >= 0;
    });
}

function _get_metadata(nodes: Array<estree.Node>): Array<any> {
    if (nodes.length === 0) {
        return [];
    }

    let meta = [];
    for (let node of nodes) {
        if (!isArray(node.range)) {
            throw Error("getting metadata failed: node list element does not contain range information");
        }

        meta.push({
            start: {offset: node.range?.[0]},
            end: {offset: node.range?.[1]}
        });
    }

    return meta;
}

export { _extractor, _type_filter_callback, _extract, _get_metadata };
