# Constitutional AI and Rule Overrides

> Claude Constitution ngày 22 tháng 1 năm 2026 của Anthropic dài 79 trang và là CC0. Nó chuyển từ căn chỉnh dựa trên quy tắc sang căn chỉnh dựa trên lý do và thiết lập một hệ thống thứ bậc ưu tiên bốn tầng: (1) an toàn và hỗ trợ giám sát của con người, (2) đạo đức, (3) hướng dẫn của Anthropic, (4) tính hữu ích. Các hành vi được chia thành các điều cấm mã hóa cứng (nâng cao năng lực vũ khí sinh học, CSAM) mà người vận hành và người dùng không thể ghi đè và các mặc định mã hóa mềm mà người vận hành có thể điều chỉnh trong các giới hạn đã định. Bản gốc năm 2022 (Bai và cộng sự) huấn luyện tính vô hại qua tự phê bình và RLAIF theo một hiến pháp. Lưu ý thẳng thắn: căn chỉnh dựa trên lý do dựa vào việc mô hình khái quát hóa các nguyên tắc cho các tình huống không dự đoán trước. Thí nghiệm có sự tham gia năm 2023 của chính Anthropic cho thấy sự khác biệt ~50% giữa các nguyên tắc có nguồn từ công chúng và doanh nghiệp; phiên bản năm 2026 không tích hợp những phát hiện đó.

**Type:** Learn
**Languages:** Python (stdlib, four-tier priority resolver)
**Prerequisites:** Phase 15 · 06 (Automated alignment research), Phase 15 · 10 (Permission modes)
**Time:** ~60 minutes

## The Problem

Một agent được đưa vào sử dụng thấy những đầu vào mà các nhà thiết kế của nó chưa từng thấy. Không danh sách quy tắc nào đủ dài để bao phủ chúng. Không danh sách quy tắc nào đủ ngắn để áp dụng nhanh dưới áp lực tính toán. Câu hỏi thực tế: bạn căn chỉnh một agent với các nguyên tắc tồn tại qua cả một đuôi dài các trường hợp lẫn suy luận nhanh như thế nào?

Căn chỉnh dựa trên quy tắc (RBA): liệt kê mọi điều không được phép. Kiểm tra nhanh, dễ kiểm toán, không thể giữ cập nhật, thường từ chối quá mức với các trường hợp tương tự gần mà nó không dự đoán trước. Căn chỉnh dựa trên lý do (Claude Constitution năm 2026): mã hóa các nguyên tắc, để mô hình suy luận. Mở rộng qua các trường hợp chưa thấy, khó kiểm toán hơn, chế độ lỗi là áp dụng sai nguyên tắc thay vì bỏ sót quy tắc.

Constitution năm 2026 chọn một vị trí trung gian tường minh. Các điều cấm mã hóa cứng — những điều mà tính sai trái không phụ thuộc vào ngữ cảnh (nâng cao năng lực vũ khí sinh học, CSAM) — là RBA: không bao giờ, bất kể chỉ dẫn của người vận hành hoặc người dùng. Mọi thứ khác dựa trên lý do trong một hệ thống thứ bậc bốn tầng: an toàn và hỗ trợ giám sát của con người trước tiên; đạo đức thứ hai; hướng dẫn do Anthropic tuyên bố thứ ba; tính hữu ích cuối cùng. Người vận hành có thể điều chỉnh các mặc định trong vùng mã hóa mềm nhưng không thể chạm tới các điều cấm mã hóa cứng.

## The Concept

### The four-tier priority hierarchy

1. **An toàn và hỗ trợ giám sát của con người.** Cao nhất. Mô hình ưu tiên không làm suy yếu khả năng của con người và Anthropic trong việc giám sát và sửa AI. Đây không phải là “hãy thận trọng”; nó cụ thể là “không hành động theo những cách khiến giám sát của con người khó hơn.”
2. **Đạo đức.** Trung thực, tránh gây hại cho con người, không lừa dối, không thao túng. Vượt lên hướng dẫn của Anthropic khi chúng xung đột.
3. **Hướng dẫn của Anthropic.** Các chuẩn mực vận hành mà Anthropic đã quyết định là quan trọng: phạm vi sản phẩm, các mẫu tương tác, công cụ nào dùng khi nào.
4. **Tính hữu ích.** Thấp nhất. Hữu ích nhất có thể trong các ưu tiên cao hơn.

Khi các tầng xung đột, tầng cao hơn thắng. Điều này có cùng hình dạng với các ưu tiên Unix hoặc QoS mạng — cách định hình này nhằm tạo ra sự giải quyết có thể dự đoán, không nhất thiết là hành vi trường hợp tốt nhất trên bất kỳ trục đơn lẻ nào.

