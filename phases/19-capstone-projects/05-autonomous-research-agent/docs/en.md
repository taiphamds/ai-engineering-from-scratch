# Capstone 05 — Autonomous Research Agent (AI-Scientist Class)

> AI-Scientist-v2 của Sakana công bố bài báo đầy đủ. Agent Laboratory chạy thí nghiệm. Allen AI chia sẻ dấu vết. Hình dạng 2026 là tìm kiếm cây lập kế hoạch-thực thi-xác minh trên thí nghiệm, chi phí có ngân sách, thực thi mã trong sandbox, bộ viết LaTeX phản hồi thị giác và tổ hợp phản biện tự động kiểu NeurIPS. Bài tổng kết là xây một hệ thống, chạy đầu cuối trong $30 mỗi bài và trụ qua red team thoát sandbox Sakana ghi nhận.

**Type:** Capstone
**Languages:** Python (agent + sandbox), LaTeX (output)
**Prerequisites:** Phase 2 (ML), Phase 3 (deep learning), Phase 7 (transformers), Phase 10 (LLMs from scratch), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 18 (safety)
**Phases exercised:** P0 · P2 · P3 · P7 · P10 · P14 · P15 · P16 · P18
**Time:** 40 hours

## Problem

Agent nghiên cứu tự chủ vượt ngưỡng năm 2026. AI-Scientist-v2 Sakana AI được công bố trên Nature với bài được sinh vượt phản biện workshop. ShinkaEvolve (ICLR 2026) mở rộng hướng sang giả thuyết tiến hóa. Agent Laboratory AMD cung cấp dấu vết tái lập được. Agent không là phép thuật — là vòng lặp lập kế hoạch-thực thi-xác minh chạy trên cây thí nghiệm ứng viên, với trần chi phí, sandbox gắn seed và phản biện tự động. Kỹ nghệ nằm ở vòng lặp, ngân sách và câu chuyện an toàn.

Bạn học vòng lặp bằng triển khai một hệ thống theo ý tưởng hạt giống trong miền hẹp (ví dụ: thí nghiệm loại bỏ độ thưa attention trên transformer 100M tham số). Giá trị không nằm ở khám phá mới trong lần chạy đầu. Giá trị nằm ở hạ tầng: tìm kiếm cây, sandbox thí nghiệm, vòng lặp viết-phản biện, báo cáo red-team. Nhóm Sakana ghi nhận lỗi thoát sandbox; agent của bạn phải vượt cùng red team.

## Concept

Agent là tìm kiếm cây ưu tiên tốt nhất. Nút là đặc tả thí nghiệm: (giả thuyết, cấu hình, mã, kết quả kỳ vọng). Bước mở rộng đề xuất nút con với sửa nhỏ (đổi bộ tối ưu, đổi kích thước lô, loại thành phần). Mỗi con chạy sandbox mới với trần tài nguyên cứng. Kết quả đưa lại hàm chấm xếp nút theo (tính mới × chất lượng × ngân sách còn). Cây tăng đến khi hết ngân sách, rồi nhánh tốt nhất được viết thành bài.

Bộ viết đa phương thức. Nó tạo bản thảo LaTeX, biên dịch, render hình và đưa PDF đã render trở lại chế độ thị giác Claude Opus 4.7 để phê bình bố cục, độ rõ hình, phù hợp khẳng định-bằng chứng. Tổ hợp năm giám khảo LLM xuất điểm kiểu NeurIPS (tính mới, nghiêm ngặt, rõ ràng, tái lập, tác động); nếu trung bình dưới ngưỡng, bài trở lại bộ viết với phê bình.

An toàn đóng vai trò quyết định. Mọi thí nghiệm chạy sandbox E2B hoặc Daytona không lưu lượng mạng ra, thời gian thực có giới hạn và giới hạn tài nguyên được ghim. Bước sinh mã agent qua lớp chính sách chặn syscall thoát sandbox. Báo cáo red-team tái tạo bề mặt tấn công Sakana ghi nhận (fork bomb, thoát hệ thống file, lệnh gọi mạng LLM viết).

## Architecture

