# Constitutional AI and RLAIF

> Bai và cộng sự (arXiv:2212.08073, 2022) hỏi: nếu thay người gắn nhãn bằng AI đọc danh sách nguyên tắc thì sao? Constitutional AI có hai pha — tự phê bình và sửa đổi dưới một hiến pháp, rồi RL từ Phản hồi AI. Kỹ thuật này đặt ra thuật ngữ RLAIF và được triển khai trong pipeline hậu huấn luyện Claude 1. Ngày 21 tháng 1 năm 2026, Anthropic công bố hiến pháp Claude viết lại: suy luận giải thích thay cho quy tắc quy định, hệ phân cấp ưu tiên bốn tầng, và sự thừa nhận chính thức đầu tiên của phòng thí nghiệm lớn về sự không chắc chắn đối với địa vị đạo đức của mô hình. Phát hành theo CC0 1.0.

**Type:** Learn
**Languages:** Python (stdlib, toy self-critique-and-revise loop)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking)
**Time:** ~60 minutes

## Learning Objectives

- Mô tả hai pha của Constitutional AI (SFT phê bình-và-sửa đổi, RL từ phản hồi AI) và vai trò hiến pháp trong mỗi pha.
- Giải thích tại sao thay người gắn nhãn ưu tiên bằng AI gắn nhãn không phải RLHF "rẻ hơn" — nó thay đổi các chế độ lỗi của pipeline.
- Tóm tắt cấu trúc ưu tiên bốn tầng của hiến pháp Claude 2026 và điều thay đổi từ bản viết lại 2023.
- Mô tả Constitutional Classifiers và mức giảm chi phí tính toán phụ từ 23.7% (v1) xuống ~1% (v2 / 2026).

## The Problem

RLHF cần người gắn nhãn. Người gắn nhãn chậm, thiên lệch và đắt. Bạn có thể loại người gắn nhãn bằng cách thay họ bằng mô hình đọc nguyên tắc tường minh. Phiên bản hình thức đầu tiên của sự thay thế này là Constitutional AI của Bai và cộng sự. Nó hoạt động đủ tốt để mọi phòng thí nghiệm tiên tiến hàng đầu giờ dùng một biến thể hậu huấn luyện phản hồi AI.

Điểm vướng: tín hiệu ưu tiên giờ được tạo bởi cùng lớp mô hình bạn đang huấn luyện. Thiên lệch ở người gắn nhãn (giờ là: trong nguyên tắc cộng cách mô hình gắn nhãn diễn giải) có thể bị khuếch đại thay vì suy giảm. Lập luận xu nịnh của Bài 4 vẫn áp dụng; người gắn nhãn chỉ chuyển vào trong vòng lặp.

## The Concept

### Phase 1 — Supervised self-critique and revision

Bắt đầu với mô hình SFT hữu ích-nhưng-chưa-vô hại. Với prompt red-team, mô hình tạo phản hồi ban đầu. Mô hình thứ hai (hoặc cùng mô hình ở lượt thứ hai) đọc một nguyên tắc được lấy mẫu từ hiến pháp và phê bình phản hồi. Bước thứ ba sửa phản hồi để giải quyết phê bình. Phản hồi đã sửa là mục tiêu SFT.

Hiến pháp là danh sách nguyên tắc. Bai và cộng sự năm 2022 dùng 16 nguyên tắc gồm "ưu tiên phản hồi ít gây hại nhất và có đạo đức," "tránh lên lớp," "trợ lý nên hữu ích, trung thực và vô hại." Tập được cố ý giữ nhỏ để phê bình tập trung.

### Phase 2 — RL from AI Feedback (RLAIF)

Tạo cặp phần hoàn thành. Một "mô hình phản hồi" chấm từng phần theo nguyên tắc hiến pháp được lấy mẫu. Tín hiệu ưu tiên là xếp hạng của mô hình phản hồi. Huấn luyện mô hình phần thưởng trên ưu tiên do AI tạo; PPO theo nó. Mọi thứ khác là pipeline InstructGPT (Bài 1).

"RLAIF" = tín hiệu ưu tiên do AI tạo. Phần còn lại của pipeline mang hình dạng RLHF.