### Hardcoded prohibitions vs soft-coded defaults

**Mã hóa cứng:**
- Nâng cao năng lực vũ khí sinh học / CBRN
- CSAM
- Các cuộc tấn công vào cơ sở hạ tầng trọng yếu
- Lừa dối người dùng về danh tính của mô hình khi được hỏi trực tiếp

Người vận hành không thể ghi đè những điều này. Người dùng không thể ghi đè những điều này. Chúng được thực thi ở cấp trọng số mô hình khi có thể (huấn luyện RLHF / Constitutional AI) và ở lớp suy luận khi không thể.

**Các mặc định mã hóa mềm (người vận hành có thể điều chỉnh):**
- Các mặc định độ dài phản hồi
- Phạm vi chủ đề (mô hình có thể từ chối các chủ đề ngoài triển khai của người vận hành)
- Phong cách (trang trọng so với thân mật)
- Các mẫu sử dụng công cụ

Các điều chỉnh của người vận hành diễn ra bên trong một giới hạn đã khai báo. Người vận hành không thể loại bỏ các điều cấm mã hóa cứng bằng cách đổi tên chúng.

### The 2022 CAI training

Constitutional AI gốc (Bai và cộng sự, 2022) huấn luyện tính vô hại:

1. Sinh phản hồi cho một tập prompt.
2. Yêu cầu mô hình phê bình mỗi phản hồi theo một hiến pháp (các nguyên tắc tường minh).
3. Sửa phản hồi dựa trên sự phê bình.
4. RLAIF (học tăng cường từ phản hồi AI) trên các cặp đã sửa.

Kết quả: một mô hình từ chối các yêu cầu có hại với các giải thích có nguyên tắc, không phải các từ chối bao trùm. Constitution năm 2026 sử dụng một hậu duệ của cách huấn luyện này cộng với hậu huấn luyện bổ sung trên hệ thống thứ bậc tầng tường minh.

### What reason-based alignment catches and misses

**Bắt được:**
- Các kết hợp không dự đoán trước của các nguyên thủy được phép mà nguyên tắc áp dụng rõ ràng.
- Các yêu cầu mới là các trường hợp tương tự gần của những yêu cầu bị cấm.
- Các cuộc tấn công kỹ nghệ xã hội dựa vào “bạn không nói X là không được phép.”

**Bỏ sót:**
- Các cuộc tấn công khai thác sự mơ hồ của nguyên tắc (“người dùng đã yêu cầu điều này nên tính hữu ích nói có”).
- Các kịch bản mà hai nguyên tắc xung đột theo một cách không dự đoán trước, và thứ tự tầng mơ hồ.
- Sự trôi chậm trong diễn giải nguyên tắc qua các chu kỳ huấn luyện (diễn giải lại).

### The 2023 participatory experiment

Anthropic thực hiện một thí nghiệm năm 2023 so sánh một hiến pháp do doanh nghiệp soạn với một hiến pháp được tạo qua đầu vào công chúng (~1,000 người trả lời tại Mỹ). Hai phiên bản đồng ý về ~50% nguyên tắc. Nơi chúng khác biệt, phiên bản có nguồn từ công chúng hạn chế hơn về một số vấn đề (xử lý nội dung chính trị) và ít hạn chế hơn về những vấn đề khác (tự tiết lộ danh tính AI). Constitution năm 2026 không tích hợp các phát hiện có nguồn từ công chúng. Đây là một căng thẳng được ghi nhận trong cách tiếp cận này.

### Why hardcoded prohibitions are necessary

Chỉ căn chỉnh dựa trên lý do không thể khép lại phần đuôi. Một kẻ tấn công có thể khiến mô hình chấp nhận một tiền đề (ví dụ: “chúng tôi là một phòng thí nghiệm nghiên cứu vũ khí sinh học được cấp phép”) thường có thể dùng lời nói vượt qua các nguyên tắc phụ thuộc vào suy luận theo trường hợp. Các điều cấm mã hóa cứng không uốn theo cách định hình tiền đề. Chúng là “giới hạn hiến định cứng” của Bài 14 ở lớp căn chỉnh.

### Where the Constitution sits in the stack

