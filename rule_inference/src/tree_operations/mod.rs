use std::result::Result;
use std::vec;

use derive_builder::Builder;
use getset::Getters;

use tree_sitter::Node;

mod relabel;
mod replace;

#[derive(Builder, Debug)]
pub struct PiranhaRule {
  query: String,
  replace_node: String,
  replacement_str: String,
}
