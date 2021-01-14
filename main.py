import sys, os
sys.path.insert(0, os.path.abspath('..'))
from genprogJS.GenprogAlgorithm import GenprogAlgorithm
from genprogJS.Operator import Operator
from genprogJS.Individual import Individual
import genprogJS.Parameters as Parameters
import genprogJS.Logger as Logger
import argparse
import shutil
import pathlib
import json
import time


def main():
    args = handle_params()
    clear_working_dir()

    initial_individual = Individual()
    initial_individual.set_args(args)
    initial_individual.checkout()

    with open(args["file"], encoding='utf-8') as f:
        original_code = f.readlines()
    original_code = [x.strip() for x in original_code]

    initial_individual.set_code(original_code)
    os.chdir(Parameters.ROOT_DIR)

    Logger.print_project_info(args, initial_individual)

    operators = [Operator(name="ArithmeticBinaryOperatorChanger", probability=0.8),
                 Operator(name="ArraySubscripterOperator", probability=0.8),
                 Operator(name="AsyncFunctionOperator", probability=0.8),
                 Operator(name="AwaitInserterOperator", probability=0.8),
                 Operator(name="BinaryOperatorChanger", probability=0.8),
                 Operator(name="BitwiseBinaryOperatorChanger", probability=0.8),
                 Operator(name="CallChangerOperator", probability=0.8),
                 Operator(name="ConditionalBinaryOperatorChanger", probability=0.8),
                 Operator(name="ConditionalChangerOperator", probability=0.8),
                 Operator(name="DeclarationChangerOperator", probability=0.8),
                 Operator(name="EvalMutationOperator", probability=0.8),
                 Operator(name="ExprReplacerOperator", probability=0.8),
                 Operator(name="ExprStatementChangerOperator", probability=0.8),
                 Operator(name="ExprStatementInserterOperator", probability=0.8),
                 Operator(name="ExprStatementRemoverOperator", probability=0.8),
                 Operator(name="FunctionCallRemoverOperator", probability=0.8),
                 Operator(name="FunctionCallRemoverOperator", probability=0.8),
                 Operator(name="FunctionMakerOperator", probability=0.8),
                 Operator(name="IfElseChangerOperator", probability=0.8),
                 Operator(name="LogicalExprChangerOperator", probability=0.8),
                 Operator(name="LoopFixOperator", probability=0.8),
                 Operator(name="MutExprStatementChangerOperator", probability=0.8),
                 Operator(name="MutExprStatementInserterOperator", probability=0.8),
                 Operator(name="NullCheckOperator", probability=0.8),
                 Operator(name="NumberChangerOperator", probability=0.8),
                 Operator(name="ReturnInsertOperator", probability=0.8),
                 Operator(name="ReturnNoneOperator", probability=0.8),
                 Operator(name="ShiftOperatorChanger", probability=0.8),
                 Operator(name="StringChangerOperator", probability=0.8),
                 Operator(name="SwitchCaseChangerOperator", probability=0.8),
                 Operator(name="SwitchChangerOperator", probability=0.8),
                 Operator(name="TernaryChangerOperator", probability=0.8),
                 Operator(name="TryCatcherOperator", probability=0.8),
                 Operator(name="UpdateExpressionChangerOperator", probability=0.8),
                 Operator(name="VarChangerOperator", probability=0.8)
    ]

    start = time.time()
    genprog = GenprogAlgorithm(initial_individual, operators)
    repair_candidates = genprog.run_genprog()
    end = time.time()

    Logger.log_general_info(end - start, len(repair_candidates), args)

    if len(repair_candidates) > 0:
        Logger.print_candidates(repair_candidates)
        Logger.write_to_file(repair_candidates)
    else:
        Logger.genprog_failed()


