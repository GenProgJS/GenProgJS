## GenProgJS: a Baseline System for Test-based Automated Repair of JavaScript Programs 
Originally, [GenProg](https://squareslab.github.io/genprog-code) was created to repair buggy programs written in the C programming language, launching a new discipline in Generate-and-Validate approach of Automated Program Repair (APR). Since then, a number of other tools has been published using a variety of repair approaches. Some of these still operate on programs written in C/C++, others on Java or even Python programs. In this work, a tool named GenProgJS is presented, which generates candidate patches for faulty JavaScript programs. The algorithm it uses is very similar to the genetic algorithm used in the original GenProg, hence the name. In addition to the traditional approach, solutions used in some more recent works were also incorporated, and JavaScript language-specific approaches were also taken into account when the tool was designed. To the best of our knowledge, the tool presented here is the first to apply GenProg’s general  generate-and-validate approach to JavaScript programs. We evaluate the method on the BugsJS bug database, where it successfully fixed 31 bugs in 6 open source Node.js projects. These bugs belong to 14 different categories showing the generic nature of the method. During the experiments, code transformations applied on the original source code are all traced, and an in-depth analysis of mutation operators and fine-grained changes are also presented. We share our findings with the APR research community and describe the difficulties and differences we faced while designed this JavaScript repair tool. The source code of GenProgJS is publicly available on Github, with a pre-configured Docker environment where it can easily be launched.


## Online appendix components
 - [GenProgJS source code](https://genprogjs.github.io/GenProgJS/) (this page)
 - [Docker environment](https://genprogjs.github.io/GenProgJS-Docker/)
 - [Experiment data](https://genprogjs.github.io/experiments/)


## Approach
GenProgJS is a Test-based Automated Program Repair (APR) tool for JavaScript. It is written in Python and TypeScript by researchers to researchers. The main algorithm of GenProgJS is based on [GenProg](https://squareslab.github.io/genprog-code/), supplemented with JavaScript operators. The following figure illustrates a high-level overview of the architecture of the tool. For more details [read the paper](https://github.com/GenProgJS/GenProgJS/blob/master/paper.pdf) or check out the [source code](https://github.com/GenProgJS/GenProgJS).

<object data="./fig/architecture.pdf" type="application/pdf" width="700px" height="400px">
    <embed src="./architecture.pdf">
        <p>This browser does not support PDFs. Please download the PDF to view it: <a href="./fig/architecture.pdf">Download PDF</a>.</p>
    </embed>
</object>


## Dataset
GenProgJS integrates the [BugsJS dataset](https://bugsjs.github.io), which containes reproducible JavaScript bugs from 10 open-source Github projects. BugsJS features a rich interface for accessing the faulty and fixed versions of the programs and executing the corresponding test cases. Note that not every bug in the dataset have a failing test case, a good place to start exploring the dataset is it's [dissection page](https://bugsjs.github.io/dissection/#!/).


## Results
GenProgJS found plausible repairs for 31 bugs in 6 Node.js projects. In the following table we summarize the results. The numbered columns (from column 3 to 8) indicate the number of generated patches in each independent run. The shapes in column 2 have the following meaning: :heavy_check_mark: syntactic match, :white_check_mark: semantic match, :negative_squared_cross_mark: uncertain.

| Bug Id | Correct fix? | #1 | #2 | #3 | #4 | #5 |
|---|---|---|---|---|---|---|
| [Bower 2](https://bugsjs.github.io/dissection/#!/bug/Bower/2) | :negative_squared_cross_mark: | - | 2 | - | - | 1 |
| [Eslint 1](https://bugsjs.github.io/dissection/#!/bug/Eslint/1) | :negative_squared_cross_mark: | 1 | 3 | 4 | 6 | - |
| [Eslint 7](https://bugsjs.github.io/dissection/#!/bug/Eslint/7) | :negative_squared_cross_mark: | 15 | 16 | - | 17 | 29 |
| [Eslint 41](https://bugsjs.github.io/dissection/#!/bug/Eslint/41) | :negative_squared_cross_mark: | - | 2 | 3 | - | 1 |
| [Eslint 47](https://bugsjs.github.io/dissection/#!/bug/Eslint/47) | :heavy_check_mark: | 1 | 1 | 3 | 1 | 1 |
| [Eslint 72](https://bugsjs.github.io/dissection/#!/bug/Eslint/72) | :heavy_check_mark: | 3 | 4 | 7 | 5 | 7 |
| [Eslint 94](https://bugsjs.github.io/dissection/#!/bug/Eslint/94) | :negative_squared_cross_mark: | 70 | 94 | 14 | 67 | 114 |
| [Eslint 100](https://bugsjs.github.io/dissection/#!/bug/Eslint/100) | :white_check_mark: | 20 | 26 | 12 | 9 | 26 |
| [Eslint 122](https://bugsjs.github.io/dissection/#!/bug/Eslint/122) | :negative_squared_cross_mark: | 1 | - | - | 1 | - |
| [Eslint 130](https://bugsjs.github.io/dissection/#!/bug/Eslint/130) | :negative_squared_cross_mark: | - | - | 1 | - | - |
| [Eslint 154](https://bugsjs.github.io/dissection/#!/bug/Eslint/154) | :negative_squared_cross_mark: | 21 | - | 25 | - | 29 |
| [Eslint 158](https://bugsjs.github.io/dissection/#!/bug/Eslint/158) | :negative_squared_cross_mark: | - | - | 34 | 24 | 20 |
| [Eslint 217](https://bugsjs.github.io/dissection/#!/bug/Eslint/217) | :white_check_mark: | 6 | 5 | 4 | 4 | 6 |
| [Eslint 221](https://bugsjs.github.io/dissection/#!/bug/Eslint/221) | :white_check_mark: | 100 | 334 | 221 | 202 | 183 |
| [Eslint 321](https://bugsjs.github.io/dissection/#!/bug/Eslint/321) | :white_check_mark: | 9 | 4 | 5 | 8 | 13 |
| [Eslint 323](https://bugsjs.github.io/dissection/#!/bug/Eslint/323) | :heavy_check_mark: | 260 | 192 | 198 | 159 | 220 |
| [Express 2](https://bugsjs.github.io/dissection/#!/bug/Express/2) | :heavy_check_mark: | 2 | 5 | 4 | 115 | 19 |
| [Express 3](https://bugsjs.github.io/dissection/#!/bug/Express/3) | :negative_squared_cross_mark: | 1 | - | - | - | 3 |
| [Express 5](https://bugsjs.github.io/dissection/#!/bug/Express/5) | :negative_squared_cross_mark: | 23 | 61 | 57 | 15 | 100 |
| [Express 8](https://bugsjs.github.io/dissection/#!/bug/Express/8) | :white_check_mark: | 487 | 350 | 402 | 284 | 468 |
| [Express 9](https://bugsjs.github.io/dissection/#!/bug/Express/9) | :negative_squared_cross_mark: | - | - | - | 1 | - |
| [Express 16](https://bugsjs.github.io/dissection/#!/bug/Express/16) | :negative_squared_cross_mark: | 20 | - | 20 | 20 | 19 |
| [Express 18](https://bugsjs.github.io/dissection/#!/bug/Express/18) | :negative_squared_cross_mark: | 122 | 151 | 67 | 110 | 127 |
| [Express 26](https://bugsjs.github.io/dissection/#!/bug/Express/26) | :negative_squared_cross_mark: | - | 1 | - | - | - |
| [Karma 3](https://bugsjs.github.io/dissection/#!/bug/Karma/3) | :white_check_mark: | 1 | 2 | 3 | 2 | - |
| [Karma 4](https://bugsjs.github.io/dissection/#!/bug/Karma/4) | :negative_squared_cross_mark: | - | - | 1 | - | - |
| [Karma 9](https://bugsjs.github.io/dissection/#!/bug/Karma/9) | :negative_squared_cross_mark: | 28 | 30 | 22 | 20 | 31 |
| [Mongoose 3](https://bugsjs.github.io/dissection/#!/bug/Mongoose/3) | :heavy_check_mark: | 166 | 286 | 226 | 516 | 270 |
| [Mongoose 8](https://bugsjs.github.io/dissection/#!/bug/Mongoose/8) | :white_check_mark: | - | 4 | 4 | 22 | 12 |
| [Mongoose 11](https://bugsjs.github.io/dissection/#!/bug/Mongoose/11) | :negative_squared_cross_mark: | 300 | 477 | 382 | 588 | 147 |
| [Pencilblue 4](https://bugsjs.github.io/dissection/#!/bug/Pencilblue/4) | :negative_squared_cross_mark: | 5 | 3 | 4 | 4 | - |


## Contact
If you have any questions, don't hesitate to contact us:
Viktor Csuvik
E-mail: csuvikv [at] inf.u-szeged.hu

<img src="./fig/szte-logo.png" width="200" height="200">