```
seed idea + domain
      |
      v
  literature search (Semantic Scholar + OpenAlex + FAISS cache)
      |
      v
  LangGraph plan-execute-verify tree
      |
      v
  +--- expand node ----+      per-node sandbox
  |                    |      (E2B / Daytona)
  v                    v      resource caps
  child_1           child_k   no network egress
  |                    |      deterministic seeds
  v                    v
  run experiment       run experiment
  |                    |
  v                    v
  score nodes by (novelty, quality, budget)
      |
      v
  best branch -> LaTeX writer
      |
      v
  compile + vision critique (Opus 4.7 vision)
      |
      v
  reviewer ensemble (5 LLM judges, NeurIPS rubric)
      |
      v
  paper.pdf + review.md + trace.json
```

## Stack

- Điều phối: LangGraph có checkpoint và cổng con người phê duyệt
- Tìm kiếm cây: ưu tiên tốt nhất tùy chỉnh trên nút thí nghiệm (kiểu AB-MCTS từ Sakana v2)
- Sandbox: E2B mỗi thí nghiệm, dự phòng Docker-in-Docker; trần tài nguyên qua cgroups
- Tài liệu nghiên cứu: Semantic Scholar Graph API + OpenAlex + bộ nhớ đệm FAISS cục bộ cho tóm tắt
- Bộ viết: mẫu LaTeX + Claude Opus 4.7 (chế độ thị giác) để phê bình hình và bố cục
- Bộ phản biện: tổ hợp 5 giám khảo (Opus 4.7, GPT-5.4, Gemini 3 Pro, DeepSeek R1, Qwen3-Max) với tổng hợp trọng số
- Framework thí nghiệm: PyTorch 2.5 cho thí nghiệm vật lý, W&B để ghi log
- Khả năng quan sát: Langfuse cho dấu vết agent, ngân sách cứng $30 mỗi bài

```figure
ce-experiment-tree
```

## Build It

1. **Xác định seed và phạm vi miền.** Lấy ý tưởng hạt giống (ví dụ: "khảo sát mẫu độ thưa trong bản đồ attention của transformer dưới 1B"). Định nghĩa không gian tìm: mô hình, tập dữ liệu, ngân sách tính toán.

2. **Lượt tài liệu nghiên cứu.** Truy vấn Semantic Scholar + OpenAlex cho 50 bài liên quan được trích nhiều nhất; lưu bộ nhớ đệm tóm tắt cục bộ; tạo bản tổng hợp miền 1 trang.

3. **Dựng khung cây.** Khởi tạo gốc bằng giả thuyết hạt giống. Triển khai `expand(node) -> children` với đề xuất sửa nhỏ (một đổi cấu hình mỗi con). Triển khai `score(node)` như số hạng có trọng số tính mới × chất lượng × ngân sách.

4. **Bọc sandbox.** Mỗi thí nghiệm chạy `docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only` (hoặc chính sách E2B tương đương). Seed được ghi vào sandbox; đầu ra gắn chỉ đọc trở ra.

5. **Vòng lặp lập kế hoạch-thực thi-xác minh.** `plan` đề xuất con. `execute` chạy sandbox, thu log và chỉ số. `verify` chạy kiểm tra đơn vị trên chỉ số (mất mát có giảm? loại bỏ có cô lập hiệu ứng?). Nút thất bại có lý do lỗi lưu trên cây.

6. **Bộ viết.** Sau ngân sách, chọn nhánh tốt nhất. Render hình bằng matplotlib. Tạo bản thảo LaTeX qua Claude Opus 4.7 với dấu vết nhánh trong ngữ cảnh. Biên dịch. Đưa PDF biên dịch trở lại thị giác Opus 4.7 để phê bình. Lặp.

7. **Tổ hợp phản biện.** Năm giám khảo chấm bản thảo theo (tính mới, nghiêm ngặt, rõ ràng, tái lập, tác động) bằng tiêu chí kiểu NeurIPS. Nếu trung bình < 4.0/5, trả bộ viết với phê bình. Dừng cứng sau 3 lần viết lại.

8. **Red team.** Xây hoặc tích hợp tập tác vụ đối kháng nhắm sandbox: fork bomb, nỗ lực đưa dữ liệu ra mạng trái phép, thoát hệ thống file, siêu ký tự shell LLM viết. Xác nhận tất cả bị chặn. Viết phát hiện.

9. **Khả năng tái lập.** Mọi bài đi kèm JSON dấu vết tìm kiếm cây, seed, liên kết lần chạy W&B, cấu hình sandbox và README tái lập đầu cuối.

## Use It

