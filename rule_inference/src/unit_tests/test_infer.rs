use crate::infer::ReplaceWithChild;
use tree_sitter::Parser as TParser;
use tree_sitter::{Node, Point, TreeCursor};
use tree_sitter_java as java;

#[test]
fn test_inference() {
  let code = "class A implements FooBar {
        public int foo() {
            if (oldFeatureFlag) {
                // do something
                return 0;
            } else {
                // do something else
                return 1;
            }
        }
    }";

  // Parse the source files
  let mut parser = TParser::new();
  parser
    .set_language(java::language())
    .expect("Error setting language");

  let ast = parser
    .parse(&code, None)
    .expect("Error parsing source code");

  let start = Point::new(2, 12);
  let end = Point::new(8, 13);
  let if_block = ast
    .root_node()
    .descendant_for_point_range(start, end)
    .unwrap();

  let start = Point::new(7, 16);
  let end = Point::new(7, 25);
  let ret_block = ast
    .root_node()
    .descendant_for_point_range(start, end)
    .unwrap();

  let engine = ReplaceWithChild::new(&if_block, &ret_block);
  let rule = engine.infer_rule();
  assert!(rule.is_ok());
}
