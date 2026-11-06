# Failure Modes — MAST, Groupthink, Monoculture, Cascading Errors

> Hệ phân loại tham chiếu cho năm 2026 là **MAST** (Cemri và cộng sự, NeurIPS 2025, arXiv:2503.13657), được suy ra từ 1642 dấu vết thực thi trên 7 MAS mã nguồn mở tiên tiến nhất cho thấy **tỷ lệ thất bại 41–86.7%**. Ba danh mục gốc: **Các vấn đề đặc tả** (41.77%) — mơ hồ vai trò, định nghĩa tác vụ không rõ; **Các lỗi phối hợp** (36.94%) — đứt gãy giao tiếp, mất đồng bộ trạng thái; **Các khoảng trống xác minh** (21.30%) — thiếu xác thực, vắng kiểm tra chất lượng. Họ **Tư duy nhóm** (arXiv:2508.05687) bổ sung: sụp đổ đơn văn hóa (cùng mô hình cơ sở → các thất bại tương quan), thiên lệch thuận theo (các agent củng cố lỗi của nhau), lý thuyết tâm trí thiếu hụt, động lực động cơ hỗn hợp, các thất bại độ tin cậy dây chuyền. Ví dụ dây chuyền: các cơn bão thử lại nơi một lỗi thanh toán kích hoạt các lần thử lại đơn hàng, kích hoạt các lần thử lại kho hàng, làm quá tải dịch vụ kho hàng (tải 10x trong vài giây — cần các bộ ngắt mạch). Đầu độc bộ nhớ: ảo giác của một agent đi vào bộ nhớ dùng chung, các agent hạ nguồn coi nó là sự kiện; độ chính xác suy giảm dần, làm chẩn đoán nguyên nhân gốc đau đớn. **STRATUS** (NeurIPS 2025) báo cáo cải thiện thành công giảm thiểu 1.5x qua các agent phát hiện / chẩn đoán / xác thực chuyên biệt. Bài này coi các chế độ lỗi như các mục tiêu kỹ thuật hạng nhất.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 13 (Shared Memory), Phase 16 · 14 (Consensus and BFT), Phase 16 · 15 (Voting and Debate Topology)
**Time:** ~75 minutes

## Problem

Các hệ thống đa agent thất bại 41-86.7% thời gian trên các tác vụ thực (Cemri và cộng sự năm 2025 đo điều này trên 7 MAS mã nguồn mở). Điều đó không thể gỡ lỗi bằng “chỉ cần thêm nhiều agent.” Các thất bại có các nguyên nhân cấu trúc. Hệ phân loại MAST cho bạn các danh mục. Bài này ánh xạ mỗi danh mục tới một mẫu phát hiện, chẩn đoán, và giảm thiểu cụ thể để các con số ngừng trông tùy ý.

Thực hành sản xuất năm 2026 là coi các chế độ lỗi như các đầu vào thiết kế. Kiến trúc của bạn chưa “đủ tốt” cho đến khi bạn có thể chỉ tới mỗi danh mục MAST và nêu biện pháp giảm thiểu bạn đã triển khai.

## Concept

### MAST categories

**Các vấn đề đặc tả (41.77% các thất bại).** Tác vụ của agent chưa được định nghĩa đủ chặt. Các ví dụ:

- Mơ hồ vai trò: hai agent đều nghĩ chúng là người xem xét.
- Tác vụ chưa đặc tả đủ: “tóm tắt cái này” khi người dùng muốn một góc độ cụ thể.
- Các tiêu chí thành công ngầm định: agent không thể biết nó có thành công không.

Các biện pháp giảm thiểu:
- Viết các hợp đồng vai trò tường minh. Prompt của mỗi agent nêu những gì nó làm *và những gì nó không làm*.
- Các kiểm thử chấp nhận theo từng tác vụ. Trước khi agent bắt đầu, định nghĩa “xong trông như X.”
- Kiểm tra đặc tả trước khi chạy: một agent riêng xem xét định nghĩa tác vụ trước khi phân công.

**Các lỗi phối hợp (36.94%).** Các đứt gãy giao tiếp hoặc trạng thái.