def handle_params():
    parser = argparse.ArgumentParser(description='GenprogJS - a generic Automatic Repair tool for JavaScript')
    parser.add_argument('-p', '--project', required=True, choices=get_projects(), help='Project to repair.')
    parser.add_argument('-b', '--bug-ID', required=True, help='Bug-ID from BugsJS.')
    parser.add_argument('-o', '--output', default='', help='The output folder, where the candidates will be written.')
    parser.add_argument('-v', '--verbose', choices=['0', '1', '2', '3'], default='1',
                        help='Controls the detail of console messages.')
    parser.add_argument('-l', '--log', choices=['0', '1', '2'], default='1',
                        help='Controls the detail of file system logging.')
    parser.add_argument('-s', '--pop_size', default=str(Parameters.POPULATION_SIZE),
                        help='The size of the population.')
    parser.add_argument('-c', '--stop_crit', choices=['gen', 'time', 'size', 'and', 'or'], default=Parameters.STOP_CRIT,
                        help='Stopping criteria:\n -gen: stopping by reaching the maximum generation number (see -mg)'
                             '\n -time: stopping when the run time goes beyond the specified value (seconds, see -ms)'
                             '\n -size: stopping by reaching the specified number of repair candidates (see -mt)'
                             '\n -and: all of the above criteria must meet'
                             '\n -or: any of the above criteria must meet')
    parser.add_argument('-mg', '--max_gen', default=str(Parameters.MAX_GENERATIONS),
                        help='Max number of generations, if stop_crit == \"gen\" (see -c)')
    parser.add_argument('-ms', '--max_size', default=str(Parameters.MAX_SIZE),
                        help='Max size of repair candidates, if stop_crit == \"size\" (see -c)')
    parser.add_argument('-mt', '--max_time', default=str(Parameters.MAX_TIME),
                        help='Max running time, if stop_crit == \"time\" (see -c)')
    parser.add_argument('-dp', '--drop_plausible', default=str(Parameters.DROP_PLAUSIBLE), choices={'True', 'False'},
                        help='Drop plausible patch from the population, so it won\'t affect later generations.')

    param_dict = {}
    args = parser.parse_args()
    param_dict["project"] = args.project
    param_dict["bug-ID"] = args.bug_ID

    if param_dict["project"] == 'Node-redis':
        param_dict["project"] = 'Node_redis'

    with open('data/bugsjs-bugs.json', encoding='utf-8') as json_file:
        data = json.load(json_file)
        for p in data:
            if p['project'] == param_dict['project'] and int(p['bugId']) == int(param_dict['bug-ID']):
                for key in p['changedFiles']:
                    param_dict["file"] = str(key)
                    for key2 in p['changedFiles'][key]:
                        param_dict["index"] = int(p['changedFiles'][key][key2][0])
                        break
                    break
                break

    Parameters.ROOT_DIR = str(pathlib.Path().absolute())
    Parameters.VERBOSE = int(args.verbose)
    Parameters.LOG_LEVEL = int(args.log)
    Parameters.POPULATION_SIZE = int(args.pop_size)
    Parameters.STOP_CRIT = args.stop_crit
    Parameters.MAX_GENERATIONS = int(args.max_gen)
    Parameters.MAX_SIZE = int(args.max_size)
    Parameters.MAX_TIME = int(args.max_time)
    Parameters.DROP_PLAUSIBLE = bool(args.drop_plausible)
    
    if '' == args.output:
        Parameters.OUTPUT_DIR = args.project.lower() + '_' + str(args.bug_ID)
    else:
        Parameters.OUTPUT_DIR = args.output

    if not os.path.exists(Parameters.OUTPUT_DIR):
        os.makedirs(Parameters.OUTPUT_DIR)

    return param_dict


def get_projects():
    scriptdir = os.path.abspath(os.path.dirname("BugsJS"))
    projects_set = set()
    projects_file = open(os.path.join(scriptdir, "../Projects.csv"), "r")
    lines = projects_file.read().splitlines()
    for x in range(1, len(lines)):
        projects_set.add(lines[x].split(";")[0])
    projects_file.close()
    return list(projects_set)


def clear_working_dir():
    if os.path.isdir("../output"):
        try:
            shutil.rmtree("../output")
        except OSError as e:
            print("Error: %s - %s." % (e.filename, e.strerror))


main()
