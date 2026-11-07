# Evidence and reverse engineering

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Đọc binary, khôi phục ý định, và nêu confidence với bằng chứng cho nó.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [callers is empty and coverage says complete](empty-list-is-not-absence.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Three words for one sentence about grade(55)](observed-derived-inferred.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The table starts at 0x14 and the addend says 0x10](addend-0x10-table-0x14.md) | Đọc mã | 2 Làm việc | 8 |
| [Same id on two machines, refused after one deleted line](evidence-id-excludes-the-path.md) | Khái niệm | 2 Làm việc | 8 |
| [nm says one function, the file has five](function-finders-in-a-stripped-build.md) | Đánh đổi | 2 Làm việc | 8 |
| [Four tests pass and the rebuild is 26 bytes long](listing-before-pseudocode.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [profile_mismatch after an upgrade and a rename](stale-snapshot-refused.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Every byte decoded, and the jump lands inside an instruction](sweep-trap-addq-at-0x13.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Same 46 bytes, same relocation, wrong table](byte-match-is-not-source.md) | Thiết kế | 3 Cao cấp | 10 |
| [Three addresses for grade and four block counts](four-bases-four-block-counts.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [How many cells prove two small functions equal](hazard-grid-estimate.md) | Ước lượng | 3 Cao cấp | 10 |
| [Every breakpoint resolved and none was hit](resolved-breakpoint-zero-hits.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [The agent that answers what 95 prints and shows its work](agent-dossier-take-home.md) | Làm ở nhà | 4 Staff | 60 |
| [A proof record that stays unknown without a compiler](fail-closed-proof-record.md) | Thiết kế | 4 Staff | 15 |

[Tất cả các thẻ](../../README.md)
