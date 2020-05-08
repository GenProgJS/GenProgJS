import random
import genprogJS.Parameters as Parameters
import genprogJS.Logger as Logger
from genprogJS.Operator import Operator
import sys
import time


class GenprogAlgorithm(object):

    def __init__(self, initial_individual, operators):
        self.operators = operators
        self.initial_individual = initial_individual
        self.population = []
        self.repaired_programs = []
        self.algorithm_start_time = 0
        self.generation = 0

    def run_genprog(self):
        Logger.start_genetic_algorithm()

        if self.initial_individual.get_test_stat("buggy", "failed") <= 0:
            Logger.no_test_no_repair()
            return []

        self.initial_individual.refresh_fitness()
        self.population.append(self.initial_individual)

        for i in range(Parameters.POPULATION_SIZE):
            individual = self.initial_individual.copy()
            individual.set_fitness(self.initial_individual.get_fitness())
            self.population.append(individual)

        self.algorithm_start_time = time.time()

        while self.stopping_criteria():
            iteration_start_time = time.time()

            offsprings = []
            for operator in self.operators:
                probability = random.random()
                if probability < operator.probability:
                    offsprings.extend(operator.operate(self.population))

            probability = random.random()
            if probability < Parameters.CROSSOVER_PROBABILITY and len(self.population) > 2:
                rands = random.sample(range(0, len(self.population) - 1), 2)
                crossover = Operator("TreeCrossoverOperator", 1.0, True)
                offsprings.extend(crossover.operate([self.population[rands[0]], self.population[rands[1]]]))

            self.select_new_population(offsprings)

            best = min(self.population, key=lambda ind: ind.get_fitness())
            worst = max(self.population, key=lambda ind: ind.get_fitness())

            Logger.log_statistics(best, worst, self.population, len(self.repaired_programs), self.generation, time.time() - iteration_start_time)

            self.generation += 1

        return self.repaired_programs

    def stopping_criteria(self):
        gen_crit = self.generation < Parameters.MAX_GENERATIONS
        time_crit = (time.time() - self.algorithm_start_time) < Parameters.MAX_TIME
        size_crit = len(self.repaired_programs) < Parameters.MAX_SIZE

        if Parameters.STOP_CRIT == 'gen':
            return gen_crit
        elif Parameters.STOP_CRIT == 'time':
            return time_crit
        elif Parameters.STOP_CRIT == 'size':
            return size_crit
        elif Parameters.STOP_CRIT == 'and':
            return gen_crit and time_crit and size_crit
        elif Parameters.STOP_CRIT == 'or':
            return gen_crit or time_crit or size_crit
        else:
            return False

    def select_new_population(self, offsprings):
        Logger.start_fitness_refresh()
        for individual in offsprings:
            individual.refresh_fitness()
            if individual.get_fitness() != sys.maxsize:
                self.population.append(individual)

                if individual.get_failed_tests() <= individual.get_test_stat("buggy", "failed")\
                        and not self.candidate_already_generated(individual):
                    individual.set_repair_time(time.time() - self.algorithm_start_time)
                    individual.set_generation(self.generation)
                    self.repaired_programs.append(individual)

        self.population.sort(key=lambda ind: ind.get_fitness(), reverse=False)

        if len(self.population) > Parameters.POPULATION_SIZE:
            if len(self.population) > Parameters.POPULATION_SIZE * 1.2:
                self.population = self.population[0:int(Parameters.POPULATION_SIZE * 1.2)]
            self.population = random.sample(self.population, Parameters.POPULATION_SIZE)

    def candidate_already_generated(self, individual):
        return any([ind.get_modified_line() == individual.get_modified_line() for ind in self.repaired_programs])
