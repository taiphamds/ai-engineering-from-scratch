# Evidence, Confidence, and Unknowns in Binary Analysis

> Một phát hiện về một chương trình đã biên dịch là một bản ghi với một hash, một độ tin cậy, một thẩm quyền và một danh sách những gì nó không thể cho thấy.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32 (ELF from scratch), Phase 13 · 33 (disassembly and control flow), Phase 13 · 34 (lifting to pseudocode)
**Time:** ~105 minutes

## Learning Objectives

- Xây dựng một bản ghi bằng chứng theo mẫu `Evidence` của rea với độ tin cậy observed, derived và inferred.
- Tính các id hash nội dung giữ nguyên khi tệp chuyển sang một thư mục khác.
- Ghi lại những gì mỗi provider không thể cho thấy như các giới hạn đi cùng bản ghi.
- Từ chối nêu một kết quả cho đến khi một lần chạy được quan sát của hàm hỗ trợ nó.
- Giữ các điều chưa biết còn lại dưới dạng các bản ghi có revision được nối bằng một chuỗi hash.
- Cache các câu trả lời provider dưới một khóa chính xác và từ chối một lần phát lại cũ.

## The Problem

Bạn hỏi một agent `grade` trong `ledger-x86_64-O1.o` trả về gì cho điểm 55. Agent gọi rea, đọc mã giả Ghidra và trả lời 0. Một người xem xét hỏi làm sao agent biết. Agent có một khối văn bản mà Ghidra đã in. Với đường mặc định, văn bản đó đọc là `uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`. Các byte ở điểm đó nói `xor eax, eax`.

