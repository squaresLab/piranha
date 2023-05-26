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

use regex::Regex;

pub struct DiffRanges {
    pub file1: Vec<(usize, usize)>,
    pub file2: Vec<(usize, usize)>,
}

/// Function to parse diff output to extract line ranges
pub fn parse_diff(diff: &str) -> Result<DiffRanges, Box<dyn std::error::Error>> {
    let re = Regex::new(r"(\d+),?(\d+)?([acd])(\d+),?(\d+)?")?;
    let mut file1_ranges = Vec::new();
    let mut file2_ranges = Vec::new();
    for cap in re.captures_iter(diff) {
        let start1 = cap[1].parse()?;
        let end1 = cap.get(2).map_or(Ok(start1), |m| m.as_str().parse())?;
        let start2 = cap[4].parse()?;
        let end2 = cap.get(5).map_or(Ok(start2), |m| m.as_str().parse())?;
        file1_ranges.push((start1, end1));
        file2_ranges.push((start2, end2));
    }
    Ok(DiffRanges { file1: file1_ranges, file2: file2_ranges })
}
