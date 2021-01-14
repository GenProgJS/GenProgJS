import os
import genprogJS.Parameters as Parameters


def start_fitness_refresh():
    if Parameters.VERBOSE > 0:
        print('Refreshing fitness values...')


def start_genetic_algorithm():
    if Parameters.VERBOSE > 0:
        print('Starting the genetic algorithm...')


def genprog_failed():
    if Parameters.VERBOSE > 0:
        print('Failed to generate a patch...\n')


def print_project_info(args, individual):
    if Parameters.VERBOSE > 0:
        print('\nFixing bugs for project ' + args['project'] + ', bug-ID: ' + args['bug-ID'])
        print('---------------------------------- Buggy line ----------------------------------')
        print(individual.get_modified_line())
        print('--------------------------------------------------------------------------------')


def write_to_file(population):
    if Parameters.LOG_LEVEL > 0:
        if not os.path.exists(Parameters.OUTPUT_DIR):
            os.makedirs(Parameters.OUTPUT_DIR)
        for individual in population:
            args = individual.get_args()
            filename = args['project'] + '_' + str(args['bug-ID']) + '_' + str(Parameters.CANDIDATE_INDEX)
            Parameters.CANDIDATE_INDEX += 1

            with open(Parameters.OUTPUT_DIR + '/' + filename + '.js', 'w', encoding='utf-8') as file:
                file.write("\n".join(individual.get_code()) + "\n")

            with open(Parameters.OUTPUT_DIR + '/' + filename + '.info', 'w', encoding='utf-8') as file:
                file.write('Generation: ' + str(individual.get_generation()) + '\n')
                file.write('Elapsed time: ' + str(individual.get_repair_time()) + 'sec\n')
                file.write('# of failed test cases in developer-fixed version: ' + str(individual.get_test_stat('buggy', 'failed')) + '\n')
                file.write('# of failed test cases in current version: ' + str(individual.get_failed_tests()) + '\n')
                file.write('List of applied operators:\n' + '\n'.join(individual.get_applied_operators()))


def log_statistics(best, worst, population, candidate_number, i, elapsed_time):
    mean = sum([individual.get_fitness() for individual in population]) / len(population)
    statistics = '---------------------------------- Statistics ----------------------------------\n' \
                 'It took ' + str(elapsed_time) + ' seconds to produce the ' + str(i + 1) + 'th generation.\n' \
                 'Best fitness: ' + str(best.get_fitness()) + '\n' \
                 'Worst fitness: ' + str(worst.get_fitness()) + '\n' \
                 'Mean fitness: ' + str(mean) + '\n' \
                 'Population size: ' + str(len(population)) + '\n' \
                 '"Best" modification so far: ' + best.get_code()[best.get_index()] + '\n' \
                 'Number of repair candidates: ' + str(candidate_number) + '\n' \
                 '--------------------------------------------------------------------------------\n'
    if Parameters.VERBOSE > 0:
        print(statistics)

    if Parameters.LOG_LEVEL > 0:
        with open(Parameters.OUTPUT_DIR + '/general_info.log', 'a', encoding='utf-8') as file:
            file.write(statistics)


def print_candidates(candidates):
    if Parameters.VERBOSE > 1:
        print('------------------------------- Repair candidates -------------------------------')
        i = 0
        for candidate in candidates:
            print("Candidate " + str(i) + ": " + candidate.get_modified_line())
            i += 1
        print('--------------------------------------------------------------------------------\n')


def start_test(individual):
    if Parameters.VERBOSE > 1:
        print("Testing candidate with the following modification: " + individual.get_modified_line())


def end_test(test_results):
    if Parameters.VERBOSE > 1:
        print("\nTest results for candidate: " + str(test_results))


def test_failed(filename):
    if Parameters.VERBOSE > 1:
        print("Test execution failed for individual.")
        if len(filename) > 0:
            print("Test trace is logged into the following file: " + Parameters.ROOT_DIR + '/temp/' + filename + '.log')


def run_operator(operator_name):
    if Parameters.VERBOSE > 2:
        print("Running " + operator_name + "...")


def log_general_info(elapsed_time, num_candidates, args):
    general_info = '\n-------------------------------- General info --------------------------------\n' \
                   'Project: ' + args["project"] + '\n' \
                    'Bug-ID: ' + args["bug-ID"] + '\n' \
                    'Total elapsed time: ' + str(elapsed_time) + ' sec' + '\n' \
                    'Number of generated candidates: ' + str(num_candidates) + '\n' \
                    '------------------------------------------------------------------------------\n'
    if Parameters.VERBOSE > 0:
        print(general_info)

    if Parameters.LOG_LEVEL > 0:
        with open(Parameters.OUTPUT_DIR + '/general_info.log', 'a', encoding='utf-8') as file:
            file.write(general_info)


def no_test_no_repair():
    print('There are no failed tests, thus the algorithm cannot run.')
