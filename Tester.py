import sys, os
sys.path.insert(0, os.path.abspath('..'))
import myTest
import argparse


def handle_params():
    parser = argparse.ArgumentParser(description='   ')
    parser.add_argument('-p', '--project', required=True, help='')
    parser.add_argument('-b', '--bug-ID', required=True, help='')
    parser.add_argument('-f', '--filename', help='')

    dict = {}
    args = parser.parse_args()
    dict["project"] = args.project
    dict["bug-ID"] = args.bug_ID
    dict["filename"] = args.filename
    dict["version"] = "fixed-only-test-change"
    dict["task"] = "test"
    dict["output"] = "output/"

    return dict


param_dict = handle_params()
os.chdir('../output/' + param_dict["project"].lower())

if param_dict["project"] == 'Node_redis':
    param_dict["project"] = 'Node-redis'

myTest.set_node_version(myTest.get_command(param_dict, "Node version"))

if myTest.get_command(param_dict, "Pre-command").count(".sh") == 0:
    myTest.run_pre_and_post_command(myTest.get_command(param_dict, "Pre-command"))
myTest.run_npm_install()
myTest.run_pre_and_post_command(myTest.get_command(param_dict, "Pre-command"))
myTest.run_test_command(myTest.get_command(param_dict, "Test command"))
test_stat = myTest.get_test_stat()
myTest.run_pre_and_post_command(myTest.get_command(param_dict, "Post-command"))

with open(param_dict["filename"], 'w', encoding='utf-8') as file:
    file.write("{ \"passes\": " + str(test_stat["passes"]) + ", \"failures\": " + str(test_stat["failures"]) + " }")