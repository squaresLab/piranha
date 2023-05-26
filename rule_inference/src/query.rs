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

use tree_sitter::{Node, TreeCursor};
use std::collections::HashSet;

/// Function to create the query for matching nodes
pub fn create_query(mut cursor: TreeCursor, query: &mut String, node_id: &mut i32, source_code: &str, target_code: &str) -> bool {
    let first_node = cursor.node().kind();
    let node_text = cursor.node().utf8_text(source_code.as_bytes()).unwrap_or("");

    if !cursor.goto_first_child() {
        return false;
    }

    query.push_str(format!("({} ", first_node).as_str());
    let mut found = false;

    if node_text != target_code {
        loop {
            if let Some(value) = cursor.field_name() {
                query.push_str(format!("{}: ", value).as_str());
                let mut tmp_query = String::from("");
                if create_query(cursor.clone(), &mut tmp_query, node_id, source_code, target_code) {
                    query.push_str(tmp_query.as_str());
                    found = true;
                } else {
                    query.push_str(" (_)\n");
                }
            } else if cursor.node().is_named() {
                let mut tmp_query = String::from("");
                if create_query(cursor.clone(), &mut tmp_query, node_id, source_code, target_code) {
                    query.push_str(tmp_query.as_str());
                    found = true;
                }
            }

            if !cursor.goto_next_sibling() {
                break;
            }
        }
        query.push_str(format!(") @node{}", node_id).as_str());
        *node_id += 1;
        found
    } else {
        query.push_str(") @to_replace");
        *node_id += 1;
        true
    }
}

/// Function to print matching nodes from two files
pub fn write_query(source_code1: String,  source_code2: String, res1: Vec<Node>, res2: Vec<Node>) {
    println!("\nMatching nodes in diffs from file1 and file2:");
    for node2 in &res2 {
        for node1 in &res1 {
            let node1_text = node1.utf8_text(source_code1.as_bytes()).expect("TODO: panic message");
            let node2_text = node2.utf8_text(source_code2.as_bytes()).expect("TODO: panic message");
            if node1_text.contains(node2_text) {
                let mut query = String::from("");
                // write the query by decomposing the node
                let mut cursor = node1.walk();
                let mut i = 0;
                if create_query(cursor, &mut query, &mut i, &source_code1, &node2_text) {
                    println!("{}", query);
                }
            }
        }
    }
}
