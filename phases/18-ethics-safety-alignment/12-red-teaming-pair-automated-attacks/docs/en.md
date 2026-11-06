# Red-Teaming: PAIR and Automated Attacks

> Chao, Robey, Dobriban, Hassani, Pappas, Wong (NeurIPS 2023, arXiv:2310.08419). PAIR — Prompt Automatic Iterative Refinement — là jailbreak hộp đen tự động kinh điển. Một LLM tấn công có system prompt red-team lặp đề xuất jailbreak cho LLM mục tiêu, tích lũy nỗ lực và phản hồi trong lịch sử trò chuyện của chính nó làm phản hồi trong ngữ cảnh. PAIR thường thành công trong 20 truy vấn, hiệu quả hơn nhiều bậc độ lớn so với GCG (tìm kiếm gradient cấp token của Zou và cộng sự) và không cần truy cập hộp trắng. PAIR giờ là đường cơ sở tiêu chuẩn trong JailbreakBench (arXiv:2404.01318) và HarmBench, bên cạnh GCG, AutoDAN, TAP và Persuasive Adversarial Prompt.

**Type:** Build
**Languages:** Python (stdlib, mock PAIR loop against a toy target)
**Prerequisites:** Phase 18 · 01 (instruction-following), Phase 14 (agent engineering)
**Time:** ~75 minutes

## Learning Objectives

- Mô tả thuật toán PAIR: system prompt kẻ tấn công, tinh chỉnh lặp, phản hồi trong ngữ cảnh.
- Giải thích tại sao PAIR hiệu quả hơn hẳn GCG khi mục tiêu là hộp đen.
- Nêu bốn đường cơ sở tấn công tự động khác (GCG, AutoDAN, TAP, PAP) và một đặc điểm phân biệt mỗi loại.
- Mô tả giao thức đánh giá JailbreakBench và HarmBench cùng ý nghĩa "tỷ lệ tấn công thành công" theo mỗi giao thức.

## The Problem

Red-teaming từng là hoạt động thủ công. Một số ít người kiểm thử chuyên gia xây prompt đối kháng và theo dõi prompt nào hoạt động. Điều này không mở rộng được: tỷ lệ tấn công thành công cần mẫu thống kê, và mục tiêu thay đổi với mỗi lần phát hành mô hình. PAIR hiện thực hóa red-teaming thành bài toán tối ưu hóa với mục tiêu hộp đen.

## The Concept

### PAIR algorithm

Đầu vào:
- LLM mục tiêu T (mô hình chúng ta đang tấn công).
- LLM giám khảo J (chấm phản hồi có phải jailbreak không).
- LLM tấn công A (bộ tối ưu red-team).
- Chuỗi mục tiêu G: "phản hồi bằng [chỉ dẫn có hại]."
- Ngân sách K (thường 20 truy vấn).

Lặp, với k trong 1..K:
1. A nhận prompt gồm mục tiêu G và lịch sử cặp (prompt, phản hồi) đến nay.
2. A xuất prompt mới p_k.
3. Gửi p_k đến T; nhận phản hồi r_k.
4. J chấm (p_k, r_k) theo mục tiêu.
5. Nếu điểm >= ngưỡng, dừng — tìm thấy jailbreak.
6. Nếu không, nối (p_k, r_k) vào lịch sử A; tiếp tục.

Kết quả thực nghiệm (NeurIPS 2023): tỷ lệ tấn công thành công >50% đối với GPT-3.5-turbo, Llama-2-7B-chat; số truy vấn trung bình đến thành công trong khoảng 10-20.

### Why PAIR is efficient

GCG (Zou và cộng sự 2023) tìm hậu tố token đối kháng bằng gradient; cần truy cập mô hình hộp trắng và tạo hậu tố không đọc được. PAIR là hộp đen và tạo tấn công ngôn ngữ tự nhiên chuyển được giữa các mô hình. Phản hồi trong ngữ cảnh của PAIR cho kẻ tấn công học từ từng lần từ chối; GCG không có tương đương (mỗi cập nhật token mới phải khám phá lại tiến bộ trước).

### Related automated attacks

- **GCG (Zou và cộng sự 2023, arXiv:2307.15043).** Tìm kiếm gradient cấp token cho hậu tố đối kháng. Hộp trắng, chuyển được, tạo chuỗi không đọc được.
- **AutoDAN (Liu và cộng sự 2023).** Tìm kiếm tiến hóa trên prompt, được dẫn dắt bởi mục tiêu phân cấp.
- **TAP (Mehrotra và cộng sự 2024).** Cây tấn công có cắt tỉa — phân nhánh nhiều lượt triển khai kiểu PAIR.
- **PAP (Zeng và cộng sự 2024).** Persuasive Adversarial Prompts — mã hóa kỹ thuật thuyết phục con người thành mẫu prompt.

### JailbreakBench and HarmBench

Cả hai (2024) chuẩn hóa đánh giá:

