# Capstone 09 — Code Migration Agent (Repo-Level Language / Runtime Upgrade)

> MigrationBench của Amazon (Java 8 lên 17) và công cụ di chuyển Py2 sang Py3 cho App Engine của Google đặt ra chuẩn năm 2026. OpenRewrite của Moderne thực hiện các phép viết lại AST tất định ở quy mô lớn. Grit nhắm đến cùng vấn đề bằng DSL kiểu codemod. Mẫu triển khai sản xuất kết hợp cả hai: một nền tảng tất định cho các phép viết lại an toàn cùng một lớp agent cho các trường hợp mơ hồ, một sandbox cho các bản dựng theo nhánh, và một bộ kiểm thử chuyển sang xanh trước khi PR được mở. Bài tổng kết là di chuyển 50 repo thực và công bố tỷ lệ đạt cùng một hệ phân loại lỗi.

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:** P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## Problem

Di chuyển mã ở quy mô lớn là một trong những ứng dụng sản xuất rõ ràng nhất của agent lập trình năm 2026. Đáp án chuẩn rất rõ (bộ kiểm thử có đạt sau khi di chuyển không?), phần thưởng là thực (di chuyển một tập hợp hệ thống Java-8 là một dự án ở quy mô nhân sự), và các benchmark được công khai (tập con 50 repo của MigrationBench). OpenRewrite của Moderne xử lý phần tất định. Lớp agent xử lý mọi thứ mà các công thức OpenRewrite không thể: các phép viết lại mơ hồ, sự sai lệch của hệ thống dựng, cú pháp hiếm gặp, sự hỏng hóc của phụ thuộc bắc cầu.

Bạn sẽ xây dựng một agent nhận một repo Java 8 (hoặc repo Python 2) và tạo ra một nhánh đã di chuyển với CI xanh. Bạn sẽ đo tỷ lệ đạt, mức bảo toàn độ bao phủ kiểm thử, chi phí trên mỗi repo, và xây dựng một hệ phân loại lỗi. So sánh song song với một đường cơ sở chỉ dùng phương pháp tất định cho bạn biết giá trị của agent thực sự nằm ở đâu.

## Concept

Pipeline có hai lớp. **Nền tảng tất định** (OpenRewrite cho Java, libcst cho Python) chạy phần lớn các phép viết lại cơ học một cách an toàn: import, chữ ký phương thức, chỉnh sửa an toàn null, try-with-resources, thay thế API đã bị phản đối sử dụng. Nó nhanh và tạo ra các diff có thể kiểm toán. **Lớp agent** (OpenAI Agents SDK hoặc LangGraph trên Claude Opus 4.7 và GPT-5.4-Codex) xử lý các trường hợp mà công thức không thể: nâng cấp file dựng (Maven/Gradle/pyproject), xung đột phụ thuộc bắc cầu, kiểm thử chập chờn, annotation tùy chỉnh.

Mỗi repo nhận một sandbox Daytona với runtime đích được cài sẵn. Agent lặp: chạy bản dựng, phân loại lỗi, áp dụng bản sửa, chạy lại. Giới hạn cứng: 30 phút mỗi repo, $8 mỗi repo, 20 lượt agent. Nếu mọi kiểm thử đều đạt và chênh lệch độ bao phủ không âm, nhánh sẽ mở một PR. Nếu không, repo được xếp vào một lớp lỗi kèm bằng chứng.

Hệ phân loại lỗi là sản phẩm bàn giao. Trên 50 repo, thứ gì bị hỏng? Phụ thuộc bắc cầu? Annotation tùy chỉnh? Phiên bản công cụ dựng? Kiểm thử chập chờn không liên quan đến việc di chuyển? Mỗi lớp nhận một số đếm và một diff minh họa. Những người viết công thức trong tương lai có thể nhắm vào ba lớp đứng đầu.

## Architecture

