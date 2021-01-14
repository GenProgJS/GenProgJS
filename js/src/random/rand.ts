export class Rand {
    static range(first: number, last?: number | undefined, integer: boolean = true): number {
        if (last === undefined) {
            last = first;
            return Math.floor(last * Math.random());
        } else {
            if (integer)
                return Math.floor((last - first) * Math.random()) + first;
            else
                return (last - first) * Math.random() + first;
        }
    }


    static generate(length: number, func: Function | undefined = undefined, ...args: Array<any>): Array<number> {
        if (length <= 0)
            return [];

        let rands = [];

        if (func === undefined) {
            for (let i = 0; i < length; ++i) {
                rands.push(Math.random());
            }
        }
        else {
            if (args === undefined) {
                for (let i = 0; i < length; ++i) {
                    rands.push(func());
                }
            }
            else {
                for (let i = 0; i < length; ++i) {
                    rands.push(func(...args));
                }
            }
        }

        return rands;
    }
}
