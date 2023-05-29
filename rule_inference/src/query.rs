/*
 Copyright (c) 2023 Uber Technologies, Inc.

 <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 except in compliance with the License. You may obtain a copy of the License at
 <p>http://www.apache.org/licenses/LICENSE-2.0

 <p>Unless required by applicable law or agreed to in writing, software distributed under the
 License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 express or implied. See the License for the specific language governing permissions and
 limitations under the License.
*/

use std::collections::HashSet;
use tree_sitter::{Node, TreeCursor};

pub struct Query {
  code_before: String,
  coder_after: String,
  node_counter: i32,
  query_string: String,
}

impl Query {
  /// Function to create the query for matching nodes

  pub fn merge_child_query(&mut self, other: &Query) {}

  pub fn create_query(&mut self, mut cursor: TreeCursor) -> bool {
    let first_node = cursor.node().kind();
    let _node_text = cursor
      .node()
      .utf8_text(&self.code_before.as_bytes())
      .unwrap_or("");

    // If there are no children, we are done/
    if !cursor.goto_first_child() {
      return false;
    }

    &self
      .query_string
      .push_str(format!("({} ", first_node).as_str());
    let mut found = false;

    // If this is not the target code, we continue our search

    loop {
      if let Some(value) = cursor.field_name() {
        &self.query_string.push_str(format!("{}: ", value).as_str());
      } else if cursor.node().is_named() {
      }
      if !cursor.goto_next_sibling() {
        break;
      }
    }
    &self
      .query_string
      .push_str(format!(") @node{}", &self.node_counter).as_str());
    self.node_counter = self.node_counter + 1;

    true
  }
}

/// Function to print matching nodes from two files
pub fn write_query(source_code1: &String, source_code2: &String, res1: Vec<Node>, res2: Vec<Node>) {
  println!("\nMatching nodes in diffs from file1 and file2:");
  for node2 in &res2 {
    for node1 in &res1 {
      let node1_text = node1
        .utf8_text(source_code1.as_bytes())
        .expect("TODO: panic message");
      let node2_text = node2
        .utf8_text(source_code2.as_bytes())
        .expect("TODO: panic message");
      if node1_text.contains(node2_text) {
        let mut query = String::from("");
        // write the query by decomposing the node
        let mut cursor = node1.walk();
        let mut query = Query {
          code_before: source_code1.clone(),
          coder_after: source_code2.clone(),
          node_counter: 0,
          query_string: String::from(""),
        };
        query.create_query(cursor);
      }
    }
  }
}
