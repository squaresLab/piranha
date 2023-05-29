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

use crate::diff;
use crate::diff::DiffRanges;
use crate::query;
use crate::tree_sitter_utilities;

use derive_builder::Builder;
use tree_sitter::Parser as TParser;
use tree_sitter_java as java;

#[derive(Builder)]
pub struct PiranhaInference {
  code_before: String,
  code_after: String,
  diff_ranges: DiffRanges,
}

impl PiranhaInference {
  pub fn infer_rule(&self) {
    // Parse the source files
    let mut parser = TParser::new();
    parser
      .set_language(java::language())
      .expect("Error setting language");

    let tree_before = parser
      .parse(&self.code_before, None)
      .expect("Error parsing source code");
    let tree_after = parser
      .parse(&self.code_after, None)
      .expect("Error parsing source code");

    // Find the Tree-sitter nodes corresponding to the diff
    let nodes_before = tree_sitter_utilities::mark_changed_nodes(
      tree_before.walk(),
      &self.code_before,
      &self.diff_ranges.file1,
    );
    tree_sitter_utilities::print_smallest_changed_nodes(nodes_before.clone());

    let nodes_after = tree_sitter_utilities::mark_changed_nodes(
      tree_after.walk(),
      &self.code_after,
      &self.diff_ranges.file2,
    );
    tree_sitter_utilities::print_smallest_changed_nodes(nodes_after.clone());

    query::write_query(
      &self.code_before,
      &self.code_after,
      nodes_before,
      nodes_after,
    );
  }
}
