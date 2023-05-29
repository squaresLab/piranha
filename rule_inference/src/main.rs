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

use crate::infer::PiranhaInferenceBuilder;
use clap::Parser;
use derive_builder::Builder;
use getset::{CopyGetters, Getters};
use std::fs;
use std::string::String;

mod diff;
mod infer;
mod query;
mod tree_sitter_utilities;

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

  let code_before = fs::read_to_string(&opts.file1).expect("Unable to read file");
  let code_after = fs::read_to_string(&opts.file2).expect("Unable to read file");
  let diff_ranges = diff::get_diff(&opts.file1, &opts.file2);
  let inference_engine = PiranhaInferenceBuilder::default()
    .code_before(code_before)
    .code_after(code_after)
    .diff_ranges(diff_ranges)
    .build()
    .expect("Unable to build rule inference engine");
  inference_engine.infer_rule();
}
