import { run_operator, ops, run_all } from "./runner/index";

if (process.argv[2].toLowerCase() === "all") {
    run_all();
}
else {
    const operator = ops[process.argv[2]];
    run_operator(operator);
}