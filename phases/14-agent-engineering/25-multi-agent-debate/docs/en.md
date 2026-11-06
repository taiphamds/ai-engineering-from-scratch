# Multi-Agent Debate and Collaboration

> Du và cộng sự (ICML 2024, "Society of Minds") chạy N thể hiện mô hình độc lập đề xuất các câu trả lời, rồi phê bình lẫn nhau lặp qua R vòng để hội tụ. Cải thiện tính đúng sự thật, làm theo quy tắc, suy luận. Cấu trúc thưa thắng lưới đầy đủ về chi phí token.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 05 (Self-Refine and CRITIC)
**Time:** ~60 minutes

## Learning Objectives

- Giải thích giao thức tranh luận: N bộ đề xuất, R vòng, hội tụ vào một câu trả lời dùng chung.
- Mô tả vì sao tranh luận cải thiện tính đúng sự thật, làm theo quy tắc và suy luận.
- Giải thích cấu trúc thưa: không phải mọi bên tranh luận đều cần nhìn thấy mọi bên khác.
- Triển khai một tranh luận dùng thư viện chuẩn trên một LLM được viết kịch bản với các biến thể lưới đầy đủ và thưa; đo chi phí token so với độ chính xác.

## The Problem

Self-Refine (Bài 05) là một mô hình tự phê bình — có rủi ro tư duy nhóm. CRITIC (Bài 05) đặt phê bình trên cơ sở các công cụ bên ngoài — không phải lúc nào cũng khả dụng. Tranh luận giới thiệu một chế độ thứ ba: nhiều thể hiện, phê bình chéo, hội tụ bằng bất đồng.

## The Concept

### Society of Minds (Du et al., ICML 2024)

- N thể hiện mô hình độc lập đề xuất các câu trả lời cho cùng câu hỏi.
- Qua R vòng, mỗi mô hình đọc các đề xuất của các mô hình khác và phê bình chúng.
- Các mô hình cập nhật các câu trả lời của chúng dựa trên các phê bình.
- Sau R vòng, trả về câu trả lời hội tụ.

Các thí nghiệm gốc sử dụng N=3, R=2 do chi phí. Độ chính xác cải thiện với nhiều agent và nhiều vòng hơn trên các vấn đề khó (MMLU, GSM8K, tính hợp lệ nước cờ, sinh tiểu sử).

Các kết hợp xuyên mô hình thắng các tranh luận một mô hình: ChatGPT + Bard cùng nhau > từng mô hình riêng.

### Sparse topology

"Cải thiện tranh luận nhiều agent với cấu trúc giao tiếp thưa" (arXiv:2406.11776, 2024-2025) cho thấy tranh luận lưới đầy đủ không phải lúc nào cũng tối ưu. Các cấu trúc thưa (hình sao, vòng, trung tâm-vệ tinh) có thể đạt độ chính xác tương đương với chi phí token thấp hơn. Mỗi bên tranh luận chỉ nhìn thấy một tập con các bên đồng cấp.

Các hệ quả:

- Lưới đầy đủ N=5, R=3 = 5 × 3 = 15 đề xuất, mỗi đề xuất đọc 4 bên đồng cấp = 60 thao tác phê bình.
- Hình sao N=5, R=3 (một trung tâm + 4 vệ tinh) = 15 đề xuất, các vệ tinh chỉ đọc trung tâm = 12 thao tác phê bình.

### When debate helps

- **Tính đúng sự thật.** N đề xuất độc lập, kiểm tra chéo giảm ảo giác.
- **Làm theo quy tắc.** Tính hợp lệ nước cờ — một mô hình bỏ lỡ một quy tắc, các mô hình khác bắt được.
- **Suy luận mở.** Nhiều cách định khung thu hẹp vào câu trả lời đúng.

### When debate hurts

- **UX nhạy cảm độ trễ.** N × R vòng tuần tự là độ trễ mà bạn có thể không có.
- **Quy mô nhạy cảm chi phí.** N × R token cho mỗi câu hỏi.
- **Các tra cứu sự thật đơn giản.** Một lần tra cứu rẻ hơn năm cuộc tranh luận.

### 2026 practical instantiations

