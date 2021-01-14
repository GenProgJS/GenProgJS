export function re_indent(code: string, indent: number) {
    let patch_split = code.split('\n');
    for (let i = 1; i < patch_split.length; ++i) {
        patch_split[i] = ' '.repeat(indent) + patch_split[i];
    }
    return patch_split.join('\n');
}
