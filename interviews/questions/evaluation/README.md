# Evaluation

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Các metric, harness đánh giá, bộ chấm, hiệu chuẩn và cách tin một điểm số.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [Two points on a saturated benchmark](benchmarks-stop-discriminating.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Exact match gives zero to a correct answer](exact-match-vs-token-f1.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [What a perplexity of 10 tells you](perplexity-health-check.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Overlap metric, judge model or human review](pick-the-eval-method.md) | Đánh đổi | 1 Sơ tuyển | 6 |
| [Two engineers, one judge, different means](anchored-rubric.md) | Thiết kế | 2 Làm việc | 8 |
| [A four point win on fifty cases](fifty-cases-is-not-enough.md) | Ước lượng | 2 Làm việc | 8 |
| [Before a judge score can gate a release](judge-calibration-before-trust.md) | Khái niệm | 2 Làm việc | 8 |
| [Every metric moved and the product did not](judge-upgrade-moved-every-score.md) | Gỡ lỗi | 2 Làm việc | 7 |
| [The mean is green and users see failures](mean-hides-the-tail.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [A perfect needle test and a long contract](niah-is-not-enough.md) | Khái niệm | 2 Làm việc | 8 |
| [The winner changed when you swapped the order](pairwise-position-bias.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Pass at one of 0.6 and pass at five of 0.95](pass-at-k-reading.md) | Đánh đổi | 2 Làm việc | 8 |
| [The model that writes the answer grades it too](same-model-judges-itself.md) | Đánh đổi | 2 Làm việc | 8 |
| [BLEU 28.3 in one paper and 0.283 in another](tokenizer-is-the-benchmark.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Score generated code without an exec in the eval process](code-exec-sandbox-contract.md) | Thiết kế | 3 Cao cấp | 10 |
| [An ECE of 0.02 on too few predictions](ece-or-brier.md) | Khái niệm | 3 Cao cấp | 9 |
| [The judge failed to parse and the mean went up](nan-scores-raise-the-mean.md) | Gỡ lỗi | 3 Cao cấp | 8 |
| [Three models, fifty tasks, one leaderboard](paired-difference-interval.md) | Thiết kế | 3 Cao cấp | 10 |
| [Perplexity improves when the batch grows](perplexity-padding-and-shift.md) | Đọc mã | 3 Cao cấp | 10 |
| [An eval gate on every pull request](regression-gate-ci.md) | Thiết kế | 3 Cao cấp | 12 |
| [Two harnesses, two pass at k formulas](two-pass-at-k-formulas.md) | Đọc mã | 3 Cao cấp | 10 |
| [Error bars for a pass rate and for a mean](wilson-or-bootstrap.md) | Khái niệm | 3 Cao cấp | 8 |
| [The leaderboard winner is worst on code](aggregate-hides-tradeoffs.md) | Đánh đổi | 4 Staff | 10 |
| [Eight points after a new training corpus](benchmark-jump-capability-or-leak.md) | Thiết kế | 4 Staff | 12 |
| [A long context battery for every model upgrade](effective-context-spec-sheet.md) | Thiết kế | 4 Staff | 12 |
| [Build an offline eval pipeline for a small model](eval-pipeline-take-home.md) | Làm ở nhà | 4 Staff | 60 |

[Tất cả các thẻ](../../README.md)
