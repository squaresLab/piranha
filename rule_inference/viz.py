import pygraphviz as pgv
from tree_sitter import Language, Parser, Node
from tree_sitter_languages import get_language, get_parser

def create_graph(node: Node, graph=None, parent=None):
    if graph is None:
        graph = pgv.AGraph(directed=True)

    if not node.is_named:
        return graph
    # Create a node with unique id: id(node), use type of the node as label



    node_id = str(id(node))
    node_label = node.type

    if node.children == []:
        node_label = str(node.text.decode("utf-8"))


    graph.add_node(node_id, label=node_label)

    # If this node has a parent, then we should add an edge.
    if parent is not None:
        parent_id = str(id(parent))
        graph.add_edge(parent_id, node_id)

    # Recurse on children
    for child in node.children:
        create_graph(child, graph, node)

    return graph

def parse_code_to_tree(code, parser):
    tree = parser.parse(bytes(code, "utf8"))
    return tree.root_node

def main():
    # load language
    LANGUAGE = get_language('java')

    # Create a parser
    parser = Parser()
    parser.set_language(LANGUAGE)

    code = """
class A {
	void randomMethod() {
    Response response =
        target("/debug/ops")
            .register(new ThriftMessageBodyProvider())
            .request()
            .accept(ThriftMediaType.APPLICATION_JSON)
            .post(Entity.entity(payload, ThriftMediaType.APPLICATION_JSON), Response.class);
}
    """
    root_node = parse_code_to_tree(code, parser)
    graph = create_graph(root_node)

    # Output to a dot file
    graph.write('output.dot')

    # Alternatively, you can immediately render the graph
    graph.layout(prog='dot')
    graph.draw('output2.png')

if __name__ == "__main__":
    main()
