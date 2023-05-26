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

/// Function to find nodes in diff range
pub fn mark_changed_nodes<'a>(mut cursor: TreeCursor<'a>, source: & str, diff_ranges: & Vec<(usize, usize)>) -> Vec<Node<'a>> {
    let node = cursor.node();
    let start_line = node.start_position().row + 1;
    let end_line = node.end_position().row + 1;
    let in_diff_range = diff_ranges.iter().any(|&(start, end)| {
        (start_line >= start && end_line <= end) || // fully within
            (start_line < start && end_line > start && end_line <= end) || // intersects from the left
            (start_line >= start && start_line < end && end_line > end) // intersects from the right
    });
    let mut marked = Vec::new();
    if in_diff_range {
        marked.push(node.clone());
    } else if cursor.goto_first_child() {
        loop {
            let child_marked = mark_changed_nodes(cursor.clone(), source, diff_ranges);
            marked.extend(child_marked);
            if !cursor.goto_next_sibling() {
                break;
            }
        }
    }
    marked
}

/// Function to print nodes that don't have parent
pub fn print_smallest_changed_nodes(marked: Vec<Node>) {
    let mut has_parent = vec![false; marked.len()];
    for i in 0..marked.len() {
        for j in 0..i {
            if marked[j].to_sexp().contains(&marked[i].to_sexp()) {
                has_parent[i] = true;
                break;
            }
        }
    }
    for i in 0..marked.len() {
        if !has_parent[i] {
            println!("{}", marked[i].to_sexp());
        }
    }
}
