from Naked.toolshed.shell import execute_js
from genprogJS.Individual import Individual
import genprogJS.Parameters as Parameters
import string
import random
import os
import genprogJS.Logger as Logger
import subprocess


def change_eval_in_source(source, new_code):
    if "eval(" not in source:
        return source
    i = source.index("eval(") + 5
    start = i
    end = len(source)
    par = 1
    while i < end:
        i += 1
        if source[i] == "(":
            par += 1
        elif source[i] == ")":
            par -= 1
            if par == 0:
                end = i
                break

    return source[0:start] + new_code + source[end:-1]


class Operator(object):
    js_file_path = "js/bin/src/index.js"

    def __init__(self, name, probability, is_crossover=False):
        self.name = name
        self.probability = probability
        self.is_crossover = is_crossover

    def operate(self, individuals):
        if len(individuals) < 1:
            return individuals

        line_index = individuals[0].get_index() + 1
        filename = ''.join(random.choice(string.ascii_lowercase) for _ in range(20))

        if not os.path.exists(Parameters.TEMP_DIR):
            os.makedirs(Parameters.TEMP_DIR)

        with open(Parameters.TEMP_DIR + filename + '.buggy', 'w', encoding='utf-8') as file:
            file.write(str(line_index) + "\n")
            for individual in individuals:
                file.write("___EOL___".join(individual.get_code()) + "\n")

        Logger.run_operator(self.name)

        subprocess.call("n 8.0.0 2>&1 > /dev/null", shell=True)

        abs_path = os.path.abspath(Parameters.TEMP_DIR + filename + '.buggy')
        response = execute_js(file_path=self.js_file_path, arguments=self.name + " " + abs_path)

        if os.path.exists(abs_path):
            os.remove(abs_path)

        if response:
            new_individuals = []

            if os.path.exists(Parameters.TEMP_DIR + filename + '.potential'):
                i = -1
                with open(Parameters.TEMP_DIR + filename + '.potential', 'r', encoding='utf-8') as file:
                    for new_code in file:
                        i += 1
                        if new_code == '' or new_code == '\n' or new_code == '\r\n':
                            continue
                        elif new_code.find("error::") == 0:
                            continue
                        elif len(individuals) <= i:
                            break

                        individual = individuals[i].copy()
                        splitted_new_code = new_code.strip().split('___EOL___')
                        if "".join(individual.get_code()) != "".join(splitted_new_code):

                            if self.name == "EvalMutationOperator":
                                splitted_new_code = change_eval_in_source(individual.get_code(), splitted_new_code)

                            individual.set_code(splitted_new_code)
                            if self.is_crossover:
                                individual.set_applied_operators([self.name + '; ' + individual.get_modified_line() + '; parents; ' + individuals[0].get_modified_line() + '; ' + individuals[1].get_modified_line()])
                            else:
                                individual.add_applied_operator(self.name + '; ' + individual.get_modified_line())

                            new_individuals.append(individual)

                os.remove(Parameters.TEMP_DIR + filename + '.potential')

            return new_individuals

        else:
            return individuals

