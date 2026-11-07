---
id: spatial-reasoning-limit
title: A general VLM for which shelf the item is on
card: multimodal
kind: tradeoff
level: 2
roles: [forward-deployed-ai-engineer, applied-ai-engineer]
rounds: [customer, system-design]
tags: [spatial-reasoning, evaluation, vlm-limits, fine-tuning]
minutes: 10
lessons: [phases/04-computer-vision/25-vision-language-models]
manuals: []
practice: []
cheatsheet: [vlm-model-families]
related: [multimodal/vlm-three-parts]
updated: 2026-11-03
---

Một nhóm kho hàng muốn một mô hình thị giác-ngôn ngữ tổng quát trả lời "vật phẩm ở kệ nào" và "hộp nằm trên hay dưới pallet" từ các khung hình camera. Họ dự định triển khai ngay khi một demo hoạt động trên mười ảnh. Bạn nói gì với họ?

## Short answer

Các quan hệ không gian là điểm yếu của các mô hình thị giác-ngôn ngữ đa dụng hiện nay: trên các benchmark về trên và dưới, trái và phải, đếm và khoảng cách, chúng đạt khoảng 50 đến 60 phần trăm, dưới mức con người. Một demo trên mười ảnh không chứng minh gì về phân phối đó. Xây một bộ đánh giá có nhãn vài trăm khung hình với các câu hỏi chính xác trước, đo mô hình, và so sánh nó với một mô hình phát hiện hoặc độ sâu chuyên biệt có hình học box được bạn hậu xử lý; nếu mô hình tổng quát ở lại, fine-tune nó trên tác vụ và giữ một route đánh giá con người cho các câu trả lời độ tự tin thấp.

## Full answer

### Why the general model struggles

Mô hình thấy các token patch được chiếu và suy luận bằng ngôn ngữ. Nó học có gì trong một ảnh từ các cặp caption hiếm khi nói chính xác ở đâu. Con số của bài học cho các benchmark suy luận không gian là 50 đến 60 phần trăm, và các lựa chọn được khuyến nghị cho các tác vụ thuần không gian là một bộ ước lượng keypoint hoặc pose, một mô hình độ sâu, hoặc một detector với hình học box được hậu xử lý.

### What a real eval looks like

- Vài trăm khung hình từ các camera kho hàng, không phải ảnh có sẵn, với hai loại câu hỏi được viết theo cách người vận hành sẽ hỏi.
- Nhãn từ hai người, với mức đồng thuận được đo.
- Một phép chia theo ánh sáng và vị trí camera, vì các ảnh demo sẽ không bao phủ chúng.
- Một confusion matrix mỗi loại câu hỏi, không phải một con số độ chính xác.

### The alternatives

| Cách tiếp cận | Điểm mạnh | Chi phí |
|---|---|---|
| Detector cộng hình học box | trên, dưới, trái và phải chính xác trong mặt phẳng ảnh từ tọa độ | nhãn cho các lớp đối tượng; không có giao diện ngôn ngữ |
| Mô hình độ sâu cộng detector | khoảng cách và xếp chồng | hiệu chuẩn mỗi camera |
| VLM tổng quát, zero-shot | bất kỳ câu hỏi nào bằng ngôn ngữ thông thường | yếu về các quan hệ không gian; rủi ro ảo giác |
| VLM tổng quát, fine-tuned | một giao diện ngôn ngữ thông thường với miền được học | 5,000 đến 50,000 ví dụ có nhãn và nhiều giờ GPU |

### If the VLM stays

Fine-tune với các adapter hạng thấp trên các lớp attention và projector, mà bài học định cỡ ở rank 16 đến 64 trên một GPU trung tâm dữ liệu trong 2 đến 10 giờ. Sau đó theo dõi ảo giác trong production: một tỷ lệ lỗi xuyên phương thức gắn cờ các câu trả lời nơi độ tự tin văn bản cao nhưng độ tương tự ảnh-văn bản thấp, và định tuyến chúng đến đánh giá.

### What to tell them

Triển khai một hệ thống được đo, không phải một demo. Mười ảnh là một smoke test. Đánh giá quyết định giữa route detector và mô hình fine-tuned, và bộ theo dõi ảo giác ở lại bất kể route nào thắng.

## Follow-ups

- **Level 2:** Tại sao một mô hình tạo caption tốt thất bại ở đối tượng nào nằm trên? Expected: caption mô tả nội dung, không phải hình học; các cặp huấn luyện hiếm khi chứa quan hệ chính xác, và vị trí tinh mờ dần khi mô hình ngôn ngữ suy luận trên các token được chiếu.
- **Level 2:** Route detector mất gì? Expected: giao diện ngôn ngữ thông thường và từ vựng mở; nó chỉ trả lời các quan hệ bạn tính từ box, cho các lớp bạn gán nhãn.
- **Level 3:** Bộ đánh giá cần bao nhiêu khung hình, và bạn quyết định như thế nào? Expected: đủ để mỗi loại câu hỏi và mỗi điều kiện camera có hàng chục ví dụ; vài trăm tổng cộng là sàn, và bạn tăng nó nơi confusion matrix không ổn định.
- **Level 3:** Một encoder mạnh hơn thay đổi bức tranh như thế nào? Expected: các encoder tự giám sát mang nhiều đặc trưng không gian dày đặc hơn và dẫn các benchmark tập trung thị giác; đổi encoder và huấn luyện lại projector là bài tập khó của bài học cho các tác vụ này.

## Wrong answers

- "Demo hoạt động trên mười ảnh, nên nó hoạt động." Mười ảnh không thể bao phủ camera, ánh sáng hoặc các loại quan hệ; con số benchmark cho loại câu hỏi này gần tung đồng xu với một số quan hệ.
- "Một VLM lớn hơn sẽ sửa suy luận không gian." Kích thước nâng suy luận ngôn ngữ nhiều hơn hình học; lời khuyên của bài học cho các tác vụ thuần không gian là một mô hình chuyên biệt.
- "Fine-tune trên các ảnh demo." Hàng chục ví dụ không dạy gì và overfit; route fine-tuning cần hàng nghìn khung hình có nhãn và một bộ đánh giá tách biệt với chúng.

## Taught in

[Bài học các mô hình thị giác-ngôn ngữ](../../../phases/04-computer-vision/25-vision-language-models/) đưa ra con số suy luận không gian, ngân sách fine-tuning và tỷ lệ lỗi xuyên phương thức.
