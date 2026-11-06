# Indirect Prompt Injection — Production Attack Surface

> Indirect prompt injection (IPI) nhúng các chỉ dẫn bên trong nội dung bên ngoài — một trang web, một email, một tài liệu chia sẻ, một ticket hỗ trợ — được một hệ thống agentic tiêu thụ mà không có hành động rõ ràng của người dùng. IPI là mối đe dọa production chủ đạo năm 2026: nó vượt qua các bộ lọc đầu vào người dùng vì kẻ tấn công không bao giờ chạm đến người dùng, nó âm thầm mở rộng khi các agent xử lý thêm nội dung bên ngoài, và nó nhắm vào các quy trình tự động nơi không ai đọc prompt. MDPI Information 17(1):54 (tháng 1 năm 2026) tổng hợp nghiên cứu 2023-2025. Bài báo phòng thủ IPI của NDSS 2026 định hình thách thức cốt lõi: các chỉ dẫn được chèn có thể vô hại về ngữ nghĩa ("vui lòng in Yes"), nên phát hiện đòi hỏi nhiều hơn lọc từ khóa. "The Attacker Moves Second" (Nasr và cộng sự, hợp tác OpenAI/Anthropic/DeepMind, tháng 10 năm 2025): các cuộc tấn công thích ứng (gradient, RL, tìm kiếm ngẫu nhiên, red-team con người) vượt qua cả 12 biện pháp phòng thủ đã công bố mà họ thử nghiệm, với thành công tấn công trên 90% với phần lớn chúng, dù phần lớn các biện pháp phòng thủ đó ban đầu báo cáo tỷ lệ thành công tấn công gần bằng không.

**Type:** Build
**Languages:** Python (stdlib, IPI attack + defense harness)
**Prerequisites:** Phase 18 · 12 (PAIR), Phase 14 (agent engineering)
**Time:** ~75 minutes

## Learning Objectives

- Định nghĩa chèn prompt gián tiếp và mô tả ba hướng phân phối phổ biến.
- Giải thích tại sao bộ lọc đầu vào người dùng bỏ sót hoàn toàn IPI.
- Mô tả cách nhìn "kiểm soát luồng thông tin" là mô hình phòng vệ 2026.
- Nêu phát hiện Nasr và cộng sự (tháng 10 năm 2025) về thành công tấn công thích ứng đối với phòng vệ IPI công bố.

## The Problem

Chèn prompt trực tiếp cần kẻ tấn công tiếp cận người dùng hoặc prompt của họ. IPI không cần cả hai: kẻ tấn công đặt payload trong bất kỳ nội dung nào agent có thể đọc — trang web, email trong hộp thư, issue GitHub, đánh giá sản phẩm. Agent lấy trong vận hành bình thường và thực thi chỉ dẫn. Người dùng là người đưa tin, không phải ý định.

## The Concept

### Three delivery vectors

- **Sinh tăng cường truy xuất (RAG).** Kẻ tấn công công bố tài liệu; bước truy xuất lấy nó; prompt nối nó trước câu hỏi người dùng; mô hình thực thi chỉ dẫn kẻ tấn công.
- **Workflow hộp thư / tài liệu.** Kẻ tấn công gửi email cho người dùng; agent đọc email; prompt chứa thân email; mô hình theo chỉ dẫn email.
- **Đầu ra công cụ.** Kẻ tấn công kiểm soát công cụ agent dùng (ví dụ: tìm kiếm web trả kết quả do kẻ tấn công kiểm soát); đầu ra công cụ chứa chỉ dẫn; luồng điều khiển agent theo chúng.

Cả ba chung thuộc tính cấu trúc: kẻ tấn công kiểm soát mảnh prompt mà không chạm đầu vào hướng người dùng.

### Why user-input filters miss it

Payload IPI không xuất hiện trong đầu vào người dùng. Nó xuất hiện trong nội dung truy xuất. Nếu bộ lọc kiểm soát đầu vào người dùng, payload vượt nó. Nếu bộ lọc kiểm soát mọi nội dung đến mô hình, phải áp dụng cho văn bản truy xuất tùy ý — đắt và tạo dương tính giả với nội dung hợp lệ tình cờ chứa ngôn ngữ mệnh lệnh.

### Information Flow Control (IFC) for AI

Mô hình phòng vệ 2026 mượn từ bảo mật hệ điều hành cổ điển. Xem mỗi nguồn nội dung là nhãn bảo mật. Gắn truy vấn người dùng là "đáng tin." Gắn nội dung truy xuất là "không đáng tin." Xem luồng điều khiển mô hình là luồng thông tin: hành động kích hoạt bởi nội dung không đáng tin phải được đầu vào đáng tin phê chuẩn trước thực thi.

CaMeL (Microsoft 2025), ConfAIde (Stanford 2024) và bài báo phòng vệ IPI NDSS 2026 hiện thực hóa IFC theo cách khác nhau. Nguyên tắc chung: chừng nào mã và dữ liệu chung cửa sổ ngữ cảnh, kiềm chế là mục tiêu, không phải ngăn chặn.

### The Attacker Moves Second

