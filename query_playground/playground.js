/* ########## THIS CODE COMES FROM THE TREE SITTER PLAYGROUND  ##########
   ########## https://github.com/tree-sitter/tree-sitter/      ##########

 */

let tree;

(async () => {
  const CAPTURE_REGEX = /@\s*([\w\._-]+)/g;
  const COLORS_BY_INDEX = [
    "blue",
    "chocolate",
    "darkblue",
    "darkcyan",
    "darkgreen",
    "darkred",
    "darkslategray",
    "dimgray",
    "green",
    "indigo",
    "navy",
    "red",
    "sienna",
  ];
  const codeInput = document.getElementById("code-input");
  const languageSelect = document.getElementById("language-select");
  const loggingCheckbox = document.getElementById("logging-checkbox");
  const outputContainer = document.getElementById("output-container");
  const outputContainerScroll = document.getElementById(
    "output-container-scroll",
  );
  const playgroundContainer = document.getElementById("playground-container");
  const equalCheckbox = document.getElementById("equal-checkbox");
  const queryInput = document.getElementById("query-input");
  const updateTimeSpan = document.getElementById("update-time");
  const languagesByName = {};

  loadState();

  await TreeSitter.init();

  const parser = new TreeSitter();
  const codeEditor = CodeMirror.fromTextArea(codeInput, {
    lineNumbers: true,
    showCursorWhenSelecting: true,
  });

  const queryEditor = CodeMirror.fromTextArea(queryInput, {
    lineNumbers: true,
    showCursorWhenSelecting: true,
  });

  const cluster = new Clusterize({
    rows: [],
    noDataText: null,
    contentElem: outputContainer,
    scrollElem: outputContainerScroll,
  });
  const renderTreeOnCodeChange = debounce(renderTree, 50);
  const saveStateOnChange = debounce(saveState, 2000);
  const runTreeQueryOnChange = debounce(runTreeQuery, 50);

  let languageName = languageSelect.value;
  let treeRows = null;
  let treeRowHighlightedIndex = -1;
  let parseCount = 0;
  let isRendering = 0;
  let query;

  codeEditor.on("changes", handleCodeChange);
  codeEditor.on("viewportChange", runTreeQueryOnChange);
  codeEditor.on("cursorActivity", debounce(handleCursorMovement, 150));
  queryEditor.on("changes", debounce(handleQueryChange, 150));

  loggingCheckbox.addEventListener("change", handleLoggingChange);
  languageSelect.addEventListener("change", handleLanguageChange);
  outputContainer.addEventListener("click", handleTreeClick);

  await handleLanguageChange();

  playgroundContainer.style.visibility = "visible";

  async function handleLanguageChange() {
    const newLanguageName = languageSelect.value;
    if (!languagesByName[newLanguageName]) {
      const url = `tree-sitter-${newLanguageName}.wasm`;
      languageSelect.disabled = true;
      try {
        languagesByName[newLanguageName] = await TreeSitter.Language.load(url);
      } catch (e) {
        console.error(e);
        languageSelect.value = languageName;
        return;
      } finally {
        languageSelect.disabled = false;
      }
    }

    tree = null;
    languageName = newLanguageName;
    parser.setLanguage(languagesByName[newLanguageName]);
    await handleCodeChange();
    handleQueryChange();
  }

  async function handleCodeChange(editor, changes) {
    const newText = codeEditor.getValue() + "\n";
    const edits = tree && changes && changes.map(treeEditForEditorChange);

    const start = performance.now();
    if (edits) {
      for (const edit of edits) {
        tree.edit(edit);
      }
    }
    const newTree = parser.parse(newText, tree);
    const duration = (performance.now() - start).toFixed(1);

    updateTimeSpan.innerText = `${duration} ms`;
    if (tree) tree.delete();
    tree = newTree;
    parseCount++;
    renderTreeOnCodeChange();
    runTreeQueryOnChange();
    saveStateOnChange();
  }

  async function renderTree() {
    isRendering++;
    const cursor = tree.walk();

    let currentRenderCount = parseCount;
    let row = "";
    let rows = [];
    let finishedRow = false;
    let visitedChildren = false;
    let indentLevel = 0;

    for (let i = 0; ; i++) {
      if (i > 0 && i % 10000 === 0) {
        await new Promise((r) => setTimeout(r, 0));
        if (parseCount !== currentRenderCount) {
          cursor.delete();
          isRendering--;
          return;
        }
      }

      let displayName;
      if (cursor.nodeIsMissing) {
        displayName = `MISSING ${cursor.nodeType}`;
      } else if (cursor.nodeIsNamed) {
        displayName = cursor.nodeType;
      }

      if (visitedChildren) {
        if (displayName) {
          finishedRow = true;
        }

        if (cursor.gotoNextSibling()) {
          visitedChildren = false;
        } else if (cursor.gotoParent()) {
          visitedChildren = true;
          indentLevel--;
        } else {
          break;
        }
      } else {
        if (displayName) {
          if (finishedRow) {
            row += "</div>";
            rows.push(row);
            finishedRow = false;
          }
          const start = cursor.startPosition;
          const end = cursor.endPosition;
          const id = cursor.nodeId;
          let fieldName = cursor.currentFieldName();
          if (fieldName) {
            fieldName += ": ";
          } else {
            fieldName = "";
          }
          row = `<div>${"  ".repeat(
            indentLevel,
          )}${fieldName}<a class='plain' href="#" data-id=${id} data-range="${
            start.row
          },${start.column},${end.row},${end.column}">${displayName}</a> [${
            start.row
          }, ${start.column}] - [${end.row}, ${end.column}]`;
          finishedRow = true;
        }

        if (cursor.gotoFirstChild()) {
          visitedChildren = false;
          indentLevel++;
        } else {
          visitedChildren = true;
        }
      }
    }
    if (finishedRow) {
      row += "</div>";
      rows.push(row);
    }

    cursor.delete();
    cluster.update(rows);
    treeRows = rows;
    isRendering--;
    handleCursorMovement();
  }

  function runTreeQuery(_, startRow, endRow) {
    if (endRow == null) {
      const viewport = codeEditor.getViewport();
      startRow = viewport.from;
      endRow = viewport.to;
    }

    codeEditor.operation(() => {
      const marks = codeEditor.getAllMarks();
      marks.forEach((m) => m.clear());

      if (tree && query) {
        const captures = query.captures(
          tree.rootNode,
          { row: startRow, column: 0 },
          { row: endRow, column: 0 },
        );
        let lastNodeId;
        for (const { name, node } of captures) {
          if (node.id === lastNodeId) continue;
          lastNodeId = node.id;
          const { startPosition, endPosition } = node;
          codeEditor.markText(
            { line: startPosition.row, ch: startPosition.column },
            { line: endPosition.row, ch: endPosition.column },
            {
              inclusiveLeft: true,
              inclusiveRight: true,
              css: `color: ${colorForCaptureName(name)}`,
            },
          );
        }
      }
    });
  }

  function handleQueryChange() {
    if (query) {
      query.delete();
      query.deleted = true;
      query = null;
    }

    queryEditor.operation(() => {
      queryEditor.getAllMarks().forEach((m) => m.clear());

      const queryText = queryEditor.getValue();

      try {
        query = parser.getLanguage().query(queryText);
        let match;

        let row = 0;
        queryEditor.eachLine((line) => {
          while ((match = CAPTURE_REGEX.exec(line.text))) {
            queryEditor.markText(
              { line: row, ch: match.index },
              { line: row, ch: match.index + match[0].length },
              {
                inclusiveLeft: true,
                inclusiveRight: true,
                css: `color: ${colorForCaptureName(match[1])}`,
              },
            );
          }
          row++;
        });
      } catch (error) {
        const startPosition = queryEditor.posFromIndex(error.index);
        const endPosition = {
          line: startPosition.line,
          ch: startPosition.ch + (error.length || Infinity),
        };

        if (error.index === queryText.length) {
          if (startPosition.ch > 0) {
            startPosition.ch--;
          } else if (startPosition.row > 0) {
            startPosition.row--;
            startPosition.column = Infinity;
          }
        }

        queryEditor.markText(startPosition, endPosition, {
          className: "query-error",
          inclusiveLeft: true,
          inclusiveRight: true,
          attributes: { title: error.message },
        });
      }
    });

    runTreeQuery();
    saveQueryState();
  }

  function handleTreeClick(event) {
    if (event.target.tagName === "A") {
      event.preventDefault();
      const [startRow, startColumn, endRow, endColumn] =
        event.target.dataset.range.split(",").map((n) => parseInt(n));
      codeEditor.focus();
      codeEditor.setSelection(
        { line: startRow, ch: startColumn },
        { line: endRow, ch: endColumn },
      );
    }
  }

  function handleLoggingChange() {
    if (loggingCheckbox.checked) {
      parser.setLogger((message, lexing) => {
        if (lexing) {
          console.log("  ", message);
        } else {
          console.log(message);
        }
      });
    } else {
      parser.setLogger(null);
    }
  }

  function treeEditForEditorChange(change) {
    const oldLineCount = change.removed.length;
    const newLineCount = change.text.length;
    const lastLineLength = change.text[newLineCount - 1].length;

    const startPosition = { row: change.from.line, column: change.from.ch };
    const oldEndPosition = { row: change.to.line, column: change.to.ch };
    const newEndPosition = {
      row: startPosition.row + newLineCount - 1,
      column:
        newLineCount === 1
          ? startPosition.column + lastLineLength
          : lastLineLength,
    };

    const startIndex = codeEditor.indexFromPos(change.from);
    let newEndIndex = startIndex + newLineCount - 1;
    let oldEndIndex = startIndex + oldLineCount - 1;
    for (let i = 0; i < newLineCount; i++) newEndIndex += change.text[i].length;
    for (let i = 0; i < oldLineCount; i++)
      oldEndIndex += change.removed[i].length;

    return {
      startIndex,
      oldEndIndex,
      newEndIndex,
      startPosition,
      oldEndPosition,
      newEndPosition,
    };
  }

  function colorForCaptureName(capture) {
    const id = query.captureNames.indexOf(capture);
    return COLORS_BY_INDEX[id % COLORS_BY_INDEX.length];
  }

  function loadState() {
    const language = localStorage.getItem("language");
    const sourceCode = localStorage.getItem("sourceCode");
    const query = localStorage.getItem("query");
    if (language != null && sourceCode != null && query != null) {
      queryInput.value = query;
      codeInput.value = sourceCode;
      languageSelect.value = language;
    }
  }

  function saveState() {
    localStorage.setItem("language", languageSelect.value);
    localStorage.setItem("sourceCode", codeEditor.getValue());
    saveQueryState();
  }

  function saveQueryState() {
    localStorage.setItem("queryEnabled", equalCheckbox.checked);
    localStorage.setItem("query", queryEditor.getValue());
  }

  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  /* ########## NEW CODE ##########
   This is the code for the new query editor
   with generations based on the user's selection
   ########## NEW CODE ##########
*/

  // These variables are used to maintain the state of the generated query
  let graph = {}; // Graph that maintains the relevant parts of the query (from the selection node to nodes that were selected as equal)
  let equalNodes = []; // Store the nodes that the user selected as equal
  let MAX_CHILD = 5; // Maximum number of children considered at each level

  // Get the mouse selection from the code editor
  function getSelection(codeEditor) {
    const selection = codeEditor.getDoc().listSelections()[0];
    let start = { row: selection.anchor.line, column: selection.anchor.ch };
    let end = { row: selection.head.line, column: selection.head.ch };
    if (
      start.row > end.row ||
      (start.row === end.row && start.column > end.column)
    ) {
      let swap = end;
      end = start;
      start = swap;
    }
    return { start, end };
  }

  // Recursively traverse the graph to generate a tree sitter query
  function fillQuery(node, graph, i, level = 2) {
    let type = node.type;
    let query = "\n" + " ".repeat(level) + `(${node.type} `;
    let next = graph[node];
    let constraints = [];
    if (next != null) {
      for (let j = 0; j < next.length; j++) {
        let result = fillQuery(next[j], graph, i, level + 2);
        query += result.query;
        i = result.i;
        constraints = constraints.concat(result.constraints);
      }
    }
    if (equalNodes.findIndex((n) => n.id === node.id) !== -1) {
      let text_repr = node.text.replaceAll("\n", "\\n");
      constraints.push(`(#eq? @node${i} "${text_repr}")`);
    }
    query += `) @node${i}`;
    i = i + 1;
    return { i: i, query: query, constraints: constraints };
  }

  // When the user selects something as equal, we add that as a constraint to the displayed query
  function handleEquality() {
    let { start, end } = getSelection(codeEditor);

    let node = tree.rootNode.namedDescendantForPosition(start, end);
    equalNodes.push(node);

    // DAG from cur node to the selected one
    while (node && node.id !== cur_node.id) {
      // If the parent node doesn't exist in the dict, create an array and add the current node
      graph[node.parent] = graph[node.parent] || [];
      // Check if the node is already in the array
      let alreadyExists = graph[node.parent].some((n) => n.id === node.id);
      // If the node does not exist already, add it to the parent's array
      if (!alreadyExists) {
        graph[node.parent].push(node);
        // Sort the parent's array based on the order of children in the parent node
        graph[node.parent].sort((a, b) => {
          let aIndex = node.parent.children.findIndex(
            (child) => child.id === a.id,
          );
          let bIndex = node.parent.children.findIndex(
            (child) => child.id === b.id,
          );
          return aIndex - bIndex;
        });
      }
      // Go up to the parent node
      node = node.parent;
    }

    // If node is null, function returns
    if (!node) {
      return;
    }

    let query_obj = fillQuery(node, graph, 0);
    let constraints = query_obj.constraints;
    let queryString = query_obj.query;
    for (let i = 0; i < constraints.length; i++) {
      queryString += "\n" + constraints[i];
    }
    // append new query to the existing one
    queryEditor.getDoc().setValue(`(${queryString})`);
    // Trigger a handleQueryChange to apply the new query
    handleQueryChange();
  }

  // Generate a basic tree sitter query that selects the node under the cursor
  function handleCursorMovement() {
    if (isRendering) return;
    if (equalCheckbox.checked) {
      handleEquality();
      return;
    }

    // Rest the graph and equal nodes once the user does a new selection
    graph = {};
    equalNodes = [];

    let { start, end } = getSelection(codeEditor);
    const node = tree.rootNode.namedDescendantForPosition(start, end);
    cur_node = tree.rootNode.namedDescendantForPosition(start, end);

    let queryString = `(${node.type} `;
    let cursor = node.walk();

    let childCount = 0;
    if (cursor.gotoFirstChild()) {
      do {
        if (cursor.nodeIsNamed) {
          let child_kind = cursor.nodeType;
          // If the node has a field name, add it to the query
          if (cursor.currentFieldName() !== null) {
            queryString += `${cursor.currentFieldName()}: (${child_kind}) @child${childCount}\n `;
          } else {
            // Otherwise it's anonymous
            queryString += `(${child_kind}) @child${childCount}\n `;
          }
        }
        childCount++;
      } while (cursor.gotoNextSibling() && childCount < MAX_CHILD); // Prevent the query from becoming too big because that might crash tree-sitter
    }

    queryString += ") @root";
    queryEditor.getDoc().setValue(queryString);
  }
})();