```
target repo
      |
      v
OpenRewrite / libcst deterministic recipes
   (safe, fast, auditable, ~70-80% of fixes)
      |
      v
Daytona sandbox per branch
      |
      v
agent loop (Claude Opus 4.7 / GPT-5.4-Codex):
   - run build -> capture failures
   - classify failures (build, test, lint)
   - apply fix (patch or retry recipe)
   - rerun
   - budget: 30 min, $8, 20 turns
      |
      v
test + coverage delta gate
      |
      v (passed)
open PR
      |
      v (failed)
file under failure class + attach repro
```

## Stack

- Nền tảng tất định: OpenRewrite (Java) hoặc libcst (Python)
- Agent: OpenAI Agents SDK hoặc LangGraph trên Claude Opus 4.7 + GPT-5.4-Codex
- Sandbox: devcontainer Daytona cho mỗi nhánh, runtime đích được cài sẵn (Java 17 / Python 3.12)
- Hệ thống dựng: Maven, Gradle, uv (Python)
- Benchmark: tập con 50 repo của Amazon MigrationBench (Java 8 lên 17), các repo Py2 sang Py3 của Google App Engine
- Bộ kiểm thử: trình chạy song song, độ bao phủ qua Jacoco (Java) hoặc coverage.py (Python)
- Khả năng quan sát: Langfuse + gói trace cho mỗi repo với mọi đoạn diff
- Bảng điều khiển: bảng điều khiển hệ phân loại lỗi với số đếm theo lớp và các diff minh họa

```figure
ce-migration-funnel
```

## Build It

1. **Lượt công thức.** Chạy các công thức OpenRewrite (Java) hoặc libcst (Python) trước. Xử lý 70-80% các lần di chuyển mang tính cơ học. Commit thành commit "recipe".

2. **Thử dựng.** Sandbox Daytona: cài runtime đích, chạy bản dựng. Nếu xanh, chuyển đến kiểm thử. Nếu đỏ, bàn giao cho agent.

3. **Vòng lặp agent.** LangGraph với các công cụ: `run_build`, `read_file`, `edit_file`, `run_test`, `git_diff`. Agent phân loại lỗi (phụ thuộc, cú pháp, kiểm thử, công cụ dựng) và áp dụng một bản sửa có mục tiêu. Chạy lại.

4. **Trần ngân sách.** 30 phút thời gian thực mỗi repo, chi phí $8, 20 lượt agent. Bất kỳ vi phạm nào đều dừng và xếp vào "budget_exhausted" kèm diff hiện tại.

5. **Cổng kiểm thử + độ bao phủ.** Sau khi bản dựng chuyển sang xanh, chạy bộ kiểm thử. So sánh độ bao phủ với repo cơ sở. Nếu độ bao phủ giảm hơn 2%, xếp vào "coverage_regression".

6. **Mở PR.** Khi thành công, đẩy nhánh, mở PR với diff và bản tóm tắt những công thức đã áp dụng và những commit do agent tạo.

7. **Hệ phân loại lỗi.** Với mỗi repo thất bại, gắn một lớp: `dep_upgrade_required`, `build_tool_drift`, `custom_annotation`, `test_flake`, `syntax_edge_case`, `budget_exhausted`. Xây dựng một bảng điều khiển.

8. **Chạy 50 repo.** Thực thi trên tập con MigrationBench. Báo cáo tỷ lệ đạt theo lớp, chi phí trên mỗi repo, mức bảo toàn độ bao phủ, và một đường cơ sở so sánh với phương pháp chỉ dùng công cụ tất định.

## Use It

```
$ migrate legacy-java-service --target java17
[recipe]   27 rewrites applied (JUnit 4->5, HashMap initializer, try-with-resources)
[build]    FAIL: cannot find symbol sun.misc.BASE64Encoder
[agent]    turn 1 classify: removed_jdk_api
[agent]    turn 2 apply: sun.misc.BASE64Encoder -> java.util.Base64
[build]    OK
[tests]    412/412 passing; coverage 84.1% -> 84.3%
[pr]       opened #1841  cost=$3.20  turns=4
```

## Ship It

