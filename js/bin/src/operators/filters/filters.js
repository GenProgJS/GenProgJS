"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const escodegen_1 = __importDefault(require("escodegen"));
/**
 * @brief filter_duplicate_numerics - function to filter duplicate elements:
 * a numeric Literal will be filtered if the passed array contains
 * an UnaryExpression with the same offset
 *
 * @param unaries_and_numerics
 * @param unaries_and_numerics_meta
 */
function filter_duplicate_numerics(unaries_and_numerics, unaries_and_numerics_meta) {
    if (!unaries_and_numerics || unaries_and_numerics.length <= 0 ||
        !unaries_and_numerics_meta || unaries_and_numerics_meta.length <= 0)
        return [[], []];
    let filt_entries = [];
    let filt_meta = [];
    // filter duplicate elements by UnaryExpressions
    for (let i = 0; i < unaries_and_numerics.length; ++i) {
        const entry = unaries_and_numerics[i];
        const meta = unaries_and_numerics_meta[i];
        let found = false;
        // find an UnaryExpression with the same offset
        // as the Numeric Literal
        if (entry.type === esprima_1.Syntax.Literal) {
            for (let j = 0; j < unaries_and_numerics.length; ++j) {
                const find_entry = unaries_and_numerics[j];
                if (find_entry.type === esprima_1.Syntax.UnaryExpression) {
                    const find_meta = unaries_and_numerics_meta[j];
                    // if the end offset is the same we found it
                    if (find_meta.end.offset === meta.end.offset) {
                        found = true;
                        break;
                    }
                }
            }
        }
        // if we haven't been able to find
        // then this is a unique literal
        // + numeric literals in unary expressions
        // are automatically stored
        if (!found) {
            filt_entries.push(entry);
            filt_meta.push(meta);
        }
    }
    // return the new array, and an array
    // containing the removed indices
    return [filt_entries, filt_meta];
}
exports.filter_duplicate_numerics = filter_duplicate_numerics;
function filter_lower_orders(nodes, metadata) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    let filt_entries = [];
    let filt_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        let node = nodes[i];
        let meta = metadata[i];
        let found = false;
        let j;
        for (j = 0; j < nodes.length; ++j) {
            if (j === i)
                continue;
            const find_meta = metadata[j];
            if (find_meta.start.offset <= meta.start.offset && find_meta.end.offset >= meta.end.offset) {
                found = true;
                break;
            }
        }
        if (!found) {
            filt_entries.push(node);
            filt_meta.push(meta);
        }
    }
    // return the new array, and an array
    // containing the removed indices
    return [filt_entries, filt_meta];
}
exports.filter_lower_orders = filter_lower_orders;
function filter_by_offset(nodes, metadata, ref_meta, left_offset_threshold, right_offset_threshold) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    left_offset_threshold = left_offset_threshold === null ? undefined : left_offset_threshold;
    right_offset_threshold = right_offset_threshold === null ? undefined : right_offset_threshold;
    left_offset_threshold = isNaN(Number(left_offset_threshold)) ? undefined : Number(left_offset_threshold);
    right_offset_threshold = isNaN(Number(right_offset_threshold)) ? undefined : Number(right_offset_threshold);
    if (ref_meta === undefined)
        throw TypeError("undefined reference metadata passed");
    let new_nodes = [];
    let new_metadata = [];
    // all thresholds undefined -> return original nodes
    if (left_offset_threshold === undefined && right_offset_threshold === undefined) {
        new_nodes = nodes;
        new_metadata = metadata;
    }
    for (let i = 0; i < metadata.length; ++i) {
        // ignore identifiers on the right, but not on the left side
        if (left_offset_threshold === undefined) {
            if (metadata[i].start.offset <= ref_meta.start.offset + right_offset_threshold) {
                new_nodes.push(nodes[i]);
                new_metadata.push(metadata[i]);
            }
        }
        // ignore identifiers on the left, but not on the right side
        else if (right_offset_threshold === undefined) {
            if (metadata[i].start.offset >= ref_meta.start.offset - left_offset_threshold) {
                new_nodes.push(nodes[i]);
                new_metadata.push(metadata[i]);
            }
        }
        // ignore identifiers and such outside the defined threshold
        else {
            if (metadata[i].start.offset >= ref_meta.start.offset - left_offset_threshold &&
                metadata[i].start.offset <= ref_meta.start.offset + right_offset_threshold) {
                new_nodes.push(nodes[i]);
                new_metadata.push(metadata[i]);
            }
        }
    }
    // filtered nodes
    return [new_nodes, new_metadata];
}
exports.filter_by_offset = filter_by_offset;
function remove_brackets(str) {
    if (!str)
        return str;
    if (str.indexOf('(') === 0 && str.indexOf(')', str.length - 1) === str.length - 1)
        return str.substr(1, str.length - 2);
    return str;
}
exports.remove_brackets = remove_brackets;
function filter_expr_type(nodes, metadata, expr_type) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    if (expr_type === undefined)
        throw TypeError("undefined expression type passed");
    let expr_filter;
    if (expr_type instanceof String)
        expr_filter = [expr_type];
    else
        expr_filter = expr_type;
    let filtered = [], filtered_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        // ExpressionStatements case
        if (node.expression) {
            const expr_statement = node;
            if (expr_filter.includes(expr_statement.expression.type)) {
                const meta = metadata[i];
                filtered.push(node);
                filtered_meta.push(meta);
            }
        }
        // Simple Expressions case
        else if (expr_filter.includes(node.type)) {
            const meta = metadata[i];
            filtered.push(node);
            filtered_meta.push(meta);
        }
    }
    return [filtered, filtered_meta];
}
exports.filter_expr_type = filter_expr_type;
function filter_by_operator(nodes, metadata, operator) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    if (operator === undefined)
        throw TypeError("undefined operator type passed");
    let filtered = [], filtered_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        if (node.operator && node.operator === operator) {
            const meta = metadata[i];
            filtered.push(node);
            filtered_meta.push(meta);
        }
    }
    return [filtered, filtered_meta];
}
exports.filter_by_operator = filter_by_operator;
// TODO: add more? remove?
const operator_t = {
    strict_comparison: ["===", "!=="],
    comparison: ["<", ">", "<=", ">=", "==", "!="],
    logical: ["&&", "||"],
    assignment: ["="],
    numeric: ["+", "-", "*", "/", "**", "%"],
    numeric_assignment: ["+=", "-=", "*=", "/=", "**=", "%="],
    bitwise: ["|", "&", "^", "~"],
    bitwise_assignment: ["|=", "&=", "^=", "~="],
    shifter: ["<<", ">>", ">>>"],
    shift_assignment: ["<<=", ">>=", ">>>="],
    stepping: ["++", "--"]
};
function filter_by_operator_type(nodes, metadata, operator) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    if (operator === undefined)
        throw TypeError("undefined operator type passed");
    let type = undefined;
    // get the operator's type (custom)
    for (let field in operator_t) {
        let value = operator_t[field];
        let index = value.indexOf(operator);
        if (index >= 0)
            type = field;
    }
    // the operator type is not implemented yet,
    // or unexpected operator variable passed
    if (type === undefined) {
        return [[], []];
    }
    let filtered = [], filtered_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        // if the operator being searched fits the operator's type criteria
        if (node.operator && operator_t[type].indexOf(node.operator) >= 0) {
            const meta = metadata[i];
            filtered.push(node);
            filtered_meta.push(meta);
        }
    }
    return [filtered, filtered_meta];
}
exports.filter_by_operator_type = filter_by_operator_type;
function filter_by_computed_member(nodes, metadata, computed) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    if (computed === undefined)
        throw TypeError("undefined computed boolean passed");
    let filtered = [], filtered_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        // if the operator being searched fits the operator's type criteria
        if (node.computed !== undefined && node.computed === computed) {
            const meta = metadata[i];
            filtered.push(node);
            filtered_meta.push(meta);
        }
    }
    return [filtered, filtered_meta];
}
exports.filter_by_computed_member = filter_by_computed_member;
function filter_by_left_right(nodes, metadata, assignment) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    if (assignment === undefined)
        throw TypeError("undefined assignment type passed");
    let filtered = [], filtered_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        // if the operator being searched fits the operator's type criteria
        if (node.left.type === assignment.left.type && node.right.type === assignment.right.type) {
            const meta = metadata[i];
            filtered.push(node);
            filtered_meta.push(meta);
        }
    }
    return [filtered, filtered_meta];
}
exports.filter_by_left_right = filter_by_left_right;
function filter_between(nodes, metadata, left, right) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    if (isNaN(left) || isNaN(right))
        throw TypeError("left and right offset must be defined");
    let filtered = [], filtered_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        const meta = metadata[i];
        if (!(meta.start.offset >= left && meta.end.offset <= right)) {
            const node = nodes[i];
            filtered.push(node);
            filtered_meta.push(meta);
        }
    }
    return [filtered, filtered_meta];
}
exports.filter_between = filter_between;
function keep_between(nodes, metadata, left, right) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    if (isNaN(left) || isNaN(right))
        throw TypeError("left and right offset must be defined");
    let filtered = [], filtered_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        const meta = metadata[i];
        if (meta.start.offset >= left && meta.end.offset <= right) {
            const node = nodes[i];
            filtered.push(node);
            filtered_meta.push(meta);
        }
    }
    return [filtered, filtered_meta];
}
exports.keep_between = keep_between;
function is_inside(check_this, inside) {
    if (check_this.start.offset >= inside.start.offset &&
        check_this.end.offset <= inside.end.offset)
        return true;
    return false;
}
function remove_call_identifiers(nodes, metadata) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    let filtered = [], filtered_meta = [];
    let call_meta = [];
    // get call positions (metadata)
    // we will filter by them
    for (let i = 0; i < nodes.length; ++i) {
        let node = nodes[i];
        let meta = metadata[i];
        if (node.type === esprima_1.Syntax.CallExpression) {
            call_meta.push(meta);
        }
    }
    metadata.forEach((meta, index) => {
        let found = false;
        let node = nodes[index];
        for (let i = 0; i < call_meta.length; ++i) {
            let cmeta = call_meta[i];
            if (is_inside(meta, cmeta)) {
                found = true;
                break;
            }
        }
        if (!found && node.type !== esprima_1.Syntax.CallExpression) {
            filtered.push(node);
            filtered_meta.push(meta);
        }
    });
    return [filtered, filtered_meta];
}
exports.remove_call_identifiers = remove_call_identifiers;
/**
 * @brief remove_duplicates - removes duplicate nodes, by generating a string represetation
 * of the AST node and comparing them
 *
 * @param nodes
 * @param metadata
 *
 * @return duplicate free list of nodes
 */
function remove_duplicates(nodes, metadata) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    let filtered = [], filtered_meta = [];
    let call_meta = [];
    nodes.forEach((value, index) => {
        let duplicate = false;
        let code_string = escodegen_1.default.generate(value);
        for (let i = 0; i < filtered.length; ++i) {
            let find_me = escodegen_1.default.generate(filtered[i]);
            if (find_me === code_string) {
                duplicate = true;
                break;
            }
        }
        if (!duplicate) {
            filtered.push(value);
            filtered_meta.push(metadata[index]);
        }
    });
    return [filtered, filtered_meta];
}
exports.remove_duplicates = remove_duplicates;
function filter_type(nodes, metadata, type) {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];
    if (type === undefined)
        throw TypeError("undefined expression type passed");
    let type_filter;
    if (type instanceof String)
        type_filter = [type];
    else
        type_filter = type;
    let filtered = [], filtered_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        if (type_filter.includes(node.type)) {
            const meta = metadata[i];
            filtered.push(node);
            filtered_meta.push(meta);
        }
    }
    return [filtered, filtered_meta];
}
exports.filter_type = filter_type;
