use derive_builder::Builder;

#[derive(Builder)]
pub struct PiranhaInferenceEngine {
  code_before: String,
  code_after: String,
}

impl PiranhaInferenceEngine {
  pub fn infer_rule(&self) {
    todo!("Not implemented")
  }
}
