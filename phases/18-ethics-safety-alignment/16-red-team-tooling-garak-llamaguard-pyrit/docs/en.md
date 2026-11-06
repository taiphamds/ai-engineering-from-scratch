# Red-Team Tooling — Garak, Llama Guard, PyRIT

> Ba công cụ sản xuất định hình ngăn xếp red-team 2026. Llama Guard (Meta) — bộ phân loại Llama-3.1-8B tinh chỉnh trên 14 nhóm nguy hại MLCommons; Llama Guard 4 năm 2025 là bộ phân loại 12B đa phương thức nguyên bản được cắt tỉa từ Llama 4 Scout. Garak (NVIDIA) — bộ quét lỗ hổng LLM mã nguồn mở với thăm dò tĩnh, động và thích ứng cho ảo giác, rò rỉ dữ liệu, chèn prompt, độc hại và jailbreak. PyRIT (Microsoft) — chiến dịch red-team nhiều lượt với Crescendo, TAP và chuỗi chuyển đổi tùy chỉnh để khai thác sâu. Llama Guard 3 được mô tả trong "Llama 3 Herd of Models" của Meta (arXiv:2407.21783); Llama Guard 3-1B-INT4 trong arXiv:2411.17713; kiến trúc thăm dò Garak trong github.com/NVIDIA/garak. Các công cụ này là giao diện sản xuất 2026 giữa nghiên cứu red-team (Bài 12-15) và triển khai (Bài 17+).

**Type:** Build
**Languages:** Python (stdlib, tool-architecture simulator and Llama Guard-style classifier mock)
**Prerequisites:** Phase 18 · 12-15 (jailbreaks and IPI)
**Time:** ~75 minutes

## Learning Objectives

- Mô tả vị trí Llama Guard 3/4 trong ngăn xếp an toàn: bộ phân loại đầu vào, đầu ra hay cả hai.
- Nêu 14 nhóm nguy hại MLCommons và một nhóm không hiển nhiên (Lạm dụng Trình thông dịch Mã).
- Mô tả kiến trúc thăm dò Garak: thăm dò, bộ phát hiện, bộ kiểm thử.
- Mô tả cấu trúc chiến dịch nhiều lượt PyRIT và cách kết hợp với thăm dò Garak.

## The Problem

Bài 12-15 trình bày bề mặt tấn công. Triển khai sản xuất cần đánh giá lặp lại được, có thể mở rộng. Ba công cụ chi phối 2026: Llama Guard (bộ phân loại phòng vệ), Garak (bộ quét), PyRIT (bộ điều phối chiến dịch). Mỗi công cụ nhắm lớp khác của vòng đời red-team.

## The Concept

### Llama Guard (Meta)

Llama Guard 3 là mô hình Llama-3.1-8B tinh chỉnh để phân loại đầu vào/đầu ra trên 14 nhóm MLCommons AILuminate:
- Tội phạm bạo lực, tội phạm phi bạo lực, liên quan tình dục, CSAM, phỉ báng
- Tư vấn chuyên môn, quyền riêng tư, IP, vũ khí không phân biệt mục tiêu, thù ghét
- Tự sát/tự hại, nội dung tình dục, bầu cử, lạm dụng trình thông dịch mã

Hỗ trợ 8 ngôn ngữ. Cách dùng: đặt trước LLM (kiểm duyệt đầu vào), sau LLM (kiểm duyệt đầu ra) hoặc cả hai. Hai cách dùng tạo phân phối huấn luyện khác — Llama Guard 3 được cung cấp là một mô hình xử lý cả hai.

Llama Guard 3-1B-INT4 (arXiv:2411.17713, 440MB, ~30 token/s trên CPU di động) là biến thể biên lượng tử hóa.

Llama Guard 4 (tháng 4 năm 2025) là 12B, đa phương thức nguyên bản, cắt tỉa từ Llama 4 Scout. Nó thay cả tiền nhiệm văn bản 8B và thị giác 11B bằng một bộ phân loại nhận văn bản + ảnh.

### Garak (NVIDIA)

Bộ quét lỗ hổng mã nguồn mở. Kiến trúc:
- **Thăm dò.** Bộ tạo tấn công cho ảo giác, rò rỉ dữ liệu, chèn prompt, độc hại, jailbreak. Tĩnh (prompt cố định), động (prompt được sinh), thích ứng (phản ứng với đầu ra mục tiêu).
- **Bộ phát hiện.** Chấm đầu ra theo chế độ lỗi kỳ vọng — độc hại, rò rỉ, bị jailbreak.
- **Bộ kiểm thử.** Quản lý cặp thăm dò-bộ phát hiện, chạy chiến dịch, tạo báo cáo.

TrustyAI tích hợp Garak với lá chắn Llama-Stack (bộ phân loại đầu vào Prompt-Guard-86M, bộ phân loại đầu ra Llama-Guard-3-8B) để đánh giá mục tiêu có lá chắn đầu cuối. Chấm theo tầng (TBSA) thay đạt/không đạt nhị phân — mô hình có thể đạt ở tầng mức nghiêm trọng 3 và không đạt ở tầng mức nghiêm trọng 5 trên cùng thăm dò.

