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

use clap::Parser;
use derive_builder::Builder;
use getset::{CopyGetters, Getters};
use std::fs;
use std::process::Command;
use std::string::String;
use tree_sitter::Parser as TParser;
use tree_sitter_java as java;

mod diff;
mod node;
mod query;

#[derive(Clone, Getters, CopyGetters, Debug, Parser, Builder)]
#[clap(version = "0.1", author = "Your Name")]
struct Opts {
  #[clap(short = 's', long)]
  file1: String,

  #[clap(short = 't', long)]
  file2: String,
}

fn main() {
  let opts: Opts = Opts::parse();

  // Compute the diff
  let output = Command::new("diff")
      .arg(&opts.file1)
      .arg(&opts.file2)
      .output()
      .expect("Failed to execute diff command");

  let diff = String::from_utf8(output.stdout).expect("Failed to read diff output");

  println!("Diff:\n{}", diff);

  // Parse the diff to find the line ranges that have changed in each file
  let diff_ranges = diff::parse_diff(&diff);

  // Parse the source files
  let mut parser = TParser::new();
  parser.set_language(java::language()).expect("Error setting language");

  let source_code1 = fs::read_to_string(&opts.file1).expect("Unable to read file");
  let tree1 = parser.parse(&source_code1, None).expect("Error parsing source code");

  let source_code2 = fs::read_to_string(&opts.file2).expect("Unable to read file");
  let tree2 = parser.parse(&source_code2, None).expect("Error parsing source code");

  // Find the Tree-sitter nodes corresponding to the diff
  println!("\nTree-sitter nodes for file1:");
  let res1 = node::mark_changed_nodes(tree1.walk(), &source_code1, &diff_ranges.as_ref().unwrap().file1);
  node::print_smallest_changed_nodes(res1.clone());

  println!("\nTree-sitter nodes for file2:");
  let res2 = node::mark_changed_nodes(tree2.walk(), &source_code2, &diff_ranges.as_ref().unwrap().file2);
  node::print_smallest_changed_nodes(res2.clone());

  query::write_query(source_code1, source_code2, res1, res2);
}