Biểu thức và chỉ lệnh đều tạo 0 cho mọi đầu vào. Agent không biết điều đó. Nó tin văn bản vì một công cụ tạo ra nó. Một nghiên cứu năm 2026 chạy ba agent trên 24 tác vụ reverse engineering ([NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)). Nó nêu tên bốn điểm yếu lặp lại: thiên lệch huấn luyện, quá tin các quan sát, giới hạn ngữ cảnh và sự bám giữ kế hoạch. Một nghiên cứu năm 2026 khác cấy văn bản bên trong các binary và phát hiện rằng các mô hình đề xuất hành động không an toàn được cấy trong 35 trên 40 trường hợp ([arXiv 2607.12507](https://arxiv.org/abs/2607.12507)).

rea 6.5.0 cho agent một bộ từ vựng cho điều này. Mọi lần gọi công cụ thành công tạo một bản ghi `Evidence` với một `confidence` là `observed`, `derived` hoặc `inferred`, một `authority` và một danh sách `limitations`. Skill được đóng gói nói với agent: "Mọi kết luận phải phân biệt quan sát, suy luận và điều chưa biết. Trích Evidence ID, giữ các giới hạn và độ bao phủ không đầy đủ, và không bao giờ ngụ ý rằng phân tích tĩnh đã quan sát thực thi.".

Ba điều rea để cho bạn. Các snapshot của nó cache kết quả truy vấn chính xác, không phải phân tích. Xác minh của nó cho một khẳng định qua khi một chiều so sánh không thay đổi, và bình luận của chính nó nói rằng một lần qua "không xác lập tính tương đương triển khai toàn cục.". Sổ nghĩa vụ của nó chỉ lấy ứng viên từ các đồ thị JavaScript và managed, nên một hàm native không bao giờ đạt `verified` qua nó.

Bài học này xây dựng mảnh còn thiếu bằng Python thuần. Bạn viết một sổ lưu mọi sự kiện về fixture dưới dạng một bản ghi với một hash nội dung. Bạn đưa ra các dự đoán về `percent_change` và `grade`, đánh dấu chúng inferred và kiểm tra chúng với các lần chạy của một chương trình kiểm tra bạn tự biên dịch. Bạn import hai bản ghi rea thực và snapshot mà chúng đến từ đó, và sổ của bạn tính lại mọi hash mà rea đã ghi.

```figure
re-evidence-ledger
```

## Three Words for Confidence, Five for Authority

`confidence` là một enum với ba giá trị, không bao giờ là một số. `authority` có năm giá trị. Khi một bên tạo không nói gì, rea sử dụng `shipped-artifact` với `observed`.

| Giá trị | Ý nghĩa trên fixture | Bản ghi trong bài học này |
|---|---|---|
| `observed` | Một sự kiện đọc từ byte hoặc từ một lần chạy | các lần đọc section và symbol của trình đọc ELF, hai bản ghi Ghidra, 17 lần chạy host |
| `derived` | Một sự kiện được tính từ các bản ghi observed | mô hình bảng switch, mô hình phép chia, mọi biến đổi điều chưa biết |
| `inferred` | Một kỳ vọng mà chưa quan sát nào nêu | 18 dự đoán |
| `shipped-artifact` | Tệp trên đĩa là nguồn | mọi lần đọc `ledger-x86_64-O1.o` |
| `controlled-replay` | Một lần chạy bạn kiểm soát tạo ra sự kiện | các lần chạy host của `harness.c` |
| `analyst-inference` | Phán đoán của riêng bạn | các dự đoán và các biến đổi điều chưa biết |
| `historical-reference` | Một cây nguồn hoặc tài liệu cũ hơn | không có ở đây |
| `external-service` | Một dịch vụ ngoài tệp và host | không có ở đây |

Hai nhầm lẫn tốn nhiều thời gian nhất. Thứ nhất coi mã giả như một quan sát hành vi. Nó là một quan sát những gì Ghidra đã in. Thứ hai coi một danh sách rỗng là bằng chứng vắng mặt. Ghi chú thiết kế của rea nghiêm ngặt: "Độ bao phủ thiếu là chưa biết, không phải vắng mặt.". Sổ trong `code/main.py` mã hóa cả hai quy tắc.

## The Record

Một bản ghi có chính xác mười sáu trường, và rea 6.5.0 từ chối mọi trường khác. `code/main.py` giữ cùng tên với rea, để một bản ghi từ bất kỳ bên nào xác thực ở bên kia. Trường thứ mười sáu, `relationship_coverage`, nói một danh sách caller hoặc callee đầy đủ đến đâu. Giá trị của nó là `complete`, `partial` hoặc `unknown`, hoặc `null` khi thao tác không báo cáo quan hệ gọi.

| Trường | Nó chứa gì |
| --- | --- |
| `evidence_id` | `ev_` và 64 chữ số hex, một hash của nội dung |
| `subject` | `name`, `digest.sha256`, `format`, `architecture`, `local_path` hoặc `null` |
| `provider` | `id`, `name`, `version` hoặc `null` |
| `analysis_profile` | các thiết lập của provider và digest của chúng, hoặc `null`, luôn hiện diện |
| `predicate_type` | một tag, mặc định `rea.analysis` |
| `operation`, `parameters` | công cụ và đầu vào của nó |
| `raw_result`, `normalized_result` | đầu ra provider và kết quả chính tắc |
| `confidence`, `authority` | các enum ở trên |
| `environment` | `id`, `platform`, `architecture`, `isolation` hoặc `null` |
| `limitations` | các câu thông thường |
| `relationship_coverage` | `status` `complete`, `partial` hoặc `unknown` với chẩn đoán, hoặc `null` |
| `locations` | `address`, `address-range`, `artifact-path`, `file-offset`, `file-offset-range` |
| `evidence_links` | các id `ev_` mà bản ghi này dựa vào |

Đây là bản ghi thực rea đã ghi cho `grade`, cắt xuống các trường quan trọng ở đây. Tệp đầy đủ là `code/fixtures/rea-evidence-grade.json`, 37,573 byte.

```json
{
  "evidence_id": "ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1",
  "subject": {
    "name": "ledger-x86_64-O1.o",
    "digest": { "sha256": "9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f" },
    "format": "elf",
    "architecture": "x86_64",
    "local_path": "/private/tmp/aiefs-re/phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code/fixtures/ledger-x86_64-O1.o"
  },
  "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
  "analysis_profile": {
    "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
    "parameters": { "jump_table_evidence": "typed-case-default-blocks-v1", "import_mode": "ephemeral-source-immutable" },
    "digest": "9c7f6b24be69294e61da046e4583e3856cb9e40433b149c1bf8bb534d2fe03ef"
  },
  "operation": "analyze_function",
  "parameters": { "procedure": "grade" },
  "confidence": "observed",
  "authority": "shipped-artifact",
  "environment": null,
  "limitations": [
    "Default-space addresses use lowercase 0x-prefixed hexadecimal; other address spaces use <percent-encoded-space>:0x<hex>.",
    "Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals."
  ],
  "relationship_coverage": {
    "status": "complete",
    "diagnostics": [
      "Only resolved Ghidra call references are returned; unresolved computed or indirect calls remain unknown, while function classifications distinguish thunks and externals."
    ]
  },
  "locations": [],
  "evidence_links": []
}
```

Đối tượng `parameters` thực của profile có 25 khóa. Danh sách `limitations` thực có mười câu. Giữ chúng. Một giới hạn là một phần của nội dung, nên bỏ một giới hạn thay đổi id, và sổ của bạn sau đó sẽ từ chối bản ghi.

Chú ý điều bản ghi không nói. `environment` là `null` vì Ghidra đọc một tệp và không chạy gì. `locations` rỗng vì thao tác này báo cáo các địa chỉ bên trong `normalized_result`. `relationship_coverage` có trạng thái `complete`. Chẩn đoán của nó nói rằng chỉ các tham chiếu gọi Ghidra đã phân giải được trả về, và rằng các lần gọi tính toán hoặc gián tiếp chưa phân giải vẫn chưa biết. Vì vậy các danh sách caller và callee chỉ đầy đủ cho các lần gọi đã phân giải.

## The Id Is a Hash of Content, and the Path Is Not in It

rea tính `evidence_id` là `ev_` cộng SHA-256 trên JSON chính tắc RFC 8785 của một phép chiếu bản ghi. Phép chiếu giữ `digest`, `format` và `architecture` của subject và bỏ `name` cùng `local_path`. Nó bỏ `relationship_coverage` khi giá trị của nó là `null`, để một bản ghi không có quan hệ gọi giữ cùng id như trước khi trường tồn tại. Mọi thứ khác, bao gồm `raw_result` và mọi giới hạn, được hash.

RFC 8785 sắp xếp khóa đối tượng, loại khoảng trắng và cố định các dạng số cùng chuỗi. Với các bản ghi có số là số nguyên, thư viện chuẩn Python tạo cùng các byte:

```python
def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
```

`code/main.py` từ chối float trước khi hash, vì RFC 8785 và Python in một số float khác nhau. Hai bản ghi rea và snapshot không chứa float, nên công thức tái tạo mọi hash rea:

| Giá trị rea | Được `code/main.py` tính lại |
|---|---|
| `ev_67b6d3f992eaf49a…` cho `grade` | bằng nhau |
| `ev_e88b10dc0c6400e5…` cho `percent_change` | bằng nhau |
| digest profile `9c7f6b24be69294e…` trên `{provider, parameters}` | bằng nhau |
| `query_26122aebe9d8abae…` cho mục snapshot `grade` | bằng nhau |
| `query_0f95ef38038d3666…` cho mục `percent_change` | bằng nhau |

Vì sao loại đường dẫn? Cùng quan sát của cùng các byte nhận cùng id trên bất kỳ máy nào và trong bất kỳ thư mục nào. `local_path` trong danh sách ở trên nêu tên một thư mục trên một máy Mac. Id không thay đổi khi bạn sao chép fixture vào `/home/you/re`. `rebind_subject_path()` cho phép bạn hiển thị một bản ghi dưới một đường dẫn mới. Nó từ chối khi `sha256`, `format` hoặc `architecture` khác nhau. rea 6.5.0 làm tương tự bằng `rebindEvidenceToTargetPath` khi nó phát lại một bản ghi snapshot cho một mục tiêu ở một đường dẫn mới.

`validate_evidence()` tính lại id và từ chối một lần không khớp bằng câu của rea, "Định danh ngữ nghĩa bằng chứng không khớp bản ghi của nó". Nó cũng từ chối một bản ghi có `analysis_profile.provider` khác `provider` của nó. Bài kiểm tra `test_tampered_id_and_mismatched_profile_are_rejected` chỉnh sửa một dòng mã giả bên trong bản ghi `grade` thực và theo dõi sổ từ chối nó.

## Observe the Object Yourself

Trước mọi provider, sổ đọc tệp. `observe_object()` phân tích ELF64 section header, `.symtab`, `.strtab` và `.rela.text` bằng `struct.unpack_from`. Nó ghi một bản ghi `inspect_object` và một bản ghi `read_function_bytes` mỗi function symbol. Cả năm là `observed` với thẩm quyền `shipped-artifact`, vì nguồn là tệp trên đĩa.

| Bản ghi | Nội dung | Id |
|---|---|---|
| `inspect_object` | năm section với offset, kích thước và hash, bốn hàm, ba relocation | `ev_645e0a145f28bd5c…` |
| `read_function_bytes percent_change` | 16 byte tại `.text+0x00` | `ev_2572a7d254ad15cb…` |
| `read_function_bytes grade` | 46 byte tại `.text+0x10`, SHA-256 `ffcb75c2a7bb1104…` | `ev_a467c2427bfc0c56…` |
| `read_function_bytes total` | 31 byte tại `.text+0x40` | `ev_b1e845cea2543073…` |
| `read_function_bytes grade_label` | 63 byte tại `.text+0x60` | `ev_c50041be26e6b7f4…` |

`llvm-objdump -t` đồng nhất: `grade` tại `0000000000000010` với kích thước `2e`. Ba relocation trong `.rela.text` là `R_X86_64_PC32` đối với `.rodata` tại các offset `0x36`, `0x84` và `0x93`, với các addend `0x10`, `0x24` và `-0x4`. Mỗi bản ghi mang một vị trí `file-offset-range` và một giới hạn: "Các byte section được đọc từ tệp trên đĩa. Trình đọc không áp dụng relocation và không chạy mã."

Bài 32 xây dựng trình đọc này đầy đủ. Ở đây nó là 60 dòng, vì bài học này nói về những gì bạn ghi lại về lần đọc.

## Derive the Table, and Say That You Derived It

46 byte của `grade` chứa bốn mẫu mà bài 33 đã giải mã:

| Byte | Chỉ lệnh | Offset trong `grade` |
|---|---|---|
| `48 69 c0 67 66 66 66` | `imul rax, rax, 0x66666667` | 3 |
| `48 c1 f9 22` | `sar rcx, 34` | 13 |
| `83 c1 fa` | `add ecx, -6` | 23 |
| `83 f9 04 77 0c` | `cmp ecx, 4` rồi `ja` | 28 |

Một phép nhân với `0x66666667` theo sau bởi một độ dịch 34 là một phép chia có dấu cho 10. Tệp không chứa 10. `derive_grade_model()` ghi sự kiện đó như một giới hạn: "Số chia 10 là một phép suy ra từ hệ số nhân 0x66666667 và độ dịch 34. Tệp không chứa 10."

`add ecx, -6` đặt case đầu thành 6. `cmp ecx, 4` với một bước nhảy không dấu chấp nhận năm case, 6 đến 10.

`lea` tại `.text+0x33` mang relocation với addend `0x10`. Một relocation PC32 đo từ cuối displacement 4 byte, nên bảng bắt đầu tại `.rodata+0x14`. Năm word little-endian ở đó đọc ra `1, 2, 3, 4, 4`. Switch trong `ledger.c` trả về 1 cho 60 đến 69, 2 cho các số bảy mươi, 3 cho các số tám mươi và 4 cho 90 đến 100. Compiler biến switch thành một bảng tra cứu các giá trị trả về.

Bản ghi kết quả `ev_605106bff2d9998f…` có `confidence` `derived`, và `evidence_links` của nó nêu tên hai bản ghi observed mà nó dựa vào. Loại bản ghi byte khỏi sổ và bản ghi derived có một liên kết treo. Hình ở trên cho thấy trạng thái đó khi bạn tắt `ev_a467c242…`.

Giờ so sánh với Ghidra. Mã giả của nó cho cùng các byte:

```c
uint grade(int param_1)
{
  uint uVar1;
  uint uVar2;

  uVar2 = param_1 / 10 - 6;
  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  if (uVar2 < 5) {
    uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
  }
  return uVar1;
}
```

Ghidra áp dụng relocation và đặt tên bảng `DAT_001000b4`, tức `.rodata+0x14` sau khi nó đặt `.text` tại `0x100000`. Nó khôi phục phép chia cho 10 và năm case. Với giá trị mặc định, nó in một biểu thức luôn là 0 và không bao giờ nói 0. P-code trong `native_value_flow` đánh dấu các thao tác đó `is_dead: true`. Bản ghi là một quan sát trung thực về Ghidra. Ý nghĩa bạn đọc từ nó là derived, và giá trị bạn kỳ vọng từ một lần chạy là inferred.

Bản ghi `percent_change` cho thấy lỗi kia. Chữ ký của Ghidra đọc là `undefined1 [16] percent_change(int param_1,int param_2,ulong param_3)`. Nguồn nói `int percent_change(int before, int after)`. `idiv` ghi `EDX:EAX`, và đường bằng không để `EDX` nguyên vẹn, nên decompiler suy ra một giá trị trả về 16 byte và một tham số thứ ba. `native_api.return_type.confidence` của chính nó cho `grade` là `"low"`. Coi một chữ ký được khôi phục là suy luận của provider, và ghi nó theo cách đó.

## Predictions Are Inferred Records

Một dự đoán là một khẳng định về hành vi mà chưa quan sát nào nêu. `claim_suite()` xây dựng mười tám dự đoán từ các mô hình derived và từ nguồn. `record_prediction()` lưu mỗi dự đoán dưới dạng một bản ghi với `confidence` `inferred` và `authority` `analyst-inference`, liên kết đến các bản ghi mà nó dựa vào.

| Khẳng định | Giá trị dự đoán | Dựa vào |
|---|---|---|
| `percent_change(12400, 15500)` | 25, từ 310000 / 12400 | mô hình phép chia `ev_076a9167…` |
| `percent_change(0, 5)` | 0, điều kiện bảo vệ bằng không | mô hình phép chia |
| `percent_change(100, 50)` | -50 | mô hình phép chia |
| `percent_change(-7, 3)` | -142, vì `idiv` cắt về không | mô hình phép chia |
| `grade(55)` | 0, chỉ số -1 không qua so sánh không dấu | mô hình bảng `ev_605106bf…` |
| `grade(60)`, `grade(69)` | 1, 1 | mô hình bảng |
| `grade(70)`, `grade(85)` | 2, 3 | mô hình bảng |
| `grade(95)`, `grade(100)`, `grade(105)` | 4, 4, 4 | mô hình bảng |
| `grade(110)`, `grade(-5)` | 0, 0 | mô hình bảng |
| `total(1, 2, 3)`, `total()` | 6, 0 | bản ghi nguồn `ev_2f1e6d25…` |
| `grade_label(85)` | `"B"` | bản ghi nguồn và mô hình bảng |
| `grade(score)` cho 90 đến 100 | 4 cho cả mười một đầu vào | mô hình bảng |

`predict()` sử dụng ngữ nghĩa C, không phải ngữ nghĩa Python. `c_div()` cắt về không, và `wrap32()` gập mọi giá trị trung gian vào 32 bit. `//` của Python làm tròn về âm vô cùng, nên `(3 - -7) * 100 // -7` cho -143 và chương trình C cho -142. Bài 36 làm lưới này lớn hơn nhiều.

Mỗi dự đoán mở một điều chưa biết còn lại. Điều chưa biết yêu cầu bằng chứng `observed` với thẩm quyền `controlled-replay` và khuyến nghị một thăm dò: `execute_function` trên bản build host. Phần tiếp theo tạo ra bằng chứng đó. Câu hỏi cho khẳng định grade đầu tiên đọc là "grade(95) == 4 có đúng khi hàm đã biên dịch chạy không?"

## Check Them Against a Run

`code/fixtures/harness.c` bao gồm `ledger.c` và in một kết quả mỗi lần gọi. `observe_runs()` biên dịch nó bằng công cụ đầu tiên trong `clang`, `cc` hoặc `gcc` trên PATH của bạn và chạy mỗi đầu vào trong lưới một lần. Mỗi lần chạy trở thành một bản ghi:

```json
{
  "operation": "execute_function",
  "parameters": { "function": "grade", "args": [95] },
  "normalized_result": { "result": 4, "stdout": "4\n", "exit_code": 0 },
  "confidence": "observed",
  "authority": "controlled-replay",
  "environment": { "id": "host-process", "platform": "darwin", "architecture": "arm64", "isolation": "process" },
  "limitations": [
    "The run executed a host build of ledger.c, not the x86-64 object. The claim about the object rests on the shared source and on the compiler.",
    "One run observes one input. It proves nothing about other inputs."
  ]
}
```

Subject của một bản ghi chạy là binary harness, một tệp Mach-O arm64 trên máy Mac này, với SHA-256 riêng của nó. Provider là `course-harness` với dòng phiên bản compiler, ở đây `Apple clang version 17.0.0 (clang-1700.6.3.2)`. `evidence_links` nêu tên bản ghi nguồn `ev_2f1e6d251543d017…`, vì lần chạy và object chia sẻ `ledger.c` và không gì khác.

Đọc giới hạn đầu hai lần. Object x86-64 không bao giờ chạy trên máy này. Thứ chạy là một bản build thứ hai của cùng nguồn cho một kiến trúc khác. Đó vẫn là một quan sát, và là quan sát mạnh nhất có sẵn khi không có trình giả lập, nên khẳng định qua với câu đó đính kèm. Một báo cáo bỏ nó đã mất thông tin người đọc cần.

17 lần chạy đầu vào đơn đều đồng nhất với các dự đoán. `code/fixtures/run-evidence.json` chứa 17 bản ghi đó và bản ghi nguồn, được xuất với `--record` ngày 2026-10-13. Khi không có compiler, `build_ledger()` import gói đó thay vì chạy, và báo cáo nói vậy trong trường `runs` của nó.

## Promotion Rules

Một khẳng định chỉ chuyển từ inferred sang được hỗ trợ qua các lần chạy observed. `check_claim()` tìm các bản ghi `execute_function` với cùng hàm và đối số, so sánh mỗi kết quả với dự đoán và đếm các đầu vào được bao phủ:

| Trạng thái | Điều kiện | Sổ hoàn thành của rea |
|---|---|---|
| `pass` | mọi đầu vào có một lần chạy đồng nhất và không lần nào bất đồng | `pass` |
| `fail` | bất kỳ lần chạy nào bất đồng | `fail` |
| `unknown` | một số đầu vào có lần chạy, các đầu vào khác không có | `unknown` |
| `unsupported` | không đầu vào nào có lần chạy | `unsupported` |

`promote_claim()` là dạng nghiêm ngặt. Nó phát sinh `ClaimError` khi bất kỳ id nào là `inferred` hoặc `derived`. Nó phát sinh ngoại lệ khi một id nêu tên một lần chạy của hàm khác hoặc các đối số khác. Nó phát sinh ngoại lệ khi danh sách rỗng, và khi các lần chạy bao phủ ít đầu vào hơn khẳng định. Bản ghi mã giả Ghidra và mô hình bảng đều tồn tại cho `grade(55)`, và không bản ghi nào có thể nâng nó. Tắt `ev_7be90c0c…` trong hình và theo dõi khẳng định rơi xuống `unsupported` trong khi hai bản ghi về `grade` vẫn còn.

Khẳng định phạm vi cho thấy trường hợp một phần. Chỉ hai trong mười một đầu vào của nó, 95 và 100, xuất hiện trong lưới chạy. `check_claim()` trả về `unknown` với `covered` 2 trên 11, và `promote_claim()` từ chối với "2 trong 11 đầu vào có các lần chạy được quan sát". Sổ không làm tròn điều đó lên.

`completion_ledger()` phản chiếu `EvidenceCompletionLedger` của rea. Id của nó là `ecl_` cộng hash các bản ghi của nó, và `complete` chỉ đúng khi `pass` bằng `total`. Demo in `ecl_da64933ea13befed…` với `complete: false`, vì một khẳng định phạm vi đó.

## Unknowns Are Records with a Hash Chain

rea lưu một điều chưa biết còn lại dưới dạng một bản ghi nghiêm ngặt. `code/main.py` giữ cùng các trường và cùng các bất biến.

Id là `unk_` cộng SHA-256 trên `{domain, question, scope_digest}`, với khoảng trắng của câu hỏi được thu gọn thành dấu cách đơn. Hai nhà phân tích hỏi cùng câu hỏi về cùng tệp nhận cùng id. `scope_digest` là SHA-256 của object.

Mọi thay đổi là một revision mới. Revision 1 có `previous_revision_digest` `null`. Mọi revision sau nêu tên `revision_digest` của revision trước nó, và digest bao phủ mọi trường trừ chính nó. `verify_unknown_chain()` duyệt danh sách và tính lại mỗi digest. Nó kiểm tra rằng mỗi liên kết trỏ đến revision trước. Nó kiểm tra rằng bằng chứng biến đổi mà mỗi revision nêu tên có trong sổ.

Bản thân mỗi biến đổi là một bản ghi bằng chứng, như rea làm với provider `rea-unknown-registry`. Bản của chúng ta mang `confidence` `derived`, `authority` `analyst-inference` và không subject. Giới hạn của nó đọc là "Một biến đổi registry ghi lại điều nhà phân tích quyết định. Nó không phải bằng chứng của câu trả lời."

Đó là lý do 81 bản ghi của demo bao gồm 36 bản ghi biến đổi derived: 18 lần mở và 18 lần cập nhật.

Ba bất biến được thực thi trên mọi revision:

- Chỉ một điều chưa biết `resolved` mang một `resolution`, và chỉ revision 1 không có tiền nhiệm.
- Một điều chưa biết `contradicted` nêu tên ít nhất một id mâu thuẫn, và không id nào xuất hiện trong cả hai danh sách.
- Một resolution `verified` nêu tên ít nhất một id bằng chứng có độ tin cậy và thẩm quyền được yêu cầu.

Quy tắc thứ ba là nơi sổ từ chối thường xuyên nhất. Các ghi chú workflow của rea nói "Chỉ bằng chứng observed đủ điều kiện có thể xác minh một resolution.". `resolve_unknown()` do đó từ chối mô hình bảng, từ chối một bản ghi observed với thẩm quyền `shipped-artifact` và chấp nhận bản ghi chạy `ev_f4ffbe8f922ec7fe…`. Revision đã giải quyết cho `grade(95)` là revision 2, và `previous_revision_digest` của nó là `ffca840b55a8a188…`, digest của revision 1.

`update_unknown()` nhận `expected_revision` và phát sinh `revision-conflict` khi nó cũ, như công cụ `update_unknown` của rea làm. Phản ứng đúng là điều các ghi chú của rea đưa ra: đọc lại revision hiện tại và quyết định lại.

Một điều chưa biết vẫn mở sau demo: `unk_f2eb0d7f84c80a19…`, "grade(score) == 4 với mọi điểm từ 90 đến 100 có đúng khi hàm đã biên dịch chạy không?". Trạng thái của nó là `investigating`, các id hỗ trợ của nó bao gồm hai lần chạy, và thăm dò của nó vẫn nêu tên chín đầu vào không có lần chạy.

## A Cache of Answers Is Not a Database of Analysis

rea có ba thứ trông như một cache. Snapshot mục tiêu Ghidra là một bản sao riêng của đầu vào, được import với `-readOnly -deleteProject` và xóa khi đóng. `AnalysisSnapshotCache` trong bộ nhớ chứa tối đa 10,000 mục cho một danh tính binary. Tệp snapshot chứa `target`, `binding`, `entries`, `workflow_entries` và một `evidence_bundle`.

Khóa cache là `query_` cộng SHA-256 trên `{target, binding, operation, parameters}`. `target` là `{sha256, kind, format, architecture}`, và một mục tiêu `raw-binary` cũng có `entry_point`. `binding` là provider và toàn bộ analysis profile, bao gồm digest. Thay đổi bất kỳ tham số nào trong 25 tham số profile, ví dụ `jump_table_evidence` từ `typed-case-default-blocks-v1` sang một `v2`, và digest thay đổi, nên mọi khóa thay đổi.

`code/fixtures/rea-snapshot.json` là tệp rea ghi trong hai lần chạy, 142,690 byte. rea ghi nó với quyền chỉ chủ sở hữu, và bản sao đã commit có thể đọc bởi mọi người. Nó có hai mục và một gói bằng chứng với cùng hai bản ghi. `AnswerCache.import_snapshot()` tính lại mỗi `query_id` và từ chối tệp khi bất kỳ giá trị nào khác. Nó từ chối một snapshot có `target` hoặc `binding` khác cái đang hoạt động, với cách diễn đạt của rea `profile_mismatch`. Nó từ chối một snapshot có `format_version` không phải `course-answer-cache-1`.

Ba phép đo từ máy này. Truy vấn `grade` đầu tiên mất 8.6 s, với một lần import Ghidra mới. Truy vấn `percent_change` với cùng snapshot mất 8.5 s, vì một truy vấn khác là một cache miss. Một truy vấn `grade` thứ ba mất 2.1 s và trả về bản ghi giống hệt với `evidence_id` giống hệt. Phát lại trong bộ nhớ của rea thêm giới hạn "Được tải từ một snapshot phân tích REA cục bộ; lần gọi này không chạy lại provider.". `lookup()` của chúng ta thêm một câu cùng loại, để người đọc có thể phân biệt một lần phát lại với một câu trả lời mới.

Một biến đổi chấm dứt cache. Trong rea 6.5.0, một lần đổi tên hoặc một bình luận xóa snapshot cache trước khi rea gửi lần gọi đến provider. Một phản hồi thất bại không thể chứng minh lần ghi đã rollback, nên một lần ghi thất bại cũng dừng phát lại. Một lần import metadata thay đổi cơ sở dữ liệu làm tương tự.

## Why an Agent Needs This

Một agent điều khiển rea qua MCP thấy toàn bộ bản ghi trên mỗi lần gọi và có thể trích `evidence_id` trong báo cáo của nó. Nghiên cứu từ năm 2026 nói điều đó sai ở đâu. Quá tin đầu ra công cụ là một trong bốn điểm yếu trong nghiên cứu NDSS BAR. Trong nghiên cứu văn bản được cấy, hiển thị nội dung binary chỉ như dữ liệu vẫn để lại 15 đề xuất không an toàn trên 40, và kiểm tra nguồn gốc với ủy quyền công cụ loại bỏ chúng. Một nghiên cứu thứ ba theo dõi một agent điều khiển Ghidra qua MCP ([arXiv 2606.06838](https://arxiv.org/abs/2606.06838)). Trong các binary có hàng trăm hàm, chỉ 10 đến 15 phần trăm nhận phân tích thực trước khi agent tạo các stub.

Sổ trả lời mỗi điều này bằng một bản ghi, và agent chỉ báo cáo những gì sổ chứa. Một khẳng định không có lần chạy observed là `unsupported`. Một khẳng định có một số lần chạy là `unknown`. Một văn bản provider là `observed` về provider và không gì hơn. Đưa cho agent tệp skill trong `outputs/` và làm sổ thành nơi duy nhất nó viết các kết luận. Điều đó đúng cho Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Build It

Chạy demo dùng thư viện chuẩn:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
```

Demo đọc object, import hai bản ghi rea, xác minh snapshot rea và suy ra hai mô hình. Rồi nó ghi 18 dự đoán, mở 18 điều chưa biết, biên dịch và chạy harness, kiểm tra mọi khẳng định và giải quyết 17 điều chưa biết. Dạng kỳ vọng:

```json
{
  "records": 81,
  "by_confidence": { "observed": 25, "derived": 38, "inferred": 18 },
  "rea_snapshot": { "entries": 2, "replay_hit": true, "stale_profile_refused": true },
  "grade_table": [1, 2, 3, 4, 4],
  "runs": "live: Apple clang version 17.0.0 (clang-1700.6.3.2)",
  "claims": [ { "claim_id": "grade(95)", "status": "pass", "covered": "1/1" }, { "claim_id": "grade(90..100)", "status": "unknown", "covered": "2/11" } ],
  "completion_ledger_id": "ecl_da64933ea13befed9483f8b00447bb3f4ceb74324c01e2515eff03f3af3ca750",
  "complete": false,
  "unknowns": { "resolved": 17, "investigating": 1 }
}
```

Không có một compiler C, `runs` đọc là `imported 17 recorded run records from run-evidence.json` và phần còn lại giống nhau.

Đọc `code/main.py` theo thứ tự này:

1. `canonical_json()` và `compute_evidence_id()` chứa công thức hash và phép chiếu ngữ nghĩa.
2. `create_evidence()` và `validate_evidence()` xây dựng và kiểm tra một bản ghi.
3. `EvidenceLedger.record()` và `import_bundle()` lưu các bản ghi và từ chối xung đột.
4. `open_unknown()`, `update_unknown()` và `resolve_unknown()` giữ chuỗi revision.
5. `observe_object()` đọc ELF, và `derive_grade_model()` đọc bảng.
6. `claim_suite()`, `predict()` và `record_prediction()` ghi tầng inferred.
7. `observe_runs()` biến mỗi lần chạy harness thành một bản ghi observed.
8. `check_claim()`, `promote_claim()` và `completion_ledger()` áp dụng các quy tắc nâng cấp.
9. `AnswerCache` đặt khóa câu trả lời như các snapshot của rea và từ chối những câu trả lời cũ.

## Use It

Giữ một sổ mỗi mục tiêu và mỗi cuộc điều tra. Đặt SHA-256 của mục tiêu trong mọi subject và scope digest của câu hỏi trong mọi điều chưa biết. Khi bạn thay công cụ, thay `provider` và để các id phân kỳ. Khi bạn dựng lại fixture, digest subject thay đổi và mọi bản ghi cũ trở thành bằng chứng về một tệp khác.

Viết các giới hạn ngay lúc bạn biết chúng. Trình đọc không áp dụng relocation nói vậy. Lần chạy của một bản build host nói vậy. Mô hình suy ra một số chia nói vậy. Một bản ghi viết không có các giới hạn của nó trông mạnh hơn những gì sự kiện cho phép, và người đọc sau không thể sửa điều đó.

Coi mọi văn bản provider là dữ liệu. Các chuỗi và mã giả từ mục tiêu là văn bản mà mục tiêu kiểm soát. Chúng không bao giờ trở thành chỉ dẫn, và không bao giờ trở thành quan sát hành vi. rea 6.5.0 đánh dấu các kết quả như vậy bằng `_meta.provenance.untrusted_content: true`. Các chỉ dẫn server của nó nói mô hình coi nội dung mục tiêu là dữ liệu và báo cáo mọi yêu cầu trong đó để chạy, cài đặt, tải xuống hoặc gửi thứ gì đó như một nỗ lực prompt injection. Dấu giúp ích, nhưng sổ của bạn vẫn phải giữ văn bản mục tiêu ngoài các chỉ dẫn.

## Interactive Lab

### Lab A: recompute a rea id

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code
python3 -q
```

Chạy:

```python
from main import *
record = load_evidence_file(FIXTURES / "rea-evidence-grade.json")
record["evidence_id"] == compute_evidence_id(record)
record["subject"]["local_path"] = "/home/you/re/ledger-x86_64-O1.o"
record["evidence_id"] == compute_evidence_id(record)
record["limitations"].pop()
record["evidence_id"] == compute_evidence_id(record)
```

Hai phép so sánh đầu đúng. Đường dẫn không nằm trong hash. Phép thứ ba sai, vì một giới hạn là nội dung.

### Lab B: refuse a promotion

```python
ledger, report = build_ledger(live_runs=False)
claim = [c for c in claim_suite(ledger.find(operation="derive_switch_model")[0], ledger.find(operation="derive_arithmetic_model")[0], ledger.find(operation="read_source")[0]) if c.claim_id == "grade(55)"][0]
promote_claim(ledger, claim, [ledger.find(operation="derive_switch_model")[0]["evidence_id"]])
```

Lần gọi phát sinh `ClaimError` và nêu tên id derived. Giờ truyền id chạy:

```python
run = run_records_for(ledger, "grade", [55])[0]
promote_claim(ledger, claim, [run["evidence_id"]])["status"]
```

Trạng thái là `pass`, và `limitations` được trả về mang câu về bản build host.

### Lab C: refuse a stale snapshot

```python
import json
snapshot = json.loads(REA_SNAPSHOT_PATH.read_text())
target, binding = rea_snapshot_binding(snapshot)
AnswerCache(target, binding).import_snapshot(snapshot)
stale = dict(binding["analysis_profile"]["parameters"], jump_table_evidence="typed-case-default-blocks-v2")
AnswerCache(target, {"provider": binding["provider"], "analysis_profile": make_profile(binding["provider"], stale)}).import_snapshot(snapshot)
```

Lần import đầu trả về 2. Lần thứ hai phát sinh `CacheError` với `profile_mismatch`. Một chuỗi phiên bản thay đổi, và toàn bộ snapshot bị từ chối.

### Lab D: break the chain

```python
unknown_id = [u for u, r in ledger.unknowns.items() if r[-1]["status"] == "investigating"][0]
ledger.verify_unknown_chain(unknown_id)
ledger.unknowns[unknown_id][0]["severity"] = "critical"
ledger.verify_unknown_chain(unknown_id)
```

Lần gọi đầu trả về 2. Lần thứ hai phát sinh `EvidenceIntegrityError`, vì revision 1 không còn khớp digest của chính nó và revision 2 trỏ đến một digest không còn tồn tại.

## Practice Lab

Đóng điều chưa biết đang mở và thêm một provider thứ hai.

Yêu cầu:

- Mở rộng `run_grid()` để chín đầu vào thiếu của khẳng định phạm vi được chạy, rồi xác nhận điều chưa biết chuyển sang `resolved` ở revision 3.
- Thêm `llvm-objdump -d` làm một provider thứ hai với đối tượng `provider` riêng và ghi danh sách `grade` của nó là `observed`.
- Viết một bản ghi `derived` nêu rằng hai danh sách, của Ghidra và llvm-objdump, giải mã cùng 14 chỉ lệnh, và liên kết cả hai.
- Mở một điều chưa biết cho `grade_label(105)` với mức nghiêm trọng `high`, vì chỉ số bảng 4 đọc `labels[4]`, và giải quyết nó bằng một lần chạy.
- Xuất sổ bằng `export_bundle()`, import nó vào một sổ mới và chứng minh mọi chuỗi vẫn xác minh được.

Thành công nghĩa là một báo cáo trong đó mỗi câu trích một id từ gói và một khẳng định `unknown` đã biến mất.

## Graded Lab

Năm câu hỏi về các fixture của bài học này. Tìm mỗi câu trả lời bằng mã bạn đã xây dựng, rồi ghi nó vào `code/lab_answers.json`. Viết số dưới dạng số hoặc chuỗi hex chẳng hạn `"0x40"`, và danh sách dưới dạng danh sách JSON.

1. `t1`: evidence id mà compute_evidence_id cho rea-evidence-grade.json.
2. `t2`: số giới hạn trong bản ghi grade.
3. `t3`: trạng thái relationship_coverage của bản ghi grade.
4. `t4`: confidence và authority của bản ghi grade, dưới dạng một danh sách hai chuỗi.
5. `t5`: SHA-256 của subject của bản ghi grade.

Kiểm tra các câu trả lời của bạn:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/lab.py
```

Bộ kiểm tra tính mỗi giá trị kỳ vọng từ `code/main.py` trên các fixture đã commit. Nó in `PASS`, `FAIL` hoặc `TODO` cho mỗi tác vụ và một điểm số, và nó chỉ thoát 0 khi cả năm qua. `python3 code/lab.py my-answers.json` kiểm tra một tệp khác. `code/tests/test_lab.py` chứng minh rằng bộ kiểm tra chấp nhận các câu trả lời đúng và từ chối một câu sai.

### See it run

Máy [Inside a Decompiler](https://aiengineeringfromscratch.com/inside-a-decompiler?symbols=off) giữ một sổ bằng chứng với bốn khay: observed, derived, inferred và unknown. Liên kết này mở lần chạy với bảng symbol tắt, nên tên và cuối hàm được xếp như các điều chưa biết và điểm bắt đầu được xếp là inferred.

## Lesson Artifact

Bài học này tạo ra `outputs/skill-evidence-ledger.md`. Nó nói một agent cách viết mọi phát hiện dưới dạng một bản ghi với độ tin cậy, thẩm quyền, giới hạn và liên kết. Nó nói agent cách giữ các điều chưa biết dưới dạng revision, và khi nào một khẳng định là `pass`, `fail`, `unknown` hoặc `unsupported`.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

28 bài kiểm tra chứng minh:

- cả hai giá trị `evidence_id` của rea, digest profile và cả hai giá trị `query_id` snapshot được tính lại từ nội dung
- một đường dẫn thay đổi giữ id và một giới hạn thay đổi làm nó thay đổi
- một bản ghi bị sửa, một provider profile không khớp, một float và một giá trị enum không biết bị từ chối
- một bản ghi trùng lặp trả về `duplicate`, một bản ghi xung đột phát sinh ngoại lệ và một lần import gói là nguyên tử
- gói chạy đã ghi import với 18 bản ghi và không có liên kết treo
- một điều chưa biết mở ở revision 1, từ chối một `expected_revision` cũ và chỉ được giải quyết bằng bằng chứng `controlled-replay` observed
- một revision được chỉnh sửa phá chuỗi
- việc nâng cấp từ chối bằng chứng inferred, derived, rỗng và không liên quan, và qua với một lần chạy đồng nhất
- độ bao phủ một phần là `unknown` và một lần chạy bất đồng là `fail`
- cache hit trên khóa chính xác và miss trên các tham số khác
- cache từ chối một phiên bản profile được tăng, một mục tiêu sai, một phiên bản định dạng sai và một khóa bị sửa
- trình đọc ELF đồng nhất với `llvm-objdump` về offset, kích thước, byte và relocation, và bảng đọc ra `1, 2, 3, 4, 4`
- các dự đoán sử dụng phép chia C, và các lần chạy đã ghi đồng nhất với cả 17 khẳng định đầu vào đơn
- khi có compiler, các lần chạy trực tiếp cũng đồng nhất

## Production Failure Modes

| Lỗi | Báo cáo yếu nói gì | Sổ yêu cầu gì |
|---|---|---|
| Mã giả được đọc như hành vi | "grade trả về 0 cho các điểm trượt" | một bản ghi `execute_function` cho đầu vào đó, hoặc `unsupported` |
| Tin chữ ký decompiler | "percent_change trả về 16 byte" | chữ ký được đánh dấu là suy luận của provider với độ tin cậy `low` của nó |
| Danh sách rỗng được đọc là vắng mặt | "hàm không có caller" | một trạng thái `unknown`, hoặc một trường bao phủ khi công cụ cung cấp |
| Đường dẫn được hash vào id | "bản ghi đã thay đổi" sau một lần sao chép | phép chiếu ngữ nghĩa không có `name` và `local_path` |
| Giới hạn bị bỏ khỏi một bản sao | một bản ghi trông mạnh hơn nguồn | id không khớp và bị từ chối khi import |
| Lưới một phần được làm tròn lên | "mọi điểm từ 90 qua" | `unknown` với `covered` 2 trên 11 |
| Lần chạy host được trình bày như lần chạy object | "object x86-64 trả về 25" | giới hạn bản build host được mang theo khẳng định |
| Điều chưa biết được đóng bằng một câu | "đã giải quyết, xem ở trên" | một resolution `verified` với các id observed có thẩm quyền được yêu cầu |
| Revision cũ bị ghi đè | chỉnh sửa của hai nhà phân tích xung đột | `revision-conflict` và đọc lại |
| Snapshot cũ được phát lại sau một bản phát hành | các câu trả lời từ một hợp đồng đã thay đổi | `profile_mismatch` khi import |
| Cache được giữ sau một lần đổi tên | một lần phát lại che giấu một lần ghi metadata | vô hiệu hóa trước khi phân phối và một lần xuất thất bại |

## Operational Rule

Ghi điều bạn đọc, điều bạn tính và điều bạn kỳ vọng như ba loại bản ghi với ba từ. Đóng một điều chưa biết bằng một id, không bao giờ bằng một câu. Chỉ phát lại một câu trả lời dưới đúng khóa mà nó được lưu cùng, và từ chối nó khi một chuỗi phiên bản khác.

## Further Reading

- [rea 6.5.0 source, `src/domain/evidence.ts` and `src/domain/residualUnknown.ts`](https://github.com/morluto/rea)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Agent Failure Patterns in CTF Reverse Engineering, NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)
- [When Binaries Talk Back: Representation-Confusion Attacks on LLM-Assisted Reverse Engineering, arXiv 2607.12507](https://arxiv.org/abs/2607.12507)
- [Agentic decompilation study, arXiv 2606.06838](https://arxiv.org/abs/2606.06838)
- [When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370](https://arxiv.org/abs/2609.05370)
- Nguồn rea 6.5.0 tại tag `3b79af2` mà bài học này mô tả: `src/domain/evidence.ts`, `.agents/skills/reverse-engineer-anything/SKILL.md`, `docs/cli.md`, `src/domain/reconstructionVerification.ts`, `src/application/ReconstructionObligationCandidates.ts`, `docs/tool-design.md`, `src/domain/evidenceCompletionLedger.ts`, `src/domain/residualUnknown.ts`, `src/application/investigation/UnknownEvidence.ts`, `.agents/skills/reverse-engineer-anything/references/evidence-workflows.md`, `src/application/binary/AnalysisSnapshotCache.ts`, `src/domain/analysisSnapshot.ts`, `src/application/binary/BinarySession.ts`, `src/application/binary/BinarySessionRecords.ts`, `docs/mcp-contracts.md`.