Các ví dụ:
- Hai agent cập nhật trạng thái dùng chung không có đồng bộ hóa.
- Thông điệp bị mất giữa các agent (lỗi hàng đợi, hết thời gian chờ).
- Trôi trạng thái: agent A nghĩ tác vụ đã xong; agent B vẫn đang thực thi.

Các biện pháp giảm thiểu:
- Trạng thái dùng chung có phiên bản với đồng thời lạc quan.
- Xác nhận tường minh cho các thông điệp quan trọng (thử lại cho đến khi được xác nhận).
- Các checkpoint đồng bộ trạng thái định kỳ; phát hiện sự trôi sớm.

**Các khoảng trống xác minh (21.30%).** Không có kiểm tra độc lập trên các đầu ra.

Các ví dụ:
- Một agent tuyên bố thành công; không ai xác minh.
- Chuỗi agent, mỗi agent tin đầu ra của agent trước.
- Thiếu độ bao phủ kiểm thử trên hành vi kết hợp nổi lên.

Các biện pháp giảm thiểu:
- Agent xác minh độc lập (Bài 13). Chỉ đọc, truy cập nguồn độc lập.
- Hợp đồng bàn giao tường minh: “đầu ra của A phải vượt bộ kiểm tra C trước khi B bắt đầu.”
- Ghi nhật ký kết quả cho phân tích sau sự việc.

### Groupthink family (arXiv:2508.05687)

Năm thất bại liên quan khi các agent đồng nhất hóa hoặc bắt chước nhau:

**Sụp đổ đơn văn hóa.** Cùng mô hình cơ sở hoặc dữ liệu huấn luyện → các lỗi tương quan. Khi ba agent chia sẻ một LLM, chúng chia sẻ các ảo giác của nó.

**Thiên lệch thuận theo.** Các agent điều chỉnh về bên ngang hàng to tiếng nhất hoặc tự tin nhất, ngay cả khi sai.

**ToM thiếu hụt.** Các agent không mô hình hóa được niềm tin của nhau; phối hợp sụp đổ (Bài 18).

**Động lực động cơ hỗn hợp.** Các agent với các khuyến khích căn chỉnh một phần trôi về thỏa hiệp ở giữa, không thỏa mãn ai.

**Các thất bại độ tin cậy dây chuyền.** Mẫu lỗi của một thành phần kích hoạt các mẫu lỗi trong các thành phần phụ thuộc.

### Cascading example — the retry storm

Một mẫu sự cố kinh điển năm 2026:

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

Cách sửa là cổ điển: **các bộ ngắt mạch**. Khi tỷ lệ lỗi hạ nguồn vượt ngưỡng, ngắt tắt với các kết quả được lưu đệm hoặc mặc định. Cộng với các ngân sách thử lại bị giới hạn theo từng yêu cầu.

Các bộ ngắt mạch là một trong số ít biện pháp giảm thiểu lỗi đa agent bạn mượn trực tiếp từ các hệ thống phân tán không cần sửa đổi.

### Memory poisoning (revisited)

Từ Bài 13: ảo giác của một agent trở thành sự kiện bộ nhớ dùng chung; các agent hạ nguồn suy luận trên sự kiện bị đầu độc. Theo thuật ngữ MAST, đây là một khoảng trống xác minh ở lớp bộ nhớ dùng chung.

Suy giảm độ chính xác dần là triệu chứng. Bạn không nhận một sự cố; bạn nhận sự trôi chậm khó tìm nguyên nhân gốc.

Giảm thiểu: nhật ký chỉ thêm, nguồn gốc, bộ xác minh không thể ghi. Đã được trình bày trong Bài 13.

### STRATUS — specialized agents for failure detection

STRATUS (NeurIPS 2025) báo cáo cải thiện thành công giảm thiểu 1.5x khi bạn triển khai:

- **Agent phát hiện.** Theo dõi các mẫu triệu chứng (bất đồng cao, tăng vọt thử lại, trôi độ chính xác).
- **Agent chẩn đoán.** Với các triệu chứng, suy ra nguyên nhân gốc có khả năng từ hệ phân loại MAST.
- **Agent xác thực.** Sau khi một biện pháp giảm thiểu được áp dụng, kiểm tra các triệu chứng biến mất.

