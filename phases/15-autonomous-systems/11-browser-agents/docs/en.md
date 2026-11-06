# Browser Agents and Long-Horizon Web Tasks

> ChatGPT agent (tháng 7 năm 2025) hợp nhất Operator và deep research thành một agent trình duyệt/terminal và thiết lập SOTA BrowseComp ở mức 68.9%. OpenAI đóng Operator vào ngày 31 tháng 8 năm 2025 — hợp nhất ở lớp sản phẩm. Việc Anthropic mua lại Vercept đã đưa Claude Sonnet trên OSWorld từ dưới 15% lên 72.5%. WebArena-Verified (ServiceNow, ICLR 2026) sửa 11.3 điểm phần trăm tỷ lệ âm tính giả trong WebArena gốc và phát hành tập con Hard gồm 258 tác vụ. Các con số là có thật. Bề mặt tấn công cũng vậy: người đứng đầu bộ phận preparedness của OpenAI công khai tuyên bố rằng chèn prompt gián tiếp vào các agent trình duyệt “không phải là một lỗi có thể vá hoàn toàn.” Các cuộc tấn công được ghi nhận trong năm 2025–2026: Tainted Memories (Atlas CSRF), HashJack (Cato Networks), và chiếm quyền bằng một lần nhấp trong Perplexity Comet.

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**Prerequisites:** Phase 15 · 10 (Permission modes), Phase 15 · 01 (Long-horizon agents)
**Time:** ~45 minutes

## The Problem

Một agent trình duyệt là một agent có tầm thời gian dài đọc nội dung không đáng tin cậy và thực hiện các hành động có hệ quả. Mọi trang agent truy cập đều là một đầu vào mà người dùng không viết. Mọi biểu mẫu trên mọi trang đều là một kênh lệnh tiềm năng. Tập hợp tấn công năm 2025–2026 cho thấy đây không phải là giả định: Tainted Memories cho phép kẻ tấn công gắn các chỉ dẫn độc hại vào bộ nhớ của agent thông qua một trang được chế tạo; HashJack giấu các lệnh trong các fragment URL mà agent truy cập; các vụ chiếm quyền Perplexity Comet xảy ra chỉ với một lần nhấp.

Bức tranh phòng thủ không dễ chịu. Người đứng đầu bộ phận preparedness của OpenAI đã nói to điều thường được nói nhỏ: chèn prompt gián tiếp “không phải là một lỗi có thể vá hoàn toàn.” Điều này là vì cuộc tấn công nằm ở ranh giới đọc và hành động của agent, vốn mờ nhạt về mặt kiến trúc — về nguyên tắc, mọi token mô hình đọc đều có thể được đọc như một chỉ dẫn.

Bài này nêu tên bề mặt tấn công, nêu tên bối cảnh benchmark (BrowseComp, OSWorld, WebArena-Verified), và mô hình hóa một kịch bản chèn prompt gián tiếp tối thiểu để bạn có thể suy luận về các biện pháp phòng thủ thực trong Bài 14 và 18.

## The Concept

### The 2026 landscape, in one paragraph per system

**ChatGPT agent (OpenAI).** Ra mắt tháng 7 năm 2025. Hợp nhất Operator (duyệt web) và Deep Research (nghiên cứu nhiều giờ). Đóng Operator độc lập vào ngày 31 tháng 8 năm 2025. SOTA trên BrowseComp ở mức 68.9%; các con số cao trên OSWorld và WebArena-Verified.

**Claude Sonnet + Vercept (Anthropic).** Việc Anthropic mua lại Vercept tập trung vào năng lực sử dụng máy tính. Đưa Claude Sonnet trên OSWorld từ <15% lên 72.5%. Claude Computer Use được phát hành dưới dạng API công cụ.

**Gemini 3 Pro with Browser Use (DeepMind).** Tích hợp Browser Use cung cấp các điều khiển sử dụng máy tính; FSF v3 (tháng 4 năm 2026, Bài 20) theo dõi tính tự chủ cụ thể trong lĩnh vực R&D ML.

**WebArena-Verified (ServiceNow, ICLR 2026).** Sửa một vấn đề được ghi nhận rõ: WebArena gốc có tỷ lệ âm tính giả ~11.3% (các tác vụ bị đánh dấu thất bại nhưng thực tế đã được giải quyết). Bản phát hành Verified chấm lại bằng các tiêu chí thành công được con người tuyển chọn và bổ sung một tập con Hard gồm 258 tác vụ (bài báo ICLR 2026, openreview.net/forum?id=94tlGxmqkN).

