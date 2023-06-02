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
use std::vec;

use derive_builder::Builder;
use getset::Getters;

use crate::tree_operations::{PiranhaRule, PiranhaRuleBuilder};
use tree_sitter::Node;

#[cfg(test)]
#[path = "./unit_tests/test_tree_operations.rs"]
mod test_tree_operations;

/// `Relabels` identifiers and strings of a node
#[derive(Debug, Getters)]
pub struct Relabel<'a> {
  node: &'a Node<'a>,
  field_name: String,
  current_label: String,
  new_label: String,
}

impl<'a> Relabel<'a> {
  const RELABEL_ID: &'static str = "relabel";

  pub fn new(
    node: &'a Node<'a>, field_name: String, current_label: String, new_label: String,
  ) -> Self {
    Relabel {
      node,
      field_name,
      current_label,
      new_label,
    }
  }

  pub fn generate_rule(&self) -> Result<PiranhaRule, &'static str> {
    let query = self.create_query_for_target();
    query
      .map(|value| {
        Ok(
          PiranhaRuleBuilder::default()
            .query(value)
            .replace_node(Self::RELABEL_ID.to_string())
            .replacement_str(self.new_label.clone())
            .build()
            .unwrap(),
        )
      })
      .unwrap_or_else(|| Err("Could not generate rule for relabeling"))
  }

  fn create_query_for_target(&self) -> Option<String> {
    let value = self.node.child_by_field_name(self.field_name.as_bytes());
    value.map(|node| {
      format!(
        "(\
                   ({} {}: (_) @to_relabel)\
                   (#eq? @to_relabel \"{}\")",
        self.node.kind(),
        self.field_name,
        self.current_label,
      )
    })
  }
}