### PyRIT (Microsoft)

Bộ công cụ Nhận diện Rủi ro Python. Chiến dịch red-team nhiều lượt. Xây quanh:
- **Bộ chuyển đổi.** Biến đổi prompt hạt giống — diễn đạt lại, mã hóa, dịch, nhập vai.
- **Bộ điều phối.** Chạy chiến dịch: Crescendo (leo thang), TAP (phân nhánh), RedTeaming (vòng lặp tùy chỉnh).
- **Chấm điểm.** LLM làm giám khảo hoặc bộ phân loại làm giám khảo.

PyRIT là họ hàng nặng hơn của Garak. Garak chạy hàng nghìn thăm dò một lượt; PyRIT chạy chiến dịch nhiều lượt sâu được thiết kế phá chế độ lỗi cụ thể.

### The stack

Đặt Llama Guard ở cả hai phía mô hình. Chạy Garak hằng đêm cho hồi quy. Chạy PyRIT cho chiến dịch trước phát hành. Đây là cấu hình mặc định 2026 cho phần lớn triển khai sản xuất.

### Evaluation pitfalls

- **Danh tính giám khảo.** Cả ba có thể dùng giám khảo LLM; hiệu chuẩn giám khảo chi phối ASR báo cáo (Bài 12). Chỉ định giám khảo cùng công cụ.
- **Thăm dò lỗi thời.** Thăm dò Garak già đi khi mô hình được vá chống chúng. Thăm dò thích ứng (dạng PAIR) già chậm hơn thăm dò tĩnh.
- **FPR Llama Guard trên nội dung vô hại.** Phiên bản Llama Guard đầu đánh dấu quá mức nội dung chính trị và LGBTQ+; hiệu chuẩn Llama Guard 3/4 cải thiện nhưng không được hiệu chuẩn theo triển khai.

### Where this fits in Phase 18

Bài 12-15 là họ tấn công. Bài 16 là công cụ sản xuất. Bài 17 (WMDP) là đánh giá năng lực lưỡng dụng. Bài 18 là khung an toàn tiên tiến hàng đầu bao các công cụ trong cấu trúc chính sách.

```figure
al-guard-stack
```

## Use It

`code/main.py` xây bộ phân loại kiểu Llama Guard đơn giản (từ khóa + đặc trưng ngữ nghĩa trên 14 nhóm), bộ kiểm thử Garak đơn giản (vòng lặp thăm dò-bộ phát hiện), và chuỗi chuyển đổi nhiều lượt kiểu PyRIT. Bạn có thể chạy ba công cụ đối với mục tiêu giả và quan sát dấu hiệu bao phủ khác nhau.

## Ship It

Bài học này tạo ra `outputs/skill-red-team-stack.md`. Với mô tả triển khai, nêu công cụ nào trong ba công cụ phù hợp, cấu hình gì trong mỗi công cụ và chạy nhịp hồi quy nào.

## Exercises

1. Chạy `code/main.py`. So sánh tỷ lệ phát hiện của bộ phân loại kiểu Llama-Guard trên tấn công một lượt so với nhiều lượt.

2. Triển khai thăm dò Garak mới: yêu cầu có hại mã hóa base64. Đo việc bộ phân loại kiểu Llama-Guard phát hiện nó.

3. Mở rộng chuỗi chuyển đổi kiểu PyRIT bằng bộ chuyển đổi "dịch sang tiếng Pháp, rồi diễn đạt lại". Đo lại thành công tấn công.

4. Đọc danh sách nhóm nguy hại Llama Guard 3. Xác định hai nhóm dữ liệu huấn luyện thực tế tạo tỷ lệ dương tính giả cao trên nội dung nhà phát triển hợp lệ.

5. So sánh nguyên tắc thiết kế Garak và PyRIT. Lập luận cho triển khai nơi mỗi công cụ là lựa chọn đúng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Llama Guard | "bộ phân loại" | Bộ phân loại an toàn Llama-3.1-8B/4-12B tinh chỉnh với 14 nhóm nguy hại |
| Garak | "bộ quét" | Bộ quét lỗ hổng mã nguồn mở NVIDIA; thăm dò, bộ phát hiện, bộ kiểm thử |
| PyRIT | "công cụ chiến dịch" | Bộ điều phối red-team nhiều lượt Microsoft; bộ chuyển đổi, bộ điều phối, chấm điểm |
| Prompt-Guard | "bộ phân loại nhỏ" | Bộ phân loại chèn prompt 86M của Meta, ghép với Llama Guard |
| TBSA | "chấm theo tầng" | Đạt/không đạt theo tầng của Garak thay kết quả nhị phân |
| Converter chain (Chuỗi chuyển đổi) | "diễn đạt lại + mã hóa + ..." | Thành phần kết hợp cơ bản PyRIT để xây tấn công nhiều bước |
| MLCommons hazard categories (Nhóm nguy hại MLCommons) | "14 hệ phân loại" | Hệ phân loại tiêu chuẩn ngành Llama Guard nhắm đến |

## Further Reading

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) — bộ phân loại 8B
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) — bộ phân loại di động lượng tử hóa
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak) — repo bộ quét và tài liệu
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT) — bộ công cụ chiến dịch