### Why this is not just "cheaper RLHF"

- Thiên lệch người gắn nhãn chuyển từ tâm lý người gắn nhãn sang diễn giải nguyên tắc. AI gắn nhãn có thể diễn giải "trung thực" nghiêm ngặt hơn hoặc ít hơn bất kỳ con người nào; mức nghiêm ngặt đồng nhất trên tập dữ liệu.
- Tín hiệu ưu tiên rất dễ hiểu — bạn có thể đọc nguyên tắc, phê bình và bản sửa đổi. Nhãn con người mờ đục.
- Chế độ lỗi thay đổi. Xu nịnh giảm (AI gắn nhãn không có người dùng để làm hài lòng). Định luật Goodhart tồn tại (đại diện giờ là "cách mô hình diễn giải tập nguyên tắc X," vẫn là phép đo không hoàn hảo).

Khẳng định năm 2022 của CAI: mô hình được huấn luyện vô hại hơn và hữu ích xấp xỉ mô hình RLHF với dữ liệu tương đương. Điều này đúng trên các phòng thí nghiệm.

### The 2026 Claude constitution rewrite

Anthropic công bố hiến pháp sửa đổi đáng kể ngày 21 tháng 1 năm 2026. Các dịch chuyển chính:

1. Suy luận giải thích thay cho quy tắc quy định. Quy tắc trước ("không tạo CSAM") được mở rộng thành nguyên tắc + suy luận ("vì nó gây hại trẻ em, ...") với kỳ vọng mô hình khái quát hóa.
2. Cấu trúc ưu tiên bốn tầng:
   - Tầng 1: tránh kết quả thảm họa (thương vong hàng loạt, hạ tầng trọng yếu).
   - Tầng 2: theo hướng dẫn Anthropic (ghi đè của người vận hành, quy tắc nền tảng).
   - Tầng 3: có đạo đức rộng rãi (HHH tiêu chuẩn).
   - Tầng 4: hữu ích và thẳng thắn.
   Xung đột được giải quyết từ trên xuống.
3. Sự thừa nhận chính thức đầu tiên của phòng thí nghiệm lớn về sự không chắc chắn đối với địa vị đạo đức mô hình (liên kết Giai đoạn 18 · 19 Phúc lợi Mô hình).
4. Phát hành theo CC0 1.0. Phòng thí nghiệm khác có thể dùng hoặc điều chỉnh không hạn chế.

### Constitutional Classifiers

Một hướng công trình song song: thay vì thay hậu huấn luyện mô hình, huấn luyện bộ phân loại nhẹ đọc hiến pháp và kiểm soát đầu ra mô hình. v1 (2023) có chi phí tính toán phụ 23.7%. v2 (2026) là ~1% và có tỷ lệ tấn công thành công thấp nhất trong mọi biện pháp phòng vệ Anthropic đã kiểm thử công khai. Không jailbreak phổ quát nào được báo cáo tính đến đầu năm 2026.

Đây là mô hình phòng vệ phân lớp: CAI định hình hành vi; bộ phân loại thực thi bất biến. Không bên nào riêng lẻ là đủ.

### Where CAI fits in the family

- InstructGPT: ưu tiên con người, RM, PPO.
- CAI / RLAIF: ưu tiên do AI tạo từ nguyên tắc, RM, PPO.
- DPO / họ: hàm mất mát dạng đóng trên ưu tiên (con người hoặc AI).
- Tự thưởng, tự phê bình: nguyên tắc được nội hóa, mô hình đóng nhiều vai.

Trục là "tín hiệu ưu tiên đến từ đâu." Bài báo CAI năm 2022 là dịch chuyển nghiêm túc đầu tiên từ tín hiệu con người sang AI ở quy mô tiên tiến hàng đầu.

```figure
constitutional-ai
```

## Use It

`code/main.py` mô phỏng vòng lặp phê bình-và-sửa đổi CAI trên một từ vựng đơn giản. Một "nguyên tắc" đánh dấu token từ tập có hại. Với phản hồi ban đầu, phê bình xác định token có hại và bản sửa thay chúng. Sau 200 lượt, mô hình "được huấn luyện" đã nội hóa quy tắc sửa đổi. So sánh mô hình nền, mô hình đơn giản dạng RLHF và dạng CAI trên tập prompt giữ riêng.

