---
id: hidden-state-drafts
title: Why a draft that reads hidden states accepts more
card: tokenization-decoding
kind: concept
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, design-review]
tags: [speculative-decoding, eagle, draft-model, tree-attention, exposure-bias]
minutes: 10
lessons: [phases/10-llms-from-scratch/15-speculative-decoding-eagle3, phases/10-llms-from-scratch/25-speculative-decoding, phases/07-transformers-deep-dive/16-speculative-decoding, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding]
manuals: []
practice: []
cheatsheet: [speculative-decoding]
related: [tokenization-decoding/speedup-from-alpha]
updated: 2026-11-03
---

Trình bày tuyến phát triển từ một mô hình draft nhỏ riêng biệt tới thế hệ draft trạng thái ẩn hiện tại. Mỗi bước loại bỏ giới hạn nào, và tại sao đưa các feature nội bộ của bộ xác minh cho draft giúp nhiều đến vậy?

## Short answer

Một mô hình nhỏ riêng biệt cùng họ chấp nhận khoảng 0.6 token, vì phân phối của nó trôi khỏi bộ xác minh. Draft trạng thái ẩn đầu tiên thay nó bằng một mạng một hoặc hai lớp đọc các feature lớp cuối của bộ xác minh, nên draft bắt đầu từ biểu diễn riêng của bộ xác minh và sự chấp nhận tăng lên 0.7 đến 0.8. Thế hệ thứ hai đề xuất một cây ứng viên và xác minh mọi nhánh trong một lượt với một attention mask dạng cây, nâng sự chấp nhận theo từng token đường được chấp nhận lên trên 0.85. Thế hệ thứ ba bỏ loss khớp feature, huấn luyện trên dự đoán token trực tiếp, và đưa các đầu ra trước của chính draft cho nó trong huấn luyện, loại exposure bias và đạt 0.88 đến 0.92.

## Full answer

### The progression

| Thế hệ | Draft | Sự chấp nhận | Chi phí huấn luyện |
|---|---|---|---|
| Mô hình nhỏ riêng biệt | một mô hình nhỏ hơn được huấn luyện độc lập | 0.55 đến 0.70 | không có |
| Các head thêm trên bộ xác minh | nhiều head đầu ra dự đoán các vị trí phía trước | 0.65 đến 0.75 | khoảng 1B token có giám sát |
| Draft trạng thái ẩn đầu tiên | một lớp transformer trên trạng thái ẩn cuối của bộ xác minh | 0.70 đến 0.80 | khoảng 60B token |
| Cây draft động | tương tự cộng một cây ứng viên | 0.80 đến 0.88 | khoảng 60B token |
| Các feature nhiều lớp cộng kiểm thử lúc huấn luyện | hợp nhất nhiều lớp bộ xác minh; được huấn luyện trên các đầu ra riêng | 0.88 đến 0.92 | khoảng 60 đến 200B token |

### Why the hidden state helps

Một draft riêng suy ra lại từ các token thô những gì bộ xác minh đã tính. Trạng thái ẩn cuối của bộ xác minh ở vị trí t là một bản tóm tắt phong phú của tiền tố, và một mạng rất nhỏ đọc nó dự đoán token tiếp theo của bộ xác minh tốt hơn nhiều một mô hình nhỏ chỉ đọc các id token. Draft trở thành một bên đọc bộ xác minh thay vì một bản bắt chước.

### What the tree adds

Một chuỗi draft tuyến tính chết ở lần trượt đầu. Một cây đề xuất nhiều ứng viên ở mỗi độ sâu, mở rộng ở nơi draft không chắc và giữ hẹp ở nơi nó tự tin, và bộ xác minh chấm mọi nút trong một lượt truyền xuôi với một mask chỉ cho mỗi nút chú ý tới các tổ tiên. Đường được chấp nhận dài nhất thắng. Chi phí xác minh hầu như không dịch chuyển, vì vẫn là một lượt truyền xuôi.

### What the third generation fixes

Các draft trạng thái ẩn trước được huấn luyện để khớp các feature của bộ xác minh, giới hạn mức dữ liệu thêm có thể giúp. Thế hệ thứ ba huấn luyện trên dự đoán token trực tiếp, và trong huấn luyện nó đưa các dự đoán trước của chính draft cho nó qua nhiều bước, theo cách nó chạy ở suy luận. Điều đó căn chỉnh các đầu vào huấn luyện với các đầu vào suy luận và dừng tích lũy lỗi, cùng cách sửa mà scheduled sampling đã cho các mô hình chuỗi. Bài báo báo cáo tới 6.5 lần đầu cuối trên chat và một mức tăng thông lượng 38 phần trăm ở batch 64 trên một engine production.

### The draft is only as good as its traffic

Một draft head đa dụng được huấn luyện trên dữ liệu chat giảm xuống mức chấp nhận 0.4 đến 0.6 trên lưu lượng mã, y tế hoặc pháp lý. Một head riêng theo lĩnh vực khôi phục nó, và huấn luyện một head là một công việc nhẹ so với fine-tuning bộ xác minh.

## Follow-ups

- **Level 3:** Tại sao khớp các feature của bộ xác minh giới hạn các thế hệ đầu? Expected: loss feature yêu cầu draft tái tạo các trạng thái ẩn thay vì dự đoán token, nên nhiều dữ liệu huấn luyện hơn ngừng giúp; thế hệ thứ ba huấn luyện trên token.
- **Level 3:** Exposure bias trong bối cảnh này là gì? Expected: draft được huấn luyện trên các đầu vào bộ xác minh teacher-forced và chạy trên các đầu ra riêng; sự không khớp tích lũy qua các bước draft.
- **Level 4:** Cây tốn gì? Expected: một attention mask không nhân quả đi theo cấu trúc cây, các key và value được lưu thêm cho các nút cây, và độ phức tạp bộ lập lịch; bộ xác minh vẫn chạy một lần.
- **Level 4:** Bạn so thiết kế các head thêm với draft trạng thái ẩn bằng cách nào? Expected: không có mô hình thứ hai để triển khai và phục vụ đơn giản hơn, đổi lấy sự chấp nhận thấp hơn phần nào và một giai đoạn fine-tuning có giám sát trên bộ xác minh.

## Wrong answers

- "Một mô hình draft riêng lớn hơn là đòn bẩy chính." Căn chỉnh với bộ xác minh quan trọng hơn kích thước; một draft một lớp trên các trạng thái ẩn đánh bại một mô hình độc lập lớn hơn xa.
- "Draft trạng thái ẩn thay đổi phân phối đầu ra của bộ xác minh để tăng sự chấp nhận." Quy tắc từ chối giữ đầu ra chính xác; draft chỉ thay đổi mức thường xuyên nó đúng.
- "Một cây cần một lượt bộ xác minh mỗi nhánh." Mọi nhánh được xác minh trong một lượt dưới mask cây.

## Taught in

[Bài học EAGLE-3](../../../phases/10-llms-from-scratch/15-speculative-decoding-eagle3/) trình bày sự phát triển và kiểm thử lúc huấn luyện, [bài học giải mã suy đoán Phase 10](../../../phases/10-llms-from-scratch/25-speculative-decoding/) giải thích dùng lại feature và xác minh cây, [bài học Phase 7](../../../phases/07-transformers-deep-dive/16-speculative-decoding/) giới thiệu các họ draft, và [bài học EAGLE-3 production](../../../phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/) bao phủ drift lĩnh vực.
