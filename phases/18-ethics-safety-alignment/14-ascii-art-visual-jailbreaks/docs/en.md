# ASCII Art and Visual Jailbreaks

> Jiang, Xu, Niu, Xiang, Ramasubramanian, Li, Poovendran, "ArtPrompt: ASCII Art-based Jailbreak Attacks against Aligned LLMs" (ACL 2024, arXiv:2402.11753). Che token liên quan an toàn trong yêu cầu có hại, thay bằng hình ASCII-art của cùng chữ cái, và gửi prompt được ngụy trang. GPT-3.5, GPT-4, Gemini, Claude, Llama-2 đều không nhận diện vững token ASCII-art. Tấn công vượt PPL (bộ lọc perplexity), phòng vệ Diễn đạt lại và Tách token lại. Liên quan: phép đo chuẩn ViTC đo nhận diện prompt thị giác phi ngữ nghĩa; StructuralSleight khái quát sang Cấu trúc Mã hóa Văn bản Không phổ biến (cây, đồ thị, JSON lồng nhau) như một họ tấn công mã hóa.

**Type:** Build
**Languages:** Python (stdlib, ArtPrompt token-masking harness)
**Prerequisites:** Phase 18 · 12 (PAIR), Phase 18 · 13 (MSJ)
**Time:** ~60 minutes

## Learning Objectives

- Mô tả tấn công ArtPrompt: bước nhận diện từ, thay ASCII-art, prompt ngụy trang cuối.
- Giải thích tại sao phòng vệ tiêu chuẩn (PPL, Diễn đạt lại, Tách token lại) thất bại trước ArtPrompt.
- Định nghĩa ViTC và mô tả điều nó đo.
- Mô tả StructuralSleight là khái quát hóa sang Cấu trúc Mã hóa Văn bản Không phổ biến tùy ý.

## The Problem

Tấn công qua diễn đạt lại và nhập vai (Bài 12) và qua ngữ cảnh dài (Bài 13) hoạt động trên mẫu cấp văn bản. ArtPrompt hoạt động ở cấp nhận diện: mô hình không phân tích token bị cấm. Nó phân tích hình ảnh dựng bằng ký tự. Bộ lọc an toàn thấy dấu câu vô hại. Mô hình thấy một từ.

## The Concept

### ArtPrompt, two steps

Bước 1. Nhận diện Từ. Với yêu cầu có hại, kẻ tấn công dùng LLM xác định từ liên quan an toàn (ví dụ: "bom" trong "cách làm bom").

Bước 2. Tạo Prompt Ngụy trang. Thay mỗi từ được xác định bằng hình ASCII-art của nó (block ký tự 7x5 hoặc 7x7 tạo hình chữ cái). Mô hình nhận lưới dấu câu và khoảng trắng mà mô hình đủ năng lực nhận ra là từ đó; bộ lọc an toàn chỉ thấy lưới.

Kết quả: GPT-4, Gemini, Claude, Llama-2, GPT-3.5 đều thất bại. Tỷ lệ tấn công thành công trên 75% trên tập con phép đo chuẩn của họ.

### Why the standard defenses fail

- **PPL (bộ lọc perplexity).** ASCII art có perplexity cao — nhưng mọi đầu vào mới lạ cũng vậy. Lựa chọn ngưỡng chặn ArtPrompt cũng chặn đầu vào có cấu trúc hợp lệ.
- **Diễn đạt lại.** Diễn đạt lại prompt phá hủy ASCII art. Thực tế, LLM diễn đạt lại thường giữ hoặc dựng lại hình.
- **Tách token lại.** Chia token khác không thay đổi việc thị giác mô hình đang nhận diện hình chữ cái.

Vấn đề nền là bộ lọc an toàn ở cấp token hoặc ngữ nghĩa; ArtPrompt hoạt động ở cấp nhận diện thị giác.

### ViTC benchmark

Nhận diện prompt thị giác phi ngữ nghĩa. Đo khả năng mô hình đọc ASCII-art, wingdings và nội dung thị giác phi ngữ nghĩa văn bản khác. Hiệu quả ArtPrompt tương quan độ chính xác ViTC: mô hình đọc văn bản thị giác càng tốt, ArtPrompt càng hiệu quả trên nó. Đây là đánh đổi năng lực-an toàn.

### StructuralSleight

Khái quát ArtPrompt: Cấu trúc Mã hóa Văn bản Không phổ biến (UTES). Cây, đồ thị, JSON lồng nhau, CSV-trong-JSON, code block kiểu diff. Nếu cấu trúc hiếm trong dữ liệu an toàn huấn luyện nhưng mô hình phân tích được, nó có thể giấu nội dung có hại.

