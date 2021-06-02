
# Welcome to GenProgJS!

GenProgJS is a Test-based Automated Program Repair (APR) tool for JavaScript. It is written in Python and TypeScript by researchers to researchers. The main algorithm of GenProgJS is based on [GenProg](https://squareslab.github.io/genprog-code/), supplemented with JavaScript operators. 

## Getting started
GenProgJS comes with a preconfigured Docker environment in which one can easily try it. We encourage fellow researchers to use this enironment at first, this skips many configuration steps. However GenProgJS can be operate on native installation, see [Prerequisites](#Prerequisites).

To use the preconfigured environment, a Docker installation is required, it can be [downloaded](https://docs.docker.com/get-docker/) and installed for multiple platforms. 

First clone the GenProgJS-Docker repository:
```console
$ git clone https://github.com/GenProgJS/GenProgJS-Docker
```

After navigating inside the cloned repository (`cd ./GenProgJS-Docker/`), you can find the `run.sh` and `run.cmd` executables. Of these, run the appropriate one for your operating system. So e.g. for Unix based operating systems, do:
```console
$ ./run.sh
```

Docker will now prepare the environment and install every prerequisites. This might take a while, so now is the perfect moment to take a coffee break :coffee:. When the installation is complete, the script will also run the Docker image, and navigate the user to the `/work/genprogJS` folder. Here you should find another `run.sh` file, which will start GenProgJS on the Express 2 bug:
```console
$ ./run.sh
```

GenProgJS has a couple of command line arguments, we listed these in the following table.
| Option | Description | Required | Possible values | Default |
|---|---|---|---|---|
| -h, --help | Show the help message and exit. | - | - | - |
| -p, --project | The identifier of the project to repair. | :heavy_check_mark: | Karma, Bower, Pencilblue, Eslint, Node-redis, Express, Hexo, Shields, Hessian.js, Mongoose | -|
| -b, --bug-ID | The identifier (number) of the bug from BugsJS. | :heavy_check_mark: | It heavily depends on the project itself, for possible values please check the [bug dissection](https://bugsjs.github.io/dissection/#!/). | - |
| -o, --output | The output folder, where the candidates will be written. | :x: | - | [project]_[bug] |
| -v, --verbose |  Controls the detail of console messages. The higher the number, the more detailed the description. | :x: | 0, 1, 2, 3 | 1 |
| -l, --log |  Controls the detail of file system logging. The higher the number, the more detailed the logs are. | :x: | 0, 1, 2 | 1 |
| -s, --pop_size | Sets the size of the population. | :x: | - | 20 |
| -dp, --drop_plausible | Whether to remove a plausible patch from the population or not. | :x: | True, False | True |
| -c, --stop_crit | The stopping criteria of the algoriithm (stopping when the run time, number of plausible patches or generation reaches a specified value. See the following switches). | :x: | gen, time, size, and, or | gen |
| -mg, --max_gen | Maximum number of generations if the stopping criteria == *gen*. | :x: | - | 30 |
| -mt, --max_time | Maximum running time (in seconds) if the stopping criteria == *time*. | :x: | - | 100000 |
| -ms, --max_size | Maximum size of repair candidates if the stopping criteria == *size*. | :x: | - | 1000 |


Based on this table, the simplest run looks like this e.g. on the [Bower 2](https://bugsjs.github.io/dissection/#!/bug/Bower/2) bug:
```console
$ python3 main.py -p Bower -b 2
```

If you are not afraid of more advanced options, you can also run the tool e.g. in the following way on the [Eslint 100](https://bugsjs.github.io/dissection/#!/bug/Eslint/100) bug:
```console
$ python3 main.py -p Eslint -b 100 -o "myOutputDir" -v 0 -mg 50 
```
Other than these options, the genetic algorithm inside GenProgJS also have metaparameter options like positive ang negative weights in the fitness function or the probability to apply a crossover operator. These parameters can be found in the [Parameters.py](https://github.com/GenProgJS/GenProgJS/blob/master/Parameters.py) file, feel free to experiment with these. Individual operator probabilities van be found in [main.py](https://github.com/GenProgJS/GenProgJS/blob/master/main.py) starting from line 32.

## Dataset
GenProgJS integrates the [BugsJS dataset](https://bugsjs.github.io), which containes reproducible JavaScript bugs from 10 open-source Github projects. BugsJS features a rich interface for accessing the faulty and fixed versions of the programs and executing the corresponding test cases. Note that not every bug in the dataset have a failing test case, a good place to start exploring the dataset is it's [dissection page](https://bugsjs.github.io/dissection/#!/).

## Prerequisites
If you insist to use GenProgJS without the Docker environment, it requires (along with BugsJS) a number of tools to install, these are:
 - [Python 3](https://www.python.org/downloads/)
 - [pip](https://pypi.org/project/pip/)
 - [Node.js](https://nodejs.org/en/)
 - [Naked](https://pypi.org/project/Naked/) `pip3 install Naked`
 - [xlrd](https://pypi.org/project/xlrd/): `pip3 install xlrd`
 - [Esprima](https://esprima.org)`pip3 install esprima`
 - [Numpy](https://numpy.org) `pip3 install numpy`
 - [n](https://github.com/tj/n) `npm install -g n`
 - [Mocha](https://mochajs.org) `npm install --global mocha`
 - [Istanbul](https://istanbul.js.org) `npm install --save-dev nyc`