### BrowseComp vs OSWorld vs WebArena

| Benchmark | Những gì nó đo | Tầm thời gian |
|---|---|---|
| BrowseComp | Tìm các sự kiện cụ thể trên web mở dưới áp lực thời gian | phút |
| OSWorld | Agent vận hành một máy tính để bàn đầy đủ (chuột, bàn phím, shell) | hàng chục phút |
| WebArena-Verified | Các tác vụ web giao dịch trên các trang mô phỏng | phút |
| Tập con Hard | Các tác vụ WebArena-Verified có chuyển trạng thái nhiều trang | hàng chục phút |

Các trục khác nhau. Điểm BrowseComp cao cho biết agent tìm được các sự kiện; nó không cho biết agent có thể đặt chuyến bay. Điểm OSWorld gần hơn với “nó có hoạt động trên máy tính để bàn của tôi không.” WebArena-Verified gần hơn với “nó có thể hoàn thành một luồng không.” Bất kỳ quyết định sản xuất nào đều cần benchmark khớp với phân phối tác vụ.

### The attack surface, named

1. **Chèn prompt gián tiếp.** Nội dung trang không đáng tin cậy chứa các chỉ dẫn. Agent đọc chúng. Agent thực thi chúng. Các ví dụ công khai: Kai Greshake và cộng sự năm 2024, bài báo Tainted Memories năm 2025, HashJack năm 2026 (Cato Networks).
2. **Chèn fragment / truy vấn URL.** `#fragment` hoặc chuỗi truy vấn của một URL được thu thập chứa các lệnh. Không bao giờ được hiển thị trực quan; vẫn nằm trong ngữ cảnh của agent.
3. **Các cuộc tấn công gắn bộ nhớ.** Trang chỉ dẫn agent ghi một ký ức bền vững (Bài 12 trình bày trạng thái bền vững). Phiên tiếp theo, ký ức kích hoạt payload mà không có tác nhân kích hoạt nhìn thấy được.
4. **Các cuộc tấn công dạng CSRF vào các phiên đã xác thực.** Loại Tainted Memories: agent đã đăng nhập ở đâu đó; trang của kẻ tấn công đưa ra các yêu cầu thay đổi trạng thái mà agent thực thi bằng cookie của người dùng.
5. **Chiếm quyền bằng một lần nhấp.** Một nút trông vô hại mang theo một payload mà agent làm theo. Loại Comet.
6. **Các lỗ hổng Content-Security-Policy trong bề mặt máy chủ của agent.** Bản thân các lớp hiển thị và công cụ có thể là các vector tấn công; ngăn xếp trình duyệt trong agent trình duyệt rất rộng.

### Why "not fully patchable"

Cuộc tấn công đẳng cấu với năng lực của agent. Agent phải đọc nội dung không đáng tin cậy để làm công việc của nó. Bất kỳ nội dung nào agent đọc đều có thể chứa các chỉ dẫn. Bất kỳ chỉ dẫn nào agent làm theo đều có thể lệch căn chỉnh với yêu cầu thực tế của người dùng. Các biện pháp phòng thủ (ranh giới tin cậy, bộ phân loại, danh sách công cụ cho phép, HITL trên các hành động có hệ quả) làm tăng chi phí tấn công và giảm phạm vi ảnh hưởng của nó. Chúng không khép lại loại tấn công này.

Đây là cùng kiểu suy luận với định lý Lob (Bài 8): agent không thể chứng minh token tiếp theo là an toàn; nó chỉ có thể thiết lập một hệ thống nơi các token không an toàn dễ bị phát hiện hơn.

### Defense posture that actually ships

- **Ranh giới đọc / ghi.** Việc đọc không bao giờ có hệ quả. Việc ghi (gửi biểu mẫu, đăng nội dung, gọi một công cụ có tác dụng phụ) yêu cầu phê duyệt mới từ con người nếu nội dung khởi phát đến từ bên ngoài ranh giới tin cậy.
- **Danh sách công cụ cho phép theo từng tác vụ.** Agent có thể duyệt web; nó không thể khởi tạo chuyển khoản ngân hàng trừ khi công cụ đó được bật tường minh cho tác vụ. Bài 13 trình bày ngân sách.
- **Cách ly phiên.** Các phiên agent trình duyệt chỉ chạy với thông tin xác thực có phạm vi giới hạn. Không có xác thực sản xuất, không có email cá nhân. Nhật ký mọi yêu cầu HTTP được giữ lại để kiểm toán.
- **Bộ làm sạch nội dung.** HTML được lấy về bị loại bỏ các mẫu được biết là xấu trước khi nối vào ngữ cảnh mô hình. (Giảm các cuộc tấn công dễ; không ngăn được các payload tinh vi.)
- **HITL trên các hành động có hệ quả.** Mẫu đề xuất rồi cam kết (Bài 15).
- **Token canary trên bộ nhớ.** Nếu một mục bộ nhớ kích hoạt, người dùng nhìn thấy nó (Bài 14).

