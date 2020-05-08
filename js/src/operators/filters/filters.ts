import { Syntax } from "esprima";
import estree from "estree";
import { Node } from "estree";


/**
 * @brief filter_duplicate_numerics - function to filter duplicate elements:
 * a numeric Literal will be filtered if the passed array contains
 * an UnaryExpression with the same offset
 *
 * @param unaries_and_numerics
 * @param unaries_and_numerics_meta
 */
export function filter_duplicate_numerics(unaries_and_numerics: Array<Node>, unaries_and_numerics_meta: Array<any>): Array<Array<Node> & Array<any>> {
    if (!unaries_and_numerics || unaries_and_numerics.length <= 0 ||
        !unaries_and_numerics_meta || unaries_and_numerics_meta.length <= 0)
        return [[], []];

    let filt_entries: Node[] = [];
    let filt_meta: any[] = [];

    // filter duplicate elements by UnaryExpressions
    for (let i = 0; i < unaries_and_numerics.length; ++i) {
        const entry = unaries_and_numerics[i];
        const meta = unaries_and_numerics_meta[i];
        let found = false;

        // find an UnaryExpression with the same offset
        // as the Numeric Literal
        if (entry.type === Syntax.Literal) {
            for (let j = 0; j < unaries_and_numerics.length; ++j) {
                const find_entry = unaries_and_numerics[j];

                if (find_entry.type === Syntax.UnaryExpression) {
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


export function filter_lower_orders(nodes: Array<Node>, metadata: Array<any>): Array<Array<Node> & Array<any>> {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];

    let filt_entries: Node[] = [];
    let filt_meta: any[] = [];

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


export function filter_by_offset(nodes: Array<Node>, metadata: Array<any>, ref_meta: any, left_offset_threshold?: number | undefined | null, right_offset_threshold?: number | undefined | null): Array<Array<Node> & Array<any>> {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];

    left_offset_threshold = left_offset_threshold === null ? undefined : left_offset_threshold;
    right_offset_threshold = right_offset_threshold === null ? undefined : right_offset_threshold;
    left_offset_threshold = isNaN(Number(left_offset_threshold)) ? undefined : Number(left_offset_threshold);
    right_offset_threshold = isNaN(Number(right_offset_threshold)) ? undefined : Number(right_offset_threshold);

    if (ref_meta === undefined)
        throw TypeError("undefined reference metadata passed");

    let new_nodes: Node[] = [];
    let new_metadata: any[] = [];

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


export function remove_brackets(str: string): string {
    if (!str)
        return str;

    if (str.indexOf('(') === 0 && str.indexOf(')', str.length - 1) === str.length - 1)
        return str.substr(1, str.length - 2);

    return str;
}


export function filter_expr_type(nodes: Array<estree.ExpressionStatement | estree.Expression>, metadata: Array<any>, expr_type: string): Array<Array<estree.ExpressionStatement | estree.Expression> & Array<any>> {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];

    if (expr_type === undefined)
        throw TypeError("undefined expression type passed");

    let filtered = [], filtered_meta = [];
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
    
        // ExpressionStatements case
        if ((node as estree.ExpressionStatement).expression) {
            const expr_statement: estree.ExpressionStatement = node as estree.ExpressionStatement;
            if (expr_statement.expression.type === expr_type) {
                const meta = metadata[i];
    
                filtered.push(node);
                filtered_meta.push(meta);
            }
        }
        // Simple Expressions case
        else if (node.type === expr_type) {
            const meta = metadata[i];

            filtered.push(node);
            filtered_meta.push(meta);
        }
    }

    return [filtered, filtered_meta];
}


export type OperatorHolder = estree.UnaryExpression |
    estree.BinaryExpression |
    estree.AssignmentExpression |
    estree.UpdateExpression |
    estree.LogicalExpression;


export function filter_by_operator(nodes: Array<OperatorHolder>, metadata: Array<any>, operator: string): Array<Array<OperatorHolder> & Array<any>> {
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


// TODO: add more? remove?
const operator_t: { [key: string]: string[] } = {
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

export function filter_by_operator_type(nodes: Array<OperatorHolder>, metadata: any, operator: string): Array<Array<OperatorHolder> & Array<any>> {
    if (!nodes || nodes.length <= 0 ||
        !metadata || metadata.length <= 0)
        return [[], []];

    if (operator === undefined)
        throw TypeError("undefined operator type passed");

    let type: string | undefined = undefined;
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

export function filter_by_computed_member(nodes: Array<estree.MemberExpression>, metadata: Array<any>, computed: boolean): Array<Array<estree.MemberExpression> & Array<any>> {
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


export function filter_by_left_right(nodes: Array<estree.AssignmentExpression>, metadata: Array<any>, assignment: estree.AssignmentExpression) {
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

export function filter_between(nodes: Array<Node>, metadata: Array<any>, left: number, right: number): Array<Array<Node> & Array<any>> {
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