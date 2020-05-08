class ArgParser {
	
    public static encode_src(code: string): string {
        return code.split('\n').join('___EOL___');
    }

    public static decode_src(code: string): string {
        return code.split('___EOL___').join('\n');
    }

}

export { ArgParser };