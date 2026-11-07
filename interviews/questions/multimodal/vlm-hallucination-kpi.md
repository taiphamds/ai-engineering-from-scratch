---
id: vlm-hallucination-kpi
title: Monitor a deployed VLM for invented objects
card: multimodal
kind: design
level: 3
roles: [ai-evaluation-reliability-engineer, forward-deployed-ai-engineer, applied-ai-engineer]
rounds: [system-design, design-review]
tags: [hallucination, monitoring, cmer, production]
minutes: 15
lessons: [phases/04-computer-vision/25-vision-language-models]
manuals: []
practice: []
cheatsheet: [vlm-model-families, genai-observability]
related: [multimodal/spatial-reasoning-limit]
updated: 2026-11-03
---

Mô hình thị giác-ngôn ngữ đã triển khai của bạn trả lời các câu hỏi về ảnh sản phẩm. Các ticket hỗ trợ nói nó bịa đối tượng và đọc sai các con số, nhưng điểm benchmark offline ổn. Thiết kế việc theo dõi production và kế hoạch phản ứng.

## Short answer

Xem ảo giác là một chỉ số production, không phải một thuộc tính mô hình. Chấm mọi câu trả lời bằng một tỷ lệ lỗi xuyên phương thức: embed ảnh và văn bản được sinh bằng một bộ kiểm tra tương phản độc lập, và gắn cờ các đầu ra nơi độ tự tin văn bản cao nhưng độ tương tự ảnh-văn bản thấp. Theo dõi tỷ lệ đó theo endpoint, loại prompt và khách hàng, cảnh báo khi tăng, và định tuyến các câu trả lời được gắn cờ đến đánh giá con người thay vì đến người dùng. Nhóm giới thiệu chỉ số giảm tỷ lệ ảo giác khoảng 35 phần trăm theo cách này, không thay mô hình.

## Full answer

### Why the benchmark does not see it

Khoảng 12 phần trăm các cặp ảnh và văn bản trong dữ liệu huấn luyện thu thập mô tả những thứ không hoàn toàn có trong ảnh. Một mô hình được huấn luyện trên chúng học nói những điều hợp lý ảnh không hỗ trợ, và các benchmark được xây từ cùng loại dữ liệu thưởng tính hợp lý. Trong production, đầu vào là ảnh, câu hỏi và con số của bạn, và lỗi này là lỗi chi phối.

### The metric

```python
def cross_modal_error_rate(image_emb, text_emb, text_confidence, sim_threshold=0.25, conf_threshold=0.8):
    image_emb = F.normalize(image_emb, dim=-1)
    text_emb = F.normalize(text_emb, dim=-1)
    sim = (image_emb * text_emb).sum(dim=-1)
    high_conf_low_sim = (text_confidence > conf_threshold) & (sim < sim_threshold)
    return high_conf_low_sim.float().mean().item()
```

Độ tự tin văn bản là xác suất trung bình mỗi token của câu trả lời. Bộ kiểm tra là một mô hình ảnh-văn bản tương phản độc lập với bộ sinh. Hai ngưỡng đến từ dữ liệu riêng của bạn: hiệu chuẩn chúng trên một mẫu có nhãn các câu trả lời có grounding và ảo giác.

### The dashboard

- Tỷ lệ theo endpoint, loại prompt và khách hàng, theo thời gian.
- Tỷ lệ được chia theo nguồn ảnh và độ phân giải, vì một camera mới hoặc một đường tải lên mới làm nó dịch chuyển.
- Một mẫu các câu trả lời được gắn cờ để đọc hằng tuần, với nhãn một người đánh giá đã cho.
- Một cảnh báo khi tăng trên một cửa sổ baseline.

### The response plan

1. Định tuyến. Một câu trả lời được gắn cờ đến một hàng đợi đánh giá, hoặc trả về một phản hồi dè dặt cho thấy vùng ảnh, không phải một con số sai tự tin. Một câu trả lời có các con số không vượt qua kiểm tra nhận dạng văn bản cũng đến hàng đợi đánh giá, ngay cả khi tỷ lệ toàn ảnh không gắn cờ nó.
2. Đọc. Mẫu hằng tuần cho bạn biết các loại prompt nào thất bại: số, số đếm, văn bản nhỏ.
3. Sửa ở cấp dữ liệu. Thêm các ví dụ có grounding cho các loại prompt thất bại, và chia ô hoặc một độ phân giải cao hơn cho văn bản nhỏ và các con số.
4. Đo lại bằng cùng chỉ số trước và sau mỗi thay đổi.

### Limits of the metric

Một bộ kiểm tra tương phản chấm độ tương tự toàn ảnh, nên nó bỏ lỡ một chữ số sai trong một mô tả còn lại khớp. Ghép nó với các kiểm tra tác vụ: phân tích các con số trong câu trả lời và so sánh chúng với một lượt nhận dạng văn bản, hoặc hỏi mô hình vùng nó đã đọc và kiểm tra vùng không trống.

## Follow-ups

- **Level 3:** Tại sao một bộ kiểm tra độc lập và không phải độ tự tin riêng của mô hình? Expected: mô hình tự tin khi ảo giác, chính là lỗi; bộ kiểm tra cho một ý kiến thứ hai không chia sẻ các điểm mù của bộ sinh.
- **Level 3:** Bạn đặt hai ngưỡng như thế nào? Expected: gắn nhãn vài trăm câu trả lời là có grounding hoặc không, quét các ngưỡng, và chọn cặp bắt phần lớn ảo giác ở một tải đánh giá nhóm có thể chi trả.
- **Level 4:** Tỷ lệ chỉ tăng cho một khách hàng. Bạn kiểm tra gì? Expected: nguồn ảnh của họ: độ phân giải, ánh sáng, một dòng sản phẩm mới có văn bản mô hình đọc sai; phép chia theo khách hàng tồn tại vì lý do đó.
- **Level 4:** Bạn quyết định giữa một thay đổi mô hình và một thay đổi định tuyến như thế nào? Expected: định tuyến rẻ và tức thì và bảo vệ người dùng hôm nay; một thay đổi mô hình cần dữ liệu có grounding và một phép đo lại; làm cả hai theo thứ tự đó và để chỉ số phân xử.

## Wrong answers

- "Tăng điểm benchmark và các ảo giác sẽ biến mất." Benchmark thưởng văn bản hợp lý; lỗi production là văn bản tự tin ảnh không hỗ trợ, điều benchmark không đo.
- "Thêm một system prompt nói không ảo giác." Mô hình không biết khi nào nó ảo giác; một prompt không tạo grounding, và chỉ một phép đo cùng một route đánh giá giảm tác hại.
- "Chặn mọi câu trả lời có độ tương tự ảnh-văn bản thấp." Độ tương tự thấp với độ tự tin thấp thường là một đáp án đúng về một ảnh khó; tín hiệu là độ tự tin cao với độ tương tự thấp.

## Taught in

[Bài học các mô hình thị giác-ngôn ngữ](../../../phases/04-computer-vision/25-vision-language-models/) định nghĩa tỷ lệ lỗi xuyên phương thức, đưa ra mã, và báo cáo kết quả production.
