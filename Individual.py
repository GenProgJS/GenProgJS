import sys
import esprima
import os
import subprocess
import string
import random
import genprogJS.Parameters as Parameters
import json
import myGit
import genprogJS.Logger as Logger
import xlrd


class Individual(object):

    test_result_cache = dict()

    def __init__(self, code="", args=None):
        if args is None:
            args = dict()
        self.code = code
        self.args = args.copy()
        self.already_tested = False
        self.fitness = sys.maxsize
        self.test_stat = {}
        self.applied_operators = list()
        self.repair_time = 0
        self.generation = 0

    def __eq__(self, other):
        return self.get_modified_line() == other.get_modified_line()

    def set_generation(self, generation):
        self.generation = generation

    def get_generation(self):
        return self.generation

    def set_repair_time(self, time):
        self.repair_time = time

    def get_repair_time(self):
        return self.repair_time

    def set_applied_operators(self, applied_operators):
        self.applied_operators = applied_operators.copy()

    def add_applied_operator(self, name):
        self.applied_operators.append(name)

    def get_applied_operators(self):
        return self.applied_operators

    def copy(self):
        individual = Individual(self.code, self.args)
        individual.set_applied_operators(self.applied_operators)
        individual.set_test_stat(self.test_stat)
        return individual

    def set_code(self, code):
        self.code = code

    def get_code(self):
        return self.code

    def set_fitness(self, fitness):
        self.fitness = fitness

    def get_fitness(self):
        return self.fitness

    def set_index(self, index):
        self.args["index"] = str(index)

    def get_index(self):
        return int(self.args["index"]) - 1

    def set_args(self, args):
        self.args = args

    def get_args(self):
        return self.args

    def get_project(self):
        return self.args["project"]

    def get_bug_id(self):
        return self.args["bug-ID"]

    def set_test_stat(self, test_stat):
        self.test_stat = test_stat.copy()

    def get_failed_tests(self):
        return int(self.test_stat["failures"])

    def get_passed_tests(self):
        return int(self.test_stat["passes"])

    def get_modified_line(self):
        return self.get_code()[self.get_index()]

    def checkout(self):
        os.chdir('..')
        self.args["version"] = "fixed-only-test-change"
        self.args["task"] = "test"
        self.args["output"] = "output/"

        if self.args["project"] == 'Node_redis':
            self.args["project"] = 'Node-redis'
            myGit.checkout(self.args)
            self.args["project"] = 'Node_redis'
        else:
            myGit.checkout(self.args)

    def refresh_fitness(self):

        Logger.start_test(self)

        if self.already_tested:
            return

        if self.get_modified_line() in self.test_result_cache:
            self.already_tested = True
            return self.test_result_cache[self.get_modified_line()]

        try:
            esprima.parseScript("\n".join(self.get_code()))

            with open("../output/" + self.args["project"].lower() + "/" + self.args["file"], 'w', encoding='utf-8') as file:
                file.write("\n".join(self.get_code()))

            if not os.path.exists(Parameters.ROOT_DIR + '/temp'):
                os.makedirs(Parameters.ROOT_DIR + '/temp')

            filename = ''.join(random.choice(string.ascii_lowercase) for _ in range(20))
            path = str(Parameters.ROOT_DIR) + "/" + Parameters.TEMP_DIR + filename + '.test'

            command = 'python3 Tester.py ' + self.parse_arguments(path) + " > " + Parameters.ROOT_DIR + '/temp/' + filename + '.log'

            if Parameters.VERBOSE < 3:
                command += " 2>&1"

            process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)
            process.wait()

            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as file:
                    test_stat = json.loads(file.readline().strip())

                    self.fitness = float(
                        Parameters.W_POS * test_stat["passes"] + Parameters.W_NEG * test_stat["failures"])
                    self.already_tested = True
                    self.test_stat = test_stat
                    self.test_result_cache[self.get_modified_line()] = str(test_stat)

                    Logger.end_test(test_stat)
                os.remove(path)
            else:
                self.test_execution_failed(filename)

        except esprima.Error:
            self.test_execution_failed("")

    def parse_arguments(self, filename):
        return "-p " + self.args["project"] + " -b " + self.args["bug-ID"] + " -f " + filename

    def test_execution_failed(self, filename):
        self.fitness = sys.maxsize
        Logger.test_failed(filename)

    def get_test_stat(self, revision, test_type):
        workbook = xlrd.open_workbook(str(Parameters.ROOT_DIR) + "/data/bug_stats_fixed_only.xls")
        worksheet = workbook.sheet_by_index(0)

        i = 0
        j = 0
        while "Shields" not in worksheet.cell(i, 0).value:
            project = self.get_project()
            if project == 'Node_redis':
                project = 'Node-redis'
            if (project in worksheet.cell(i, 0).value
                    and str(self.get_bug_id()) in worksheet.cell(i, 0).value
                    and revision in worksheet.cell(i, 0).value):
                if test_type == "all":
                    j = 1
                elif test_type == "passed":
                    j = 2
                elif test_type == "pending":
                    j = 3
                elif test_type == "failed":
                    j = 4
                break

            i = i + 1

        return int(worksheet.cell(i, j).value)

    def insert_line(self, index, line):
        lines = self.code.split('\n')
        # make sure to insert only one line
        line = line.strip('\n')
        lines.insert(index, line)
        self.code = '\n'.join(lines)

    def remove_line(self, index):
        lines = self.code.split('\n')
        lines.pop(index)
        self.code = '\n'.join(lines)

    def insert_origin(self, individual: 'Individual'):
        """
        Inserts the original line by another individual

        :param individual: another Individual object, possibly the one containing the original source code
        :return:
        """
        original_line = individual.code.split('\n')[individual.get_index()]
        self.insert_line(self.get_index(), '___ORIGIN___:' + original_line)

    def remove_origin(self):
        """
        Removes lines marked with '___ORIGIN___:'

        :return:
        """
        lines = self.code.split('\n')
        lines = list(filter(lambda line: line.find('___ORIGIN___:') < 0, lines))
        self.code = '\n'.join(lines)