`outputs/skill-migration-agent.md` là sản phẩm bàn giao. Với một repo được cung cấp, nó thực thi các công thức tất định rồi một vòng lặp agent để tạo ra một nhánh đã di chuyển xanh, hoặc xếp repo vào một lớp phân loại.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Tỷ lệ đạt MigrationBench | pass@1 trên tập con 50 repo |
| 20 | Bảo toàn độ bao phủ kiểm thử | Chênh lệch độ bao phủ trung bình so với cơ sở |
| 20 | Chi phí trên mỗi repo đã di chuyển | $/repo trên các lần chạy đạt |
| 20 | Tích hợp agent / công cụ tất định | Tỷ lệ bản sửa do OpenRewrite xử lý so với do agent tạo |
| 15 | Bài viết phân tích lỗi | Mức đầy đủ của hệ phân loại với các ví dụ minh họa |
| **100** | | |

## Exercises

1. Chạy pipeline di chuyển chỉ với OpenRewrite (không có agent). So sánh tỷ lệ đạt với pipeline đầy đủ. Xác định các trường hợp mà chỉ riêng agent tạo ra khác biệt.

2. Triển khai một bước kiểm tra "sạch lint": sau khi di chuyển, chạy một trình lint phong cách (spotless cho Java, ruff cho Python). Đánh trượt PR nếu xuất hiện lỗi lint mới. Đo tỷ lệ bảo toàn độ bao phủ nhưng phong cách bị thoái lui.

3. Thêm một bộ tối ưu "diff tối thiểu": sau khi nhánh của agent đạt kiểm thử, cắt bỏ các thay đổi không cần thiết bằng một lượt thứ hai. Báo cáo mức giảm kích thước diff.

4. Mở rộng sang lần di chuyển thứ ba: Node 18 lên Node 22. Tái sử dụng lớp bọc sandbox; thay lớp công thức bằng một codemod tùy chỉnh.

5. Đo thời gian đến bản dựng xanh đầu tiên (TTFGB) như một chỉ số UX. Mục tiêu: p50 dưới 10 phút.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Deterministic substrate (Nền tảng tất định) | "Bộ máy công thức" | OpenRewrite / libcst: các phép viết lại AST khai báo với bảo đảm an toàn |
| Codemod | "Chương trình sửa đổi mã" | Một quy tắc viết lại thay đổi mã nguồn một cách cơ học |
| Build drift (Sai lệch bản dựng) | "Lệch phiên bản công cụ" | Các thay đổi hành vi tinh vi của Maven / Gradle / uv giữa các phiên bản chính |
| Failure class (Lớp lỗi) | "Nhóm phân loại" | Một lý do được gắn nhãn khiến repo không di chuyển được: phụ thuộc, cú pháp, kiểm thử, công cụ dựng, ngân sách |
| Coverage delta (Chênh lệch độ bao phủ) | "Bảo toàn độ bao phủ" | Thay đổi % độ bao phủ kiểm thử từ nhánh cơ sở đến nhánh đã di chuyển |
| Agent turn (Lượt agent) | "Vòng gọi công cụ" | Một chu kỳ lập kế hoạch -> hành động -> quan sát trong vòng lặp agent |
| Budget exhaustion (Cạn ngân sách) | "Chạm trần" | Repo đã tiêu thụ giới hạn 30 phút / $8 / 20 lượt mà không đạt |

## Further Reading

- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) — benchmark chuẩn năm 2026
- [Moderne.io OpenRewrite platform](https://www.moderne.io) — tham chiếu nền tảng tất định
- [OpenRewrite documentation](https://docs.openrewrite.org) — viết công thức
- [Grit.io](https://www.grit.io) — DSL codemod thay thế
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) — tham chiếu Agents SDK
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) — benchmark di chuyển thay thế
- [libcst](https://github.com/Instagram/LibCST) — nền tảng tất định Python
- [Daytona sandboxes](https://daytona.io) — sandbox tham chiếu cho mỗi nhánh