```figure
injection-boundary
```

## Use It

`code/main.py` mô hình hóa một lần chạy agent trình duyệt nhỏ trên ba trang tổng hợp. Một trang lành tính, một trang có một khối chèn prompt trực tiếp trong văn bản hiển thị, một trang có chèn fragment URL (không nhìn thấy nhưng nằm trong ngữ cảnh của agent). Script cho thấy (a) một agent ngây thơ sẽ làm gì, (b) ranh giới đọc/ghi bắt được gì, (c) bộ làm sạch bắt được gì, (d) những gì cả hai đều không bắt được.

## Ship It

`outputs/skill-browser-agent-trust-boundary.md` xác định phạm vi cho một triển khai agent trình duyệt được đề xuất: những vùng tin cậy nó chạm tới, những gì nó được phép ghi, và những biện pháp phòng thủ nào phải có trước lần chạy đầu tiên.

## Exercises

1. Chạy `code/main.py`. Xác định cuộc tấn công nào bộ làm sạch bắt được nhưng ranh giới đọc/ghi không bắt được, và cuộc tấn công nào chỉ ranh giới đọc/ghi bắt được.

2. Mở rộng bộ làm sạch để phát hiện một loại chèn fragment URL kiểu HashJack. Đo tỷ lệ dương tính giả trên các URL lành tính với các fragment hợp lệ.

3. Chọn một quy trình agent trình duyệt thực mà bạn biết (ví dụ: “đặt chuyến bay”). Liệt kê mọi lần đọc và mọi lần ghi. Đánh dấu những lần ghi nào cần HITL và vì sao.

4. Đọc bài báo WebArena-Verified ICLR 2026. Xác định một loại tác vụ mà cách chấm điểm của WebArena gốc không đáng tin cậy và giải thích cách tập con Verified giải quyết nó.

5. Thiết kế một canary bộ nhớ cho bối cảnh agent trình duyệt. Bạn sẽ lưu gì, ở đâu, và điều gì kích hoạt báo động?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| Indirect prompt injection (Chèn prompt gián tiếp) | “Văn bản trang xấu” | Nội dung không đáng tin cậy trong một trang agent đọc chứa các chỉ dẫn mà agent thực thi |
| Tainted Memories | “Tấn công bộ nhớ” | Agent ghi một chỉ dẫn do kẻ tấn công cung cấp vào bộ nhớ bền vững; được kích hoạt ở phiên tiếp theo |
| HashJack | “Tấn công fragment URL” | Payload ẩn trong fragment URL / chuỗi truy vấn nằm trong ngữ cảnh của agent nhưng không được hiển thị trực quan |
| One-click hijack (Chiếm quyền bằng một lần nhấp) | “Nút xấu” | Thành phần có thể thao tác nhìn thấy được mang theo một payload tiếp nối mà agent thực thi |
| BrowseComp | “Benchmark tìm kiếm web” | Tìm các sự kiện cụ thể trên web mở; tầm thời gian ở quy mô phút |
| OSWorld | “Benchmark máy tính để bàn” | Điều khiển toàn bộ hệ điều hành; các tác vụ GUI nhiều bước |
| WebArena-Verified | “Benchmark tác vụ web đã sửa” | WebArena được ServiceNow chấm lại với tập con Hard |
| Read/write boundary (Ranh giới đọc/ghi) | “Cổng kiểm soát tác dụng phụ” | Việc đọc không bao giờ có hệ quả; việc ghi yêu cầu phê duyệt mới nếu nội dung nằm ngoài vùng tin cậy |

## Further Reading

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) — hợp nhất Operator và deep research; SOTA BrowseComp.
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) — dòng kế thừa Operator và kiến trúc đã trở thành ChatGPT agent.
- [Zhou et al. — WebArena](https://webarena.dev/) — benchmark gốc.
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) — bài báo về tập con đã sửa ICLR 2026.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — bao gồm thảo luận về bề mặt tấn công đối với các agent sử dụng máy tính.
