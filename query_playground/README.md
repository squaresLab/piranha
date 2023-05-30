# Piranha Query Playground

Welcome to the Piranha Query Playground! This tool is based on the original Tree Sitter Playground, and is designed to help users create and test Tree Sitter queries in an interactive manner. It allows users to select nodes and generate queries based on these selections. It can handle equality of nodes and generate relevant constraints.

## How to Run

To run this playground, you need Python 3 installed on your system. If you have Python 3 installed, you can start a simple HTTP server by navigating to the project directory and running the following command:

```bash
python3 -m http.server
```

This will start the HTTP server on port 8000 by default. You can specify a different port by appending it to the command, like so:

```bash
python3 -m http.server 8080
```

This command would start the server on port 8080. Once the server is running, you can access the playground by opening your web browser and navigating to `http://localhost:8000/playground.html` (or replace 8000 with the port you specified).

## Code Structure

The code is primarily based around two key functions: `handleEquality()` and `handleUserSelection()`.

- `handleUserSelection()`: This function is responsible for generating a basic Tree Sitter query that selects the smallest node that encompasses the user selection. It is triggered when the cursor is moved. If the 'equality' checkbox is checked, it will call the `handleEquality()` function instead. When a new selection is made, the graph and equal nodes are reset.

- `handleEquality()`: This function is called when a user selects something with the equal check-box on. It takes the user's selection from the code editor, adds it to a list of equal nodes, and generates a graph of parent-child relationships among these nodes. It then uses these equal nodes and the graph to generate a new query with appropriate constraints.