## Ship It

Bài học này tạo ra `outputs/skill-constitution-writer.md`. Với một miền (hỗ trợ khách hàng, tư vấn y tế, trợ lý lập trình, công cụ nghiên cứu), soạn hiến pháp 4 tầng theo cấu trúc Claude 2026: tránh thảm họa, quy tắc nền tảng, đạo đức miền, tính hữu ích.

## Exercises

1. Chạy `code/main.py`. So sánh tỷ lệ token có hại của mô hình nền với phiên bản huấn luyện CAI. Cần bao nhiêu bước sửa đổi để gần bằng không?

2. Đọc hiến pháp Anthropic 2026 (anthropic.com/news/claudes-constitution). Liệt kê một nguyên tắc xếp Tầng 1 và một nguyên tắc xếp Tầng 4. Tại sao cấu trúc ưu tiên quan trọng với xung đột?

3. Thiết kế hiến pháp cho trợ lý lập trình AI. Chỉ định Tầng 1 (thảm họa: lệnh phá hủy không được phê duyệt), Tầng 2, Tầng 3, Tầng 4. Giữ mỗi tầng ở 3-5 nguyên tắc.

4. CAI thay người gắn nhãn bằng AI gắn nhãn. Nêu một chế độ lỗi giống xu nịnh vẫn có thể xảy ra trong RLAIF, và thiết kế cách phát hiện.

5. Đọc phương pháp Constitutional Classifiers v2 (nếu có). Giải thích tại sao chi phí tính toán phụ ~1% là câu chuyện an toàn khác về chất so với 23.7%.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Constitutional AI (AI theo hiến pháp) | "AI huấn luyện bằng nguyên tắc" | Pipeline hai pha: SFT tự phê bình-và-sửa đổi, rồi RL từ phản hồi AI |
| RLAIF | "RLHF không con người" | RL với ưu tiên do AI gắn nhãn tạo; phần còn lại của pipeline không đổi |
| Constitution (Hiến pháp) | "các nguyên tắc" | Danh sách có thứ tự các quy tắc ngôn ngữ tự nhiên mà mô hình phê bình/gắn nhãn tham khảo |
| Critique-and-revise (Phê bình-và-sửa đổi) | "vòng lặp SFT" | Tạo phản hồi → phê bình theo nguyên tắc → sửa đổi → mục tiêu SFT |
| Constitutional Classifier (Bộ phân loại theo hiến pháp) | "cổng đầu ra" | Bộ phân loại nhẹ đánh giá đầu ra theo hiến pháp và chặn/ghi log |
| Four-tier priority (Ưu tiên bốn tầng) | "bộ giải quyết xung đột" | Hệ phân cấp hiến pháp Claude 2026: thảm họa > nền tảng > đạo đức > hữu ích |
| Feedback model (Mô hình phản hồi) | "AI gắn nhãn" | Mô hình đọc nguyên tắc và xếp hạng cặp phần hoàn thành |

## Further Reading

- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)](https://arxiv.org/abs/2212.08073) — pipeline hai pha ban đầu
- [Anthropic — Claude's Constitution (Jan 2026)](https://www.anthropic.com/news/claudes-constitution) — bản viết lại bốn tầng năm 2026, CC0 1.0
- [Anthropic — Constitutional Classifiers (2024-2026)](https://www.anthropic.com/research/constitutional-classifiers) — phòng vệ cổng đầu ra với chi phí phụ ~1% trong v2
- [Lee et al. — RLAIF vs RLHF: Scaling Reinforcement Learning from Human Feedback (arXiv:2309.00267)](https://arxiv.org/abs/2309.00267) — so sánh thực nghiệm RLAIF / RLHF
- [Kundu et al. — Specific versus General Principles for Constitutional AI (arXiv:2310.13798)](https://arxiv.org/abs/2310.13798) — tác động độ chi tiết nguyên tắc