Constitution không phải là công tắc ngắt của Bài 14. Nó nằm ở lớp mô hình: những gì trọng số mô hình được huấn luyện để ưu tiên. Các công tắc ngắt và token canary nằm ở lớp môi trường chạy: những gì môi trường chạy cho phép. Cả hai đều bắt buộc. Một môi trường chạy kích hoạt tất cả các hành động sai vì trọng số mô hình dễ dãi là một vấn đề môi trường chạy. Một mô hình từ chối tất cả các hành động đúng vì môi trường chạy quá hạn chế là một vấn đề môi trường chạy. Các lớp bao phủ những loại khác nhau.

```figure
mx-priority-tiers
```

## Use It

`code/main.py` triển khai một bộ giải quyết ưu tiên bốn tầng tối thiểu. Bộ giải quyết nhận một hành động được đề xuất và một tập đánh giá nguyên tắc (an toàn, đạo đức, hướng dẫn, tính hữu ích) và trả về hành động, một từ chối, hoặc một hành động đã sửa đổi. Trình điều khiển chạy một tập trường hợp nhỏ: cho phép rõ ràng, không cho phép rõ ràng, điều cấm mã hóa cứng, trường hợp mơ hồ giữa các tầng.

## Ship It

`outputs/skill-constitution-review.md` kiểm toán lớp hiến định của một triển khai: điều gì được mã hóa cứng, điều gì được mã hóa mềm, nơi người vận hành có thể điều chỉnh, và liệu hệ thống thứ bậc bốn tầng có thực sự là thứ tự giải quyết hay không.

## Exercises

1. Chạy `code/main.py`. Xác nhận điều cấm mã hóa cứng kích hoạt ngay cả khi tính hữu ích cao. Sửa bộ giải quyết để đặt trọng số tính hữu ích cao hơn đạo đức; quan sát chế độ lỗi.

2. Đọc Claude Constitution (công khai, 79 trang, CC0). Xác định một nguyên tắc bạn tin là chưa được đặc tả đủ. Viết hai đoạn giải thích sự mơ hồ cụ thể và đề xuất một cách diễn đạt chặt chẽ hơn.

3. Thiết kế một tập mặc định mã hóa mềm cho một agent hỗ trợ khách hàng. Người vận hành điều chỉnh gì? Người vận hành không thể chạm tới gì? Giải thích từng ranh giới.

4. Đọc bài báo CAI năm 2022 của Bai và cộng sự. Mô tả một trường hợp mà vòng lặp phê bình và sửa của Constitutional AI sẽ tạo ra một kết quả tệ hơn một quy tắc bao trùm. Xác định loại.

5. Thí nghiệm có sự tham gia năm 2023 của Anthropic tìm thấy sự khác biệt ~50% giữa các nguyên tắc công chúng và doanh nghiệp. Chọn một loại mà điều này quan trọng đối với triển khai sản xuất (ví dụ: tính trung lập chính trị). Đề xuất một thiết kế cho phép người vận hành thể hiện các giá trị riêng trong khi các điều cấm mã hóa cứng vẫn nguyên vẹn.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| Constitutional AI (AI hiến định) | “Phương pháp căn chỉnh của Anthropic” | Tự phê bình + RLAIF theo một hiến pháp được viết ra |
| Reason-based alignment (Căn chỉnh dựa trên lý do) | “Nguyên tắc, không phải quy tắc” | Mô hình suy luận trên các nguyên tắc để xử lý các trường hợp chưa thấy |
| Hardcoded prohibition (Điều cấm mã hóa cứng) | “Không bao giờ làm X” | Điều cấm dựa trên quy tắc mà không người vận hành hoặc người dùng nào có thể ghi đè |
| Soft-coded default (Mặc định mã hóa mềm) | “Người vận hành có thể điều chỉnh” | Hành vi trong một giới hạn đã khai báo, người vận hành kiểm soát |
| Four-tier hierarchy (Hệ thống thứ bậc bốn tầng) | “Thứ tự ưu tiên” | an toàn > đạo đức > hướng dẫn > tính hữu ích |
| RLAIF | “RL phản hồi AI” | RL nơi phần thưởng đến từ các phê bình do mô hình sinh ra |
| Participatory constitution (Hiến pháp có sự tham gia) | “Các nguyên tắc có nguồn từ công chúng” | Thí nghiệm Anthropic năm 2023; khác biệt ~50% so với doanh nghiệp |
| Principle drift (Sự trôi nguyên tắc) | “Trượt diễn giải” | Thay đổi chậm trong cách mô hình đọc một văn bản nguyên tắc cố định |

## Further Reading

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — tài liệu CC0 dài 79 trang.
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) — bản gốc năm 2022.
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) — thí nghiệm có sự tham gia.
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — nơi Constitution nằm trong ngăn xếp RSP.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — vai trò của Constitution trong các triển khai có tầm thời gian dài.
