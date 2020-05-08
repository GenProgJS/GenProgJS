"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @brief _extractor - class from extracting nested nodes of a kind from a single node
 */
class _extractor {
    constructor(types) {
        if (types instanceof Array)
            this._types = types;
        else if (typeof types === 'string')
            this._types = [types];
        else
            this._types = [];
    }
    from(node) {
        let nested = [];
        // visit every nested node recursively
        if (node instanceof Object) {
            this._deep_visit(node, nested);
        }
        return nested;
    }
    /**
     * @brief _deep_visit - recursively visits nested nodes of a node
     *
     * @param {Node} node - the node to extract from
     * @param {Array<Node>} result - a valid array that will contain the results
     */
    _deep_visit(node, result) {
        // if the node passed is not a default Object instance, but still an object, then continue the recursion
        const deeper = !(Object.keys(node).length === 0 && node.constructor === Object) && node instanceof Object;
        if (deeper) {
            for (let property in node) {
                const node_obj = node;
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
exports._extractor = _extractor;
function _extract(types) {
    return new _extractor(types);
}
exports._extract = _extract;
function _type_filter_callback(nodes, types) {
    return nodes.filter(value => {
        if (types instanceof Array) {
            for (let i = 0; i < types.length; ++i) {
                if (value.type.indexOf(types[i]) >= 0)
                    return true;
            }
            return false;
        }
        return value.type.indexOf(types) >= 0;
    });
}
exports._type_filter_callback = _type_filter_callback;
