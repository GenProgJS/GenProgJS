"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function re_indent(code, indent) {
    let patch_split = code.split('\n');
    for (let i = 1; i < patch_split.length; ++i) {
        patch_split[i] = ' '.repeat(indent) + patch_split[i];
    }
    return patch_split.join('\n');
}
exports.re_indent = re_indent;
