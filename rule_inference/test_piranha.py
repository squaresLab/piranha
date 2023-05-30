
from pathlib import Path
from polyglot_piranha import Filter, execute_piranha, PiranhaArguments, PiranhaOutputSummary, Rule, RuleGraph, OutgoingEdges
from os.path import join, basename
from os import listdir
import re



def main():
    delete_method = Rule (
        name= "add_field_declaration",
        query=
        """(
            (method_invocation object: (method_invocation) @child0
             name: (identifier) @child2
             arguments: (argument_list) @child3
             ) @root
        )
        """,
        replace_node="child2",
        replace="""{
}""",
        filters= set([
            Filter(
                contains = ["""(
                  (method_invocation 
                    (identifier ) @node0) @node1
                    (#eq? @node0 "client")
                )"""]
            )
        ]),
    )

    rule_graph = RuleGraph(
        rules= [delete_method],
        edges = []
    )

    code = """class A {
	void randomMethod() {
     Response response =
        resources
            .client()
            .register(new ThriftMessageBodyProvider())
            .target("/debug/ops")
            .request()
            .accept(ThriftMediaType.APPLICATION_JSON)
            .post(Entity.entity(payload, ThriftMediaType.APPLICATION_JSON), Response.class);
    }
    }"""

    args = PiranhaArguments(
        code_snippet=code,
        language="java",
        rule_graph = rule_graph,
        dry_run=True,
    )

    output_summaries = execute_piranha(args)
    print(output_summaries)

main()