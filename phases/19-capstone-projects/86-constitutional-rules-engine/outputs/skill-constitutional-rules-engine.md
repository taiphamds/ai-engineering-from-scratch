---
name: skill-constitutional-rules-engine
description: Declarative YAML rules engine for output constraints with severity, explanation, fixer operations, and structured diff
version: 1.0.0
phase: 19
lesson: 86
tags: [safety, rules, constitutional]
---

# Constitutional Rules Engine

Một hiến pháp là một file YAML. Mỗi quy tắc có `name`, `severity` (low | medium | high), `applies_when` (vị từ), `must` (vị từ), `explanation`, và `fix` tùy chọn.

## Predicates

Nguyên tử:

- `contains_regex` / `not_contains_regex`
- `starts_with_regex` / `ends_with_regex`
- `max_words` / `min_words`

Tổ hợp:

- `all_of: [...predicates]`
- `any_of: [...predicates]`
- `not_: predicate`

## Fix operations

- `append_if_missing: <suffix>`
- `prepend_if_missing: <prefix>`
- `replace_regex: { pattern: <regex>, replacement: <text> }`

## Engine output

`Engine.evaluate(text) -> EngineReport` trả về một `RuleResult` theo quy tắc với `status` trong `pass`, `violation`, `not_applicable`. `report.violations()` lọc ra các vi phạm và `report.max_severity()` trả về mức nghiêm trọng tệ nhất hiện diện.

## Artifact

`outputs/rules_report.json` mang bản nháp, bản sửa đổi, và diff có cấu trúc theo trường hợp.
