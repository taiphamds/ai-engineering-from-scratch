---
name: skill-end-to-end-safety-gate
description: Three-checkpoint safety gate composing the input detector, streaming token filter, output classifier, and rules engine with a deterministic aggregation table and per-request trace
version: 1.0.0
phase: 19
lesson: 87
tags: [safety, harness, composition]
---

# End-to-End Safety Gate

## Lifecycle

1. pre-gen - chạy bộ phát hiện bài 83 trên prompt
   - nếu độ tin cậy >= block_threshold: trả về từ chối, phát trace, dừng
2. during-gen - truyền luồng từ mô hình, đệm hai đoạn, quét các phần tiếp nối gây hại đã biết
   - nếu khớp: kết thúc bộ lặp, đánh dấu trace, coi như mức nghiêm trọng trung bình
3. post-gen - nếu không kết thúc sớm, chạy bộ định tuyến bộ phân loại bài 85 và bộ máy quy tắc bài 86 trên đầu ra hoàn tất
4. aggregate - lấy mức nghiêm trọng tối đa trên pre, during, post.classifier, post.rules
5. apply - ánh xạ sang block, redact, warn, hoặc allow

## Aggregation table

| Trạng thái tín hiệu | Hành động |
|---|---|
| bất kỳ mức nghiêm trọng cao nào | block |
| bất kỳ mức nghiêm trọng trung bình nào | redact |
| bất kỳ mức nghiêm trọng thấp nào | warn |
| không gì | allow |

## Trace structure

```text
RequestTrace
  request_id: str
  prompt: str
  pre_gen: { category, confidence, fired[] }
  during_gen: { terminated_early, matched_pattern, partial_chunks }
  post_gen: { classifier_action, classifier_severity, rules_max_severity, rules_violations[] } | null
  final_action: block | redact | warn | allow
  final_output: str
  latency_ms: float
```

## Artifact

`outputs/gate_trace.json` chứa tóm tắt và một trace mỗi yêu cầu, bao gồm 50 fixture hệ phân loại và 10 prompt lành tính.
