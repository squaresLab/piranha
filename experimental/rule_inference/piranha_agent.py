import copy
import difflib
import json
import logging
import multiprocessing
import re
from typing import List, Optional, Tuple

import attr
import toml
from polyglot_piranha import PiranhaArguments, Rule, RuleGraph, execute_piranha
from tree_sitter import Tree
from tree_sitter_languages import get_language, get_parser

from experimental.rule_inference.comment_finder import CommentFinder
from experimental.rule_inference.controller import Controller
from experimental.rule_inference.piranha_chat import PiranhaGPTChat
from experimental.rule_inference.static_inference import Inference, QueryWriter
from experimental.rule_inference.utils.logger_formatter import CustomFormatter
from experimental.rule_inference.utils.node_utils import NodeUtils
from experimental.rule_inference.utils.patch import Patch
from experimental.rule_inference.utils.pretty_toml import PrettyTOML
from experimental.rule_inference.utils.rule_utils import RawRuleGraph

logger = logging.getLogger("PiranhaChat")
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
ch.setFormatter(CustomFormatter())
logger.addHandler(ch)


class PiranhaAgentError(Exception):
    pass


@attr.s
class PiranhaAgent:
    """
    This class defines an agent that uses OpenAI's chat models for inferring Piranha rules.
    The agent takes pairs of source and target codes, finds a transformation rule between them,
    and validates the rule's effectiveness by testing if the rule can refactor the source code into the target code.
    """

    source_code = attr.ib(type=str)
    target_code = attr.ib(type=str)
    language = attr.ib(default="java")
    hints = attr.ib(default="")
    chat = attr.ib(default=None)
    tree_sitter_language = attr.ib(default=None)
    tree_sitter_parser = attr.ib(default=None)
    language_mappings = {
        "java": "java",
        "kt": "kotlin",
    }  # This is necessary because get_parser and piranha expect different naming conventions

    def __attrs_post_init__(self):
        self.tree_sitter_language = get_language(
            self.language_mappings.get(self.language, self.language)
        )
        self.parser = get_parser(
            self.language_mappings.get(self.language, self.language)
        )

    def get_tree_from_code(self, code: str) -> Tree:
        tree = self.parser.parse(bytes(code, "utf8"))
        return tree

    def infer_rules(self, callback=None) -> Optional[Tuple[str, str]]:
        """Implements the inference process of the Piranha Agent.
        The function communicates with the AI model to generate a potential refactoring rule, and subsequently tests it.
        If the rule transforms the source code into the target code, the rule is returned.

        :return: str, string containing the rule in TOML format
        """
        source_tree = self.get_tree_from_code(self.source_code)
        target_tree = self.get_tree_from_code(self.target_code)

        rules = {}
        finder = CommentFinder(source_tree, target_tree)
        pairs = finder.process_trees()
        for comment_name, (nodes_before, nodes_after) in pairs.items():
            inference_engine = Inference(nodes_before, nodes_after)
            rule = inference_engine.static_infer()
            rules[comment_name] = rule

        # build a dict using finder.edges but with the rule names from rule_names
        edges = {
            rules[from_name].name: [rules[to_name].name for to_name in to_names]
            for from_name, to_names in finder.edges.items()
        }
        graph = RawRuleGraph(list(rules.values()), edges)
        rules = graph.to_toml()

        if callback:
            callback(rules)

        chat_interactions = self.create_chats(rules)

        # For each completion try to transform the source code into the target code
        return self.iterate_inference(chat_interactions)

    def remove_comments_from_code(self, code: str) -> str:
        """Removes all comments from the given code using Piranha."""
        rule = Rule(
            name="remove_comments",
            query="(line_comment) @comment",
            replace_node="comment",
            replace="",
        )
        graph = RuleGraph(rules=[rule], edges=[])
        args = PiranhaArguments(
            code_snippet=code,
            language=self.language,
            rule_graph=graph,
            dry_run=True,
        )
        output_summaries = execute_piranha(args)
        return output_summaries[0].content

    def create_chats(self, rules):
        # Remove all comments from source and target code using Piranha
        self.source_code = self.remove_comments_from_code(self.source_code)
        self.target_code = self.remove_comments_from_code(self.target_code)

        source_tree = self.get_tree_from_code(self.source_code)
        target_tree = self.get_tree_from_code(self.target_code)

        source_tree_sexpr = NodeUtils.generate_sexpr(source_tree.root_node, 0)
        target_tree_sexpr = NodeUtils.generate_sexpr(target_tree.root_node, 0)
        # Create diff between source and target code using difflib
        diff = list(
            difflib.unified_diff(
                self.source_code.splitlines(), self.target_code.splitlines()
            )
        )
        diff = "\n".join(diff)
        # diff = self.append_diff_information(diff, source_tree, target_tree)
        # Cleanup source
        prompt_holes = {
            "source_code": self.source_code,
            "source_tree": source_tree_sexpr,
            "target_tree": target_tree_sexpr,
            "diff": diff,
            "rules": rules,
            "hints": self.hints,
        }
        # Number of Chat interactions to have with the model
        n_samples = 15
        chat_interactions = [
            PiranhaGPTChat(holes=prompt_holes) for _ in range(n_samples)
        ]
        first_round = chat_interactions[0].get_completion(n_samples=n_samples)
        for i, response in enumerate(first_round):
            # Hack to prevent running the prompt multiple times (it's the same for all samples)
            # It is cheaper just to sample OpenAI API
            chat_interactions[i].append_system_message(response)
        return chat_interactions

    def get_explanation(self, rules):
        self.chat.append_explanation_request(rules)
        response = self.chat.get_model_response()
        response = re.sub(r"```md(.*)```", r"\1", response)
        return response

    def iterate_inference(self, chat_interactions):
        """BFS for a rule that transforms the source code into the target code."""
        max_rounds = 10
        for i in range(max_rounds):
            for chat in chat_interactions:
                try:
                    file_name, toml_block = self.validate_rule_wrapper(chat)
                    self.chat = chat
                    return file_name, toml_block
                except PiranhaAgentError as e:
                    logger.debug(
                        f"GPT-4 failed to generate a rule. Following up the next round with {e}. Trying again...\n"
                    )
                    chat.append_user_followup(str(e))
        raise PiranhaAgentError(
            f"Failed to generate a rule after {max_rounds} rounds of interaction with GPT-4."
        )

    def append_diff_information(self, diff, source_tree, target_tree):
        patches: List[Patch] = Patch.from_diffs(diff)
        # Append to the diff the information about the deleted lines for each patch
        diff += "\n=== Draft queries to represent deleted lines ===\n\n"
        for patch in patches:
            node_pairs = patch.get_nodes_from_patch(source_tree, target_tree)
            for nodes_before, nodes_after in node_pairs:
                for line, node in nodes_before.items():
                    q = QueryWriter([node])
                    diff += f"\n\n--------\n\nDelete Line: {line} \n\nCorresponding query:\n{q.write()}"
        return diff

    def validate_rule_wrapper(self, chat):
        # with Pool(processes=1) as pool:
        completion = chat.get_model_response()
        # result = pool.apply_async(self.validate_rule, (completion,))
        try:
            file_name, toml_block = self.validate_rule(completion)
            # file_name, toml_block = result.get(
            #    timeout=5
            # )  # Add a timeout of 5 seconds
            if file_name and toml_block:
                return file_name, toml_block

        except multiprocessing.context.TimeoutError:
            raise PiranhaAgentError(
                "Piranha in infinite loop. Please add a filter or constraint the query. "
                "Remember you can only constraint queries with #eq, #not-eq, #match. "
                "Otherwise you need to use a [[rules.filters]] with contains or not_contains."
            )

    def validate_rule(self, completion):
        # Define regex pattern for ```toml block
        pattern = r"```toml(.*?)```"
        # Extract all toml block contents
        toml_blocks = re.findall(pattern, completion, re.DOTALL)
        if not toml_blocks:
            raise PiranhaAgentError(
                "Could not create Piranha rule. There is no TOML block. "
                "Please create a rule to refactor the code."
            )

        try:
            toml_block = (
                toml_blocks[0].replace("parenthesized_expression", "condition").strip()
            )
            logger.debug(f"Generated rule: {toml_block}")
            toml_dict = toml.loads(toml_block)
        except Exception as e:
            raise PiranhaAgentError(
                f"Could not create Piranha rule. The TOML block is not valid: {e}. "
            )

        piranha_summary = self.run_piranha(toml_dict)
        if not piranha_summary:
            raise PiranhaAgentError(
                "Piranha did not generate any refactored code. Either the query or the filters are incorrect. "
            )
        refactored_code = piranha_summary[0].content
        if self.normalize_code(refactored_code) != self.normalize_code(
            self.target_code
        ):
            raise PiranhaAgentError(
                f"The rule produced wrong code!!! "
                f"Expected:\n{self.target_code}\n\n but got:\n{refactored_code}\n\n"
            )
        pattern = r"<file_name_start>(.*?)<file_name_end>"
        file_names = re.findall(pattern, completion, re.DOTALL)
        file_name = file_names[0] if file_names else "rule.toml"
        return file_name, toml_block

    def run_piranha(self, toml_dict):
        """Runs the inferred rule by applying it to the source code using the Piranha.

        :param toml_dict: dict, Inferred rule in TOML format.
        :return: list, Summaries of the results of the execution of Piranha.
        """
        rules = toml_dict.get("rules", [])
        if not rules:
            raise PiranhaAgentError("TOML does not include any rule specifications.")
        try:
            raw_graph = RawRuleGraph.from_toml(toml_dict)
            logger.debug(f"Raw graph: {raw_graph.to_toml()}")
            args = PiranhaArguments(
                code_snippet=self.source_code,
                language=self.language,
                rule_graph=raw_graph.to_graph(),
                dry_run=True,
            )

            output_summaries = execute_piranha(args)

        except BaseException as e:
            if "QueryError" in str(e):
                raise PiranhaAgentError(
                    f"One of the provided queries is not valid {e}. "
                    f"Do not use nodes you cannot see in the tree representation. "
                    f"Make sure you parenthesis are balanced."
                )
            raise PiranhaAgentError(f"Piranha failed to execute: {e}.")
        return output_summaries

    def improve_rule(self, task: str, rules: str):
        """Improves the rule by adding a filter to it.

        :param desc: str, Description of what you would like to do.
        :param rule: str, Rules to improve.
        :return: str, Improved rule.
        """
        max_rounds = 15
        rules = toml.loads(rules)
        chat = copy.deepcopy(self.chat)
        for _ in range(max_rounds):
            try:
                controller = Controller(chat)
                updated_rules = []
                for rule in rules.get("rules", []):
                    rule_str = toml.dumps(rule, encoder=PrettyTOML())
                    should_improve = controller.should_improve_rule(task, rule_str)
                    if should_improve:
                        option = controller.get_option_for_improvement(rule_str)
                        if option == "add filter":
                            rule = self.add_filter(task, rule, chat)
                            updated_rules.append(rule)
                            continue
                    updated_rules.append(rule)
                rule_block = "\n".join(
                    [toml.dumps(rule, encoder=PrettyTOML()) for rule in updated_rules]
                )
                validation = self.validate_rule(
                    f"<file_name_start>rules.toml<file_name_end> ```toml\n{rule_block}\n```"
                )
                self.chat = chat
                return validation
            except Exception as e:
                logger.debug(
                    f"GPT-4 failed to generate a rule. Following up the next round with {e}. Trying again...\n"
                )
                chat.append_user_followup(str(e))

    def add_filter(self, desc, rule, chat):
        """Adds a filter to the rule that encloses the nodes of the rule."""

        query = rule.get("query")
        source_tree = self.get_tree_from_code(self.source_code)
        tree_sitter_q = self.tree_sitter_language.query(query)
        captures = tree_sitter_q.captures(source_tree.root_node)
        captured_nodes = NodeUtils.get_smallest_nonoverlapping_set(
            [c[0] for c in captures]
        )
        enclosing_nodes = []
        # Get the nodes that can be used as enclosing node for the rules
        for node in captured_nodes:
            while node:
                enclosing_nodes.append(node.sexp())
                node = node.parent
        chat.append_improve_request(
            desc,
            toml.dumps(rule, encoder=PrettyTOML()),
            enclosing_nodes,
        )
        completion = chat.get_model_response()
        pattern = r"```toml(.*?)```"
        # Extract all toml block contents
        toml_blocks = re.findall(pattern, completion, re.DOTALL)
        return toml.loads(toml_blocks[0])

    @staticmethod
    def normalize_code(code: str) -> str:
        """Eliminates unnecessary spaces and newline characters from code.
        This function is as preprocessing step before comparing the refactored code with the target code.

        :param code: str, Code to normalize.
        :return: str, Normalized code.
        """

        # replace multiple spaces with a single space
        code = re.sub(r"\s+", "", code)
        # replace multiple newlines with a single newline
        code = re.sub(r"\n+", "", code)
        # remove spaces before and after newlines
        code = re.sub(r" ?\n ?", "", code)
        # remove spaces at the beginning and end of the code
        code = code.strip()
        return code