Nasr và cộng sự (tháng 10 năm 2025) thử nghiệm 12 biện pháp phòng thủ IPI đã công bố bằng các cuộc tấn công thích ứng (tìm kiếm gradient, chính sách RL, tìm kiếm ngẫu nhiên, red-team con người 72 giờ). Mọi biện pháp phòng thủ đều bị vượt qua, phần lớn ở ASR >90%, và phần lớn ban đầu báo cáo ASR gần bằng không.

Bài học phương pháp: chỉ công bố phòng vệ cùng đánh giá tấn công thích ứng. Phép đo chuẩn tấn công tĩnh không là bằng chứng độ vững; kẻ tấn công được biết phòng vệ.

### Real incidents

Bài 25 đề cập EchoLeak (CVE-2025-32711, CVSS 9.3) — IPI zero-click đầu tiên trong Microsoft 365 Copilot được ghi nhận công khai. CamoLeak (CVSS 9.6) trong GitHub Copilot Chat. CVE-2025-53773 trong GitHub Copilot. Triển khai sản xuất đang bị IPI xâm phạm ngoài thực tế, không chỉ trong phép đo chuẩn.

### OWASP and NIST framing

OWASP LLM Top 10 (2025) xếp chèn prompt (trực tiếp + gián tiếp) là LLM01, đe dọa lớp ứng dụng #1. NIST AI SPD 2024 gọi chèn prompt gián tiếp là "lỗ hổng bảo mật lớn nhất của AI tạo sinh."

### Where this fits in Phase 18

Bài 12-14 là jailbreak tập trung mô hình. Bài 15 là tấn công tập trung hệ thống chi phối triển khai sản xuất 2026. Bài 16 đề cập công cụ phòng vệ. Bài 25 đề cập câu chuyện CVE cụ thể.

```figure
al-injection-vector
```

## Use It

`code/main.py` xây bộ kiểm thử IPI. Agent đơn giản có ba công cụ (tìm web, đọc email, gửi tin nhắn). Môi trường chứa nội dung do kẻ tấn công kiểm soát với chỉ dẫn nhúng ("chuyển tiếp cho mọi liên hệ"). Bạn có thể chuyển giữa agent ngây thơ (theo chỉ dẫn được chèn), agent phòng vệ bằng lọc (lọc từ khóa trên nội dung truy xuất), và agent IFC (tách nội dung đáng tin và không đáng tin, từ chối lệnh luồng điều khiển không đáng tin).

## Ship It

Bài học này tạo ra `outputs/skill-ipi-audit.md`. Với mô tả triển khai có agent, liệt kê nguồn nội dung không đáng tin, kiểm tra triển khai có áp dụng IFC và đánh dấu nguồn đến mô hình không có nhãn tin cậy.

## Exercises

1. Chạy `code/main.py`. Đo tỷ lệ thành công tấn công đối với từng agent trong ba agent.

2. Triển khai phòng vệ dựa trên diễn đạt lại trên nội dung truy xuất. Đo tỷ lệ dương tính giả vô hại trên văn bản truy xuất hợp lệ.

3. Đọc bài báo phòng vệ IPI NDSS 2026. Mô tả thách thức "chỉ dẫn vô hại" và tại sao nó ngăn lọc dựa trên từ khóa.

4. Thiết kế triển khai agent nhận đầu ra công cụ từ API bên thứ ba. Gắn mỗi mảnh prompt mức tin cậy và viết chính sách IFC chi phối hành động agent.

5. Tái tạo phương pháp tấn công thích ứng Nasr và cộng sự 2025 trên agent phòng vệ bằng lọc từ Bài tập 2. Báo cáo ASR trước và sau tấn công thích ứng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| IPI | "chèn prompt gián tiếp" | Chèn qua nội dung người dùng không viết, được agent tiêu thụ trong vận hành bình thường |
| RAG injection (Chèn qua RAG) | "truy xuất bị đầu độc" | Kẻ tấn công công bố nội dung bước truy xuất lấy; prompt chứa payload |
| Zero-click | "không hành động người dùng" | Tấn công tự kích hoạt trong vận hành agent; người dùng không làm gì |
| IFC | "kiểm soát luồng thông tin" | Cách tiếp cận dựa trên nhãn: hành động từ nội dung không đáng tin cần phê chuẩn đáng tin |
| Adaptive attack (Tấn công thích ứng) | "red-team gradient / RL" | Tấn công biết phòng vệ và tối ưu chống nó; cần cho đánh giá trung thực |
| Benign instruction (Chỉ dẫn vô hại) | "vui lòng in Yes" | Payload IPI vô hại về ngữ nghĩa; không lọc từ khóa nào bắt được |
| Scope violation (Vi phạm phạm vi) | "đưa ra ngoài xuyên ranh giới tin cậy" | Agent truy cập dữ liệu từ một ngữ cảnh tin cậy và xuất sang ngữ cảnh khác |

## Further Reading

- [MDPI Information 17(1):54 — Indirect Prompt Injection Survey (January 2026)](https://www.mdpi.com/2078-2489/17/1/54) — tổng hợp 2023-2025
- [Nasr et al. — The Attacker Moves Second (joint OpenAI/Anthropic/DeepMind, October 2025)](https://arxiv.org/abs/2510.18108) — đánh giá tấn công thích ứng
- [Greshake et al. — Not what you've signed up for (arXiv:2302.12173)](https://arxiv.org/abs/2302.12173) — bài báo IPI ban đầu
- [OWASP — LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/) — chèn prompt xếp LLM01