Đây là ứng phó sự cố kiểu SRE, áp dụng cho các hệ thống agent. Cả ba vai trò đều có thể là các agent LLM với các prompt chuyên biệt.

### The failure-mode audit

Một thực hành tốt nhất năm 2026 là kiểm toán các chế độ lỗi hàng quý (và theo mỗi bản phát hành lớn):

1. **Mẫu dấu vết.** Thu thập ~1000 dấu vết thực thi thực.
2. **Phân loại.** Với các thất bại của mỗi dấu vết, ánh xạ tới các danh mục MAST + Tư duy nhóm.
3. **Tính tỷ lệ thất bại theo danh mục.** Các danh mục nào chi phối hệ thống của bạn?
4. **Xếp hạng các biện pháp giảm thiểu.** Cách sửa nào sẽ loại bỏ nhiều thất bại nhất?
5. **Chọn 2-3 biện pháp giảm thiểu.** Triển khai; kiểm toán lại quý tới.

Kỷ luật quan trọng hơn các lựa chọn cụ thể. Không có kiểm toán, các thất bại hòa vào nhiễu và không bao giờ được giải quyết có hệ thống.

### When systems fail silently

Danh mục lỗi nguy hiểm nhất là lỗi tính đúng đắn âm thầm. Một hệ thống thất bại ồn ào (sự cố, ngoại lệ, cảnh báo) có thể được giám sát. Một hệ thống tạo ra các đầu ra có vẻ hợp lý nhưng sai không thể được phát hiện bằng các nhật ký ngoại lệ. Đây là lý do các khoảng trống xác minh là danh mục đắt nhất trên mỗi thất bại dù chúng chỉ chiếm 21.30% theo số đếm.

Đầu tư vào:
- Xem xét của con người dựa trên mẫu.
- Các kiểm thử hồi quy tập dữ liệu chuẩn.
- Kiểm tra chéo giữa các agent trên các đầu ra quan trọng.

### Failure vs slow failure

Một số thất bại tức thì; một số chậm. Các thất bại tức thì (hết thời gian chờ, không khớp lược đồ, lỗi xác thực) rẻ để phát hiện. Các thất bại chậm (đầu độc bộ nhớ, trôi đơn văn hóa, mơ hồ vai trò) đắt để phát hiện và ngăn ngừa.

Bước kỹ thuật năm 2026: gắn đo lường các chỉ báo thay thế lỗi chậm để bạn có thể bắt sự trôi trước khi nó trở thành một lỗi nhìn thấy được. Tỷ lệ đồng ý, tỷ lệ thử lại, phân phối độ dài đầu ra, và khoảng cách chỉnh sửa giữa các phiên bản agent liên tiếp đều là các chỉ báo thay thế hữu ích.

```figure
a5-retry-cascade
```

## Build It

`code/main.py` triển khai:

- `FailureTaxonomy` — phân loại các sự cố mô phỏng thành các danh mục MAST + Tư duy nhóm.
- `CircuitBreaker` — mẫu cổ điển; mở khi tỷ lệ lỗi vượt ngưỡng.
- `RetryStormSimulator` — cho thấy thất bại dây chuyền; bật / tắt bộ ngắt mạch.
- `DetectionAgent` — bộ khớp triệu chứng kiểu STRATUS được viết kịch bản.

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng:
- cơn bão thử lại không có bộ ngắt mạch: các lỗi kho hàng bùng nổ (mô phỏng).
- có bộ ngắt mạch: giới hạn tại ngưỡng; các phản hồi chế độ suy giảm được phục vụ.
- agent phát hiện gắn cờ mẫu và nêu danh mục MAST.

## Use It

`outputs/skill-mast-auditor.md` chạy một kiểm toán chế độ lỗi kiểu MAST trên một hệ thống đa agent. Các dấu vết → phân loại → xếp hạng giảm thiểu.

## Ship It

Kỷ luật chế độ lỗi trong sản xuất:

- **Kiểm toán MAST mỗi quý.** Không phải hằng năm. Các danh mục dịch chuyển khi hệ thống tăng trưởng.
- **Các bộ ngắt mạch ở mọi nơi.** Mỗi lệnh gọi đi ra tới bất kỳ dịch vụ phụ thuộc nào. Ngưỡng mở mặc định ở tỷ lệ lỗi 5-10%.
- **Các tập dữ liệu chuẩn.** Nhỏ, chất lượng cao, được kiểm toán tay. Kiểm thử hồi quy theo chúng hằng tuần.
- **Bộ ba STRATUS.** Các agent Phát hiện + Chẩn đoán + Xác thực giám sát sản xuất. Bắt đầu chỉ với agent phát hiện; thêm chẩn đoán khi các triệu chứng nhiễu.
- **Ngân sách thất bại.** SLO tường minh cho tỷ lệ thất bại theo danh mục. Vượt ngân sách kích hoạt một cuộc trao đổi dừng phát hành.

## Exercises

1. Chạy `code/main.py`. Xác nhận bộ ngắt mạch giới hạn cơn bão thử lại. Thay đổi ngưỡng lỗi và quan sát đánh đổi.
2. Triển khai một **chỉ báo thay thế lỗi chậm**: tỷ lệ đồng ý trên 3 agent song song. Khi nó giảm mạnh, kích hoạt một cảnh báo. Mô phỏng trôi đơn văn hóa bằng cách làm các đầu ra agent tương quan dần.
3. Đọc Cemri và cộng sự (arXiv:2503.13657). Chọn một trong 7 hệ thống MAS của họ và ánh xạ 3 danh mục lỗi hàng đầu. Chúng so với những gì MAST dự đoán như thế nào?
4. Đọc bài báo Groupthink (arXiv:2508.05687). Xác định mẫu nào trong năm mẫu khó phát hiện nhất trong sản xuất. Đề xuất một chỉ số thay thế.
5. Thiết kế một bộ ba phát hiện-chẩn đoán-xác thực kiểu STRATUS cho một hệ thống đa agent cụ thể bạn biết. Phát hiện theo dõi các triệu chứng nào? Chẩn đoán đề xuất các biện pháp giảm thiểu nào? Xác thực xác nhận chúng hoạt động như thế nào?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| MAST | “Hệ phân loại năm 2026” | Cemri 2025; 3 danh mục gốc + 14 loại con của các thất bại. |
| Specification Problem (Vấn đề đặc tả) | “Mơ hồ vai trò” | Tác vụ hoặc vai trò chưa định nghĩa đủ; các agent không biết làm gì. |
| Coordination Failure (Lỗi phối hợp) | “Trôi trạng thái” | Đứt gãy giao tiếp hoặc đồng bộ giữa các agent. |
| Verification Gap (Khoảng trống xác minh) | “Không ai kiểm tra” | Các đầu ra được chấp nhận không có xác thực độc lập. |
| Groupthink family (Họ tư duy nhóm) | “Các thất bại đồng nhất” | Đơn văn hóa, thuận theo, ToM thiếu hụt, động cơ hỗn hợp, dây chuyền. |
| Monoculture collapse (Sụp đổ đơn văn hóa) | “Cùng mô hình, cùng ảo giác” | Các lỗi tương quan từ mô hình cơ sở hoặc dữ liệu huấn luyện dùng chung. |
| Retry storm (Cơn bão thử lại) | “Khuếch đại lỗi dây chuyền” | Một thất bại kích hoạt các lần thử lại khuếch đại tải hạ nguồn. |
| Circuit breaker (Bộ ngắt mạch) | “Thất bại nhanh theo tỷ lệ lỗi” | Mở khi tỷ lệ lỗi vượt ngưỡng; ngắt tắt với mặc định. |
| STRATUS | “Bộ ba ứng phó sự cố” | Các agent phát hiện + chẩn đoán + xác thực. Thành công giảm thiểu 1.5x. |
| Memory poisoning (Đầu độc bộ nhớ) | “Các ảo giác lan truyền” | Sự kiện bộ nhớ dùng chung bị nhiễm; các agent hạ nguồn suy luận trên chất độc. |

## Further Reading

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — hệ phân loại MAST, NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687) — đơn văn hóa, thuận theo, và hệ phân loại năm họ
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) — mục kỷ yếu NeurIPS 2025 (phát hiện + chẩn đoán + xác thực)
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) — tham chiếu bộ ngắt mạch chuẩn
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — các ghi chú chế độ lỗi sản xuất