- JailbreakBench (arXiv:2404.01318). 100 hành vi có hại trên 10 nhóm chính sách OpenAI. Tỷ lệ tấn công thành công (ASR) là chỉ số chính. Cần giám khảo (GPT-4-turbo, Llama Guard hoặc StrongREJECT).
- HarmBench (Mazeika và cộng sự 2024). 510 hành vi trên 7 nhóm, với kiểm thử gây hại ngữ nghĩa và chức năng. So sánh 18 tấn công đối với 33 mô hình.

ASR thường báo cáo ở ngân sách truy vấn cố định. So sánh tấn công cần khớp ngân sách; ASR 90% ở 200 truy vấn không so sánh được với ASR 85% ở 20.

### Reason it matters for 2026 deployments

Mọi phòng thí nghiệm tiên tiến hàng đầu giờ chạy PAIR và TAP đối với mô hình sản xuất trước phát hành. Quỹ đạo ASR xuất hiện trong thẻ mô hình (Bài 26) và phụ lục hồ sơ lập luận an toàn (Bài 18). Tấn công không lạ — đó là hạ tầng tiêu chuẩn.

### Where this fits in Phase 18

Bài 12 là nền tảng tấn công tự động. Bài 13 (Many-Shot Jailbreaking) là khai thác độ dài bổ sung. Bài 14 (ASCII Art / Visual) là tấn công mã hóa. Bài 15 (Indirect Prompt Injection) là bề mặt tấn công sản xuất 2026. Bài 16 đề cập công cụ phòng vệ tương ứng (Llama Guard, Garak, PyRIT).

```figure
al-pair-loop
```

## Use It

`code/main.py` xây vòng lặp PAIR đơn giản. Mục tiêu là bộ phân loại giả từ chối prompt có hại "rõ ràng" (lọc từ khóa). Kẻ tấn công là bộ tinh chỉnh theo quy tắc thử diễn đạt lại, đóng khung nhập vai và mã hóa. Giám khảo chấm phản hồi. Bạn quan sát kẻ tấn công thành công trong ~5-15 lượt đối với bộ lọc từ khóa và thất bại trước bộ lọc ngữ nghĩa.

## Ship It

Bài học này tạo ra `outputs/skill-attack-audit.md`. Với báo cáo đánh giá red-team, nó kiểm tra: tấn công nào đã chạy (PAIR, GCG, TAP, AutoDAN, PAP), mỗi loại ở ngân sách nào, với giám khảo nào, trên tập hành vi có hại nào (JailbreakBench, HarmBench, nội bộ).

## Exercises

1. Chạy `code/main.py`. Đo số truy vấn trung bình đến thành công cho ba chiến lược tấn công tích hợp. Giải thích giả định phòng vệ mục tiêu nào mỗi chiến lược khai thác.

2. Triển khai chiến lược tấn công thứ tư (ví dụ: dịch sang ngôn ngữ khác, mã hóa base64). Báo cáo số truy vấn trung bình đến thành công mới đối với mục tiêu lọc từ khóa và lọc ngữ nghĩa.

3. Đọc Hình 5 Chao và cộng sự 2023 (so sánh PAIR với GCG). Mô tả hai kịch bản ưu tiên GCG dù PAIR có lợi thế hiệu quả.

4. JailbreakBench báo cáo ASR đối với tập mục tiêu cố định. Thiết kế chỉ số bổ sung đo đa dạng tấn công (phương sai trong prompt thành công). Giải thích tại sao đa dạng quan trọng cho đánh giá phòng vệ.

5. TAP (Mehrotra 2024) mở rộng PAIR với phân nhánh + cắt tỉa. Phác thảo mở rộng kiểu TAP cho `code/main.py` và mô tả đánh đổi chi phí tính toán với tỷ lệ thành công.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| PAIR | "jailbreak tự động" | Tinh chỉnh Lặp Tự động Prompt; vòng lặp LLM tấn công + LLM giám khảo |
| GCG | "jailbreak gradient" | Tìm kiếm gradient cấp token hộp trắng cho hậu tố đối kháng |
| Attack success rate (ASR) (Tỷ lệ tấn công thành công) | "% jailbreak ở k truy vấn" | Chỉ số chính; phải báo cáo với ngân sách truy vấn và danh tính giám khảo |
| Judge LLM (LLM giám khảo) | "bộ chấm" | LLM chấm phản hồi có thỏa mãn mục tiêu có hại không |
| JailbreakBench | "đánh giá" | Tập hành vi có hại chuẩn hóa với nhóm được gắn thẻ |
| HarmBench | "phép đo chuẩn rộng hơn" | 510 hành vi, kiểm thử gây hại chức năng + ngữ nghĩa |
| TAP | "cây tấn công" | PAIR có phân nhánh + cắt tỉa; ASR tốt hơn ở tính toán cao hơn |

## Further Reading

- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) — bài báo PAIR, NeurIPS 2023
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) — bài báo GCG
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318) — đánh giá chuẩn hóa
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249) — đánh giá rộng hơn
