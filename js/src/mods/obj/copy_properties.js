class _obj {
    static _copy(target, source) {
        if (target === source)
            return target;

        if (target instanceof Object && source instanceof Object &&
            target.constructor === source.constructor) {
            for (let key in target) {
                target[key] = source[key];
            }
        }
        
        return target;
    }
}


exports._obj = _obj;