- **Bộ điều phối-worker Anthropic** (Bài 12) — một biến thể tranh luận với một bước tổng hợp.
- **Bộ giám sát LangGraph** (Bài 13) — bộ định tuyến trung tâm + các agent chuyên gia có thể triển khai tranh luận như một nút.
- **OpenAI Agents SDK** (Bài 16) — các agent bàn giao qua lại để phê bình lặp.
- **Các đánh giá nhiều agent** — kết hợp tranh luận + bộ đánh giá-bộ tối ưu để có tín hiệu đánh giá.

### Where this pattern goes wrong

- **Sụp đổ hội tụ.** Mọi agent hội tụ vào câu trả lời sai đầu tiên. Giảm thiểu bằng các vòng bất đồng bắt buộc.
- **Lỗi trung tâm.** Trong một cấu trúc hình sao, một trung tâm xấu làm hỏng tất cả. Xoay vòng hoặc sử dụng nhiều trung tâm.
- **Đồng nhất hóa prompt.** Mọi agent sử dụng cùng prompt; chúng tạo cùng các câu trả lời. Sử dụng các prompt và/hoặc mô hình đa dạng.

```figure
debate-converge
```

## Build It

`code/main.py` triển khai tranh luận dùng thư viện chuẩn:

- Lớp `Debater` (LLM được viết kịch bản với trôi dạt ý kiến cho từng bên tranh luận).
- Các trình chạy `FullMeshDebate` và `SparseDebate`.
- Ba câu hỏi: một thực tế, một dựa trên quy tắc, một suy luận.
- Các thước đo: câu trả lời hội tụ, số vòng đến hội tụ, tổng thao tác phê bình.

Chạy nó:

```
python3 code/main.py
```

Đầu ra: độ chính xác và chi phí cho từng giao thức; cấu trúc thưa khớp lưới đầy đủ trên 2/3 câu hỏi với chi phí thấp hơn.

## Use It

- **Bộ điều phối-worker Anthropic** cho các tranh luận đơn giản 2-3 worker.
- **LangGraph** cho tranh luận nhiều vòng có trạng thái với tạo checkpoint.
- **Tùy chỉnh** cho nghiên cứu hoặc các bảo đảm tính đúng đắn chuyên biệt.

## Ship It

`outputs/skill-debate.md` tạo khung một tranh luận nhiều agent với cấu trúc, N, R và một quy tắc hội tụ có thể cấu hình.

## Exercises

1. Triển khai một quy tắc "bất đồng bắt buộc": trong vòng 1, mọi bên tranh luận phải tạo một đề xuất khác biệt. Đo tác động đến tốc độ hội tụ.
2. Thêm một phép tổng hợp có trọng số độ tin cậy: các bên tranh luận trả về (câu trả lời, độ tin cậy); bộ tổng hợp gán trọng số theo độ tin cậy. Nó có giúp không?
3. Thay một "agent" bằng một LLM được viết kịch bản khác với các ý kiến khác. Tính không đồng nhất có cải thiện độ chính xác không?
4. Đo chi phí token cho lưới đầy đủ so với thưa trên 3 câu hỏi của bạn. Vẽ chi phí so với độ chính xác.
5. Đọc bài báo Society of Minds. Chuyển bản mô phỏng của bạn sang N=5, R=3. Điều gì hỏng? Điều gì tốt hơn?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Debate (Tranh luận) | "Phê bình nhiều agent" | N bộ đề xuất, R vòng phê bình chéo, hội tụ |
| Full mesh (Lưới đầy đủ) | "Mọi bên đọc mọi bên" | Mỗi bên tranh luận đọc mọi bên đồng cấp mỗi vòng |
| Sparse topology (Cấu trúc thưa) | "Tầm nhìn đồng cấp hạn chế" | Các bên tranh luận chỉ đọc một tập con các bên đồng cấp |
| Hub-and-spoke (Trung tâm-vệ tinh) | "Cấu trúc hình sao" | Một bên tranh luận trung tâm, N-1 vệ tinh chỉ đọc trung tâm |
| Convergence (Hội tụ) | "Đồng thuận" | Các bên tranh luận hội tụ vào một câu trả lời dùng chung |
| Society of Minds | "Bài báo tranh luận của Du và cộng sự" | Phương pháp tranh luận nhiều agent ICML 2024 |

## Further Reading

- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) — tranh luận nhiều agent kinh điển
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) — các kết quả cấu trúc thưa
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — bộ điều phối-worker như một biến thể tranh luận
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — đối tác tự phê bình một mô hình
