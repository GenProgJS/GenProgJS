export class Rand {
    static range(first: number, last?: number | undefined, integer: boolean = true) {
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
}
