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


use std::result::Result;

use derive_builder::Builder;

use tree_sitter::{Node};


#[cfg(test)]
#[path = "unit_tests/test_infer.rs"]
mod unit_tests;

#[derive(Builder, Debug)]
pub struct PiranhaRule {
  query: String,
  replace_node: String,
  replacement_str: String,
}

/// `ReplaceWithChild` constructs a query to replace a node with one of its children.
pub struct ReplaceWithChild<'a> {
  root: &'a Node<'a>,
  child: &'a Node<'a>,
}

impl<'a> ReplaceWithChild<'a> {
  // Defining constants
  const PARENT_ID: &'static str = "parent";
  const CHILD_ID: &'static str = "child";

  pub fn new(root: &'a Node<'a>, child: &'a Node<'a>) -> Self {
    ReplaceWithChild { root, child }
  }

  /// Builds a Piranha rule for replacing `root` with `child`.
  pub fn infer_rule(&self) -> Result<PiranhaRule, &'static str> {
    let query = self.create_query_for_target();
    match query {
      Some(value) => Ok(
        PiranhaRuleBuilder::default()
          .query(value)
          .replace_node(Self::PARENT_ID.to_string())
          .replacement_str(Self::CHILD_ID.to_string())
          .build()
          .unwrap(),
      ),
      _ => Err("Unable to infer rule."),
    }
  }

  /// Builds a Tree-sitter query that selects the `root` and the `child`.
  pub fn create_query_for_target(&self) -> Option<String> {
    self
      .create_query_for_target_aux(self.root)
      .map(|query_string| format!("{} @{}", query_string.trim(), Self::PARENT_ID.to_string()))
  }

  /// Recursively searches `current_node`'s children until it finds the `child`.
  /// Discards branch if `child` is not found.
  ///
  /// # Arguments
  ///
  /// * `current_node` - Node currently being searched.
  fn create_query_for_target_aux(&self, current_node: &'a Node<'a>) -> Option<String> {
    if current_node.id() == self.child.id() {
      return Some(format!(
        "({}) @{}",
        self.child.kind(),
        Self::CHILD_ID.to_string()
      ));
    }

    let mut query_string = String::from(format!("({} ", current_node.kind()));
    let mut query_parts: Vec<String> = Vec::new();

    // Visit each child and check whether we find a node of interest
    let mut cursor = current_node.walk();
    if cursor.goto_first_child() {
      loop {
        let child = cursor.node();
        let field_name = cursor.field_name();
        if let Some(partial_query) = self.create_query_for_target_aux(&child) {
          let addition = match field_name {
            Some(name) if !name.is_empty() => format!("{}: ({})", name, partial_query),
            _ => format!("({})", partial_query), // if the node doesn't have a field name
          };
          query_parts.push(addition);
        }
        if !cursor.goto_next_sibling() {
          break;
        }
      }
    }
    query_string.push_str(&query_parts.join(" "));
    query_string.push_str(")");
    Some(query_string).filter(|_| !query_parts.is_empty()) // only return if we found a node of interest
  }
}
