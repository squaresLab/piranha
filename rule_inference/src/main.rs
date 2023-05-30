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

use crate::synthesis::PiranhaInferenceEngineBuilder;
use clap::Parser;
use derive_builder::Builder;
use getset::{CopyGetters, Getters};
use std::fs;
use std::string::String;

mod infer;
mod synthesis;

#[derive(Clone, Getters, CopyGetters, Debug, Parser, Builder)]
#[clap(version = "0.1", author = "Your Name")]
struct InferenceOpts {
  #[clap(short = 's', long)]
  source_file: String,

  #[clap(short = 't', long)]
  target_file: String,
}

fn main() {
  let opts: InferenceOpts = InferenceOpts::parse();

  let code_before = fs::read_to_string(&opts.source_file).expect("Unable to read source file");
  let code_after = fs::read_to_string(&opts.target_file).expect("Unable to read target file");
  let inference_engine = PiranhaInferenceEngineBuilder::default()
    .code_before(code_before)
    .code_after(code_after)
    .build()
    .expect("Unable to build rule inference engine");
  inference_engine.infer_rule();
}