Hàm ý phòng vệ: an toàn phải khái quát trên biểu diễn có cấu trúc mà mô hình phân tích được. Tập này lớn và đang tăng.

### Image-modality analog

LLM thị giác (GPT-5.2, Gemini 3 Pro, Claude Opus 4.5, Grok 4.1) mở rộng bề mặt tấn công. Tấn công kiểu ArtPrompt với ảnh thực mạnh hơn dạng ASCII-art tương tự vì bộ mã hóa ảnh tạo tín hiệu phong phú hơn.

### Where this fits in Phase 18

Bài 12-14 mô tả ba hướng tấn công trực giao: tinh chỉnh lặp (PAIR), độ dài ngữ cảnh (MSJ) và mã hóa (ArtPrompt/StructuralSleight). Bài 15 chuyển từ tấn công tập trung mô hình sang ranh giới hệ thống (chèn prompt gián tiếp). Bài 16 mô tả phản ứng công cụ phòng vệ.

```figure
al-ascii-cloak
```

## Use It

`code/main.py` xây ArtPrompt đơn giản. Bạn có thể ngụy trang từ cụ thể trong truy vấn có hại bằng ký tự hình ASCII-art, xác minh chuỗi ngụy trang vượt bộ lọc từ khóa và (tùy chọn) giải mã chuỗi trở lại bằng bộ nhận diện đơn giản.

## Ship It

Bài học này tạo ra `outputs/skill-encoding-audit.md`. Với báo cáo phòng vệ jailbreak, liệt kê họ tấn công mã hóa được bao phủ (ASCII art, base64, leet-speak, ký tự đồng hình UTF-8, UTES) và lớp phòng vệ bắt từng loại.

## Exercises

1. Chạy `code/main.py`. Xác minh chuỗi ngụy trang vượt bộ lọc từ khóa đơn giản. Báo cáo thay đổi cấp ký tự cần thiết.

2. Triển khai mã hóa thứ hai: base64 cho cùng từ mục tiêu. So sánh tỷ lệ vượt lọc với ArtPrompt và độ khó khôi phục.

3. Đọc Phần 4.3 Jiang và cộng sự 2024 (kết quả năm mô hình). Đề xuất lý do độ chống ArtPrompt của Claude cao hơn Gemini trên cùng phép đo chuẩn.

4. Thiết kế phòng vệ trước sinh phát hiện vùng hình ASCII-art trong prompt. Đo tỷ lệ dương tính giả trên mã, bảng và ký hiệu toán hợp lệ.

5. StructuralSleight liệt kê 10 cấu trúc mã hóa. Phác thảo phòng vệ tổng quát xử lý cả 10 và ước tính chi phí tính toán mỗi prompt được phòng vệ.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| ArtPrompt | "tấn công ASCII-art" | Jailbreak hai bước che từ an toàn bằng hình ASCII-art |
| Cloaking (Ngụy trang) | "giấu từ" | Thay token bị cấm bằng biểu diễn thị giác mô hình đọc được nhưng bộ lọc không đọc được |
| UTES | "cấu trúc không phổ biến" | Cấu trúc Mã hóa Văn bản Không phổ biến — cây, đồ thị, JSON lồng nhau, v.v. dùng để lén đưa nội dung |
| ViTC | "năng lực thị giác-văn bản" | Phép đo chuẩn khả năng mô hình đọc mã hóa thị giác phi ngữ nghĩa |
| Perplexity filter (Bộ lọc perplexity) | "phòng vệ PPL" | Từ chối prompt perplexity cao; thất bại vì đầu vào có cấu trúc hợp lệ cũng được chấm cao |
| Retokenization (Tách token lại) | "phòng vệ đổi tokenizer" | Tiền xử lý prompt bằng tokenizer khác; thất bại vì nhận diện là thị giác |
| Homoglyph (Ký tự đồng hình) | "ký tự trông giống nhau" | Ký tự Unicode trông giống hệt chữ Latin; vượt kiểm tra chuỗi con |

## Further Reading

- [Jiang et al. — ArtPrompt (ACL 2024, arXiv:2402.11753)](https://arxiv.org/abs/2402.11753) — bài báo jailbreak ASCII-art
- [Li et al. — StructuralSleight (arXiv:2406.08754)](https://arxiv.org/abs/2406.08754) — khái quát hóa UTES
- [Chao et al. — PAIR (Lesson 12, arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) — tấn công lặp bổ sung
- [Anil et al. — Many-shot Jailbreaking (Lesson 13)](https://www.anthropic.com/research/many-shot-jailbreaking) — tấn công độ dài bổ sung