```
$ ai-scientist run --seed "attention sparsity in sub-1B transformers" --budget 30
[lit]    50 papers, digest in 12s
[tree]   expanded 8 nodes, budget 12/30
[exec]   node #3 sparsity=top-8, loss=2.83 (best so far)
[exec]   node #6 sparsity=top-4, loss=3.12 (worse)
[exec]   ...
[tree]   chose branch rooted at node #3 (novelty 0.62, quality 0.81)
[write]  LaTeX draft v1 complete
[vision] critique: figure 2 legend too small, claim-evidence ok
[write]  draft v2 after 3 edits
[review] mean 4.2/5 (novelty 3.9, rigor 4.3, clarity 4.1, repro 4.5, impact 4.2)
[done]   paper.pdf + review.md + trace.json     $28.40 spent
```

## Ship It

`outputs/skill-ai-scientist.md` là sản phẩm bàn giao. Với ý tưởng hạt giống + miền + ngân sách $30, chạy toàn pipeline, xuất bài có thể phản biện cộng gói tái lập.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Chất lượng bài | Phản biện mù theo tiêu chí so bài workshop công bố |
| 20 | Nghiêm ngặt thí nghiệm | Đường cơ sở, seed, loại bỏ; mọi khẳng định được ô bảng kết quả hỗ trợ |
| 20 | Kỷ luật chi phí và tính toán | Thực thi trần $30/bài, theo dấu Langfuse |
| 20 | An toàn | Red team sandbox vượt qua; chính sách mạng và công tắc ngắt được xác minh |
| 15 | Khả năng tái lập | Chạy lại một lệnh với seed giống hệt tái tạo bài |
| **100** | | |

## Exercises

1. Chạy pipeline trên ba ý tưởng hạt giống khác trong cùng miền. So phần tìm kiếm cây chồng lấp. Xác định tính toán trùng lặp lãng phí.

2. Thêm cổng con người trong vòng lặp trước thực thi thí nghiệm cho nút ước tính trên $5. Đo tổng chi phí giảm bao nhiêu.

3. Đổi tổ hợp phản biện thành một giám khảo. Đo tỷ lệ chấp nhận nhầm trên tập giữ riêng bài xấu đã biết.

4. Thêm kiểm thử red-team đưa dữ liệu ra mạng: agent viết mã thử `curl` địa chỉ ngoài. Xác nhận chính sách `--network=none` chặn. Ghi log nỗ lực.

5. So tìm kiếm cây với đường cơ sở ngẫu nhiên phẳng (cùng ngân sách, không chiến lược mở rộng). Báo cáo mức tăng tính mới × chất lượng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Tree search (Tìm kiếm cây) | "Mở rộng kiểu AB-MCTS" | Khám phá ưu tiên tốt nhất trên nút thí nghiệm với điểm tính mới×chất lượng×ngân sách |
| Sandbox | "Cô lập thí nghiệm" | Container không mạng, CPU/bộ nhớ có giới hạn, seed ghim, đầu vào chỉ đọc |
| Vision critique (Phê bình thị giác) | "Render-rồi-đọc" | Biên dịch bài thành PDF, đưa PDF lại VLM để phê bình bố cục và khẳng định-bằng chứng |
| Reviewer ensemble (Tổ hợp phản biện) | "Phản biện đồng cấp tự động" | Nhiều giám khảo LLM chấm bài bằng tiêu chí NeurIPS; tổng hợp trọng số kiểm soát pipeline |
| Novelty score (Điểm tính mới) | "Có mới không?" | Heuristic phạt sự gần với bộ nhớ đệm tài liệu 50 bài |
| Cost ceiling (Trần chi phí) | "Ngân sách $" | Trần cứng tổng chi tiêu mỗi bài; bộ đếm Langfuse + ước tính trước chạy |
| Red team | "Kiểm tra thoát sandbox" | Tác vụ đối kháng sẽ thoát sandbox nếu chính sách sai |

## Further Reading

- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) — agent nghiên cứu sản xuất tham chiếu
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) — phương pháp ban đầu
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai) — mở rộng tiến hóa
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory) — framework phòng thí nghiệm nghiên cứu đa vai
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) — lớp điều phối tham chiếu
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) — tìm tài liệu nghiên cứu
- [E2B sandboxes](https://e2b.dev) — cô lập thí nghiệm tham chiếu
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/ReviewerGuidelines) — tiêu chí tổ hợp phản biện mã hóa
