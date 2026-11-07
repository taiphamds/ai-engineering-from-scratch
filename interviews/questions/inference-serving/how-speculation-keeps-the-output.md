---
id: how-speculation-keeps-the-output
title: How speculative decoding keeps the output the same
card: inference-serving
kind: concept
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, screen]
tags: [speculative-decoding, eagle3, ngram, acceptance, rejection-sampling]
minutes: 8
lessons: [phases/17-infrastructure-and-production/05-eagle3-speculative-decoding]
manuals: [vllm-101#s-how-speculative-decoding-checks-drafts, sglang-101#s-speculative-decoding, vllm-101#s-use-n-gram-speculation-for-copy-heavy-work]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Speculative decoding hứa hẹn vài token mỗi bước mà không thay đổi những gì mô hình viết. Giải thích cách engine giữ lời hứa đó, mức tăng tốc đến từ đâu, và tại sao mức tăng giảm khi có nhiều người dùng hơn cùng chia sẻ máy chủ.

## Short answer

Một bộ đề xuất ít tốn kém đoán vài token tiếp theo, và mô hình đích chạy một lần trên tất cả các dự đoán và tính phân phối riêng của nó tại mỗi vị trí. Một bộ lấy mẫu loại bỏ giữ mỗi dự đoán được mô hình đích hỗ trợ, lấy mẫu một token đúng từ mô hình đích tại lần loại bỏ đầu tiên, rồi dừng, nên một lượt chạy cho ít nhất một token và nhiều nhất bằng số dự đoán cộng một, với cùng phân phối đầu ra như decoding thông thường. Mức tăng đến từ thời gian GPU nhàn rỗi: một batch decode nhỏ chờ bộ nhớ, và khi batch tăng thì thời gian nhàn rỗi đó biến mất, nên các lần kiểm tra dự đoán bị loại bắt đầu tốn tính toán thực sự.

## Full answer

### Guess, then check

Một bước decode trên một batch nhỏ đọc tất cả trọng số để tạo một token cho mỗi yêu cầu, và phần lớn GPU nhàn rỗi trong khi chờ bộ nhớ. Speculation dùng thời gian nhàn rỗi đó. Với lấy mẫu tham lam, một dự đoán chỉ được giữ nếu nó bằng token đứng đầu của mô hình đích tại vị trí đó. Với lấy mẫu ngẫu nhiên, quy tắc loại bỏ giữ phân phối đầu ra bằng phân phối của mô hình đích. Trong SGLang, các ngưỡng chấp nhận mặc định là 1.0, nên một yêu cầu tham lam tạo ra cùng những token mà nó sẽ tạo khi không có speculation.

Độ dài chấp nhận là số token được chốt mỗi lượt xác minh: các bản nháp được chấp nhận cộng một token thưởng từ mô hình đích. Một yêu cầu Qwen3-8B thực trên L4 của chúng tôi đạt khoảng 1.8 token mỗi lượt.

### The proposers

| Phương pháp | Các dự đoán đến từ đâu |
|---|---|
| `ngram` | văn bản trước đó trong cùng yêu cầu khớp với vài token cuối |
| `suffix` | một cây hậu tố trên các prompt và câu trả lời trước đó |
| `eagle`, `eagle3` | một đầu nháp nhỏ đọc các trạng thái ẩn của mô hình đích |
| `*_mtp` | các đầu dự đoán bổ sung đi kèm một số mô hình |
| `draft_model` | một mô hình nhỏ riêng biệt |

N-gram gần như không tốn gì và không cần thêm trọng số. Nó có lợi khi câu trả lời sao chép prompt: một lần chỉnh sửa tài liệu, một bản tóm tắt trích dẫn nguồn, một thay đổi mã giữ lại phần lớn các dòng, trích xuất từ đầu vào dài. Trên L4 của chúng tôi với prompt ngẫu nhiên, nó giảm thời gian mỗi token từ 241.7 xuống 76.6 ms ở một người dùng, và ở bốn người dùng, P99 ITL tăng từ 290 lên 1,691 ms. Nó cũng tắt lập lịch bất đồng bộ, chỉ với một cảnh báo trong log. Một đầu EAGLE3 cần được huấn luyện cho mô hình đích của bạn; đầu công khai cho Qwen3-8B có một lớp và một từ vựng nháp gồm 32,000 token.

### Why the gain falls with load

Thời gian nhàn rỗi chỉ tồn tại khi bước đó đọc bộ nhớ nhiều hơn lượng nó tính toán. Khi batch tăng, bước đó thực hiện nhiều tính toán hơn cho mỗi byte, và thời gian nhàn rỗi biến mất. Các lần kiểm tra dự đoán bị loại khi đó tốn tính toán thực sự. Một báo cáo cho thấy cả hai đầu trên cùng GPU và mô hình: ở batch 1, đầu ra tăng từ 42.0 lên 92.5 token mỗi giây, và ở mức đồng thời 20 nó giảm từ 217.8 xuống 164.4. Câu trả lời của người bảo trì là speculation dành cho các batch nhỏ. Chế độ động tuân theo quy tắc này: nó đặt số dự đoán theo kích thước batch và ngừng đoán với các batch lớn.

### The lesson's arithmetic

Số token kỳ vọng mỗi lượt forward của mô hình đích là 1 + K x alpha, với K là độ dài nháp và alpha là tỷ lệ chấp nhận. Với K bằng 5 và alpha bằng 0.7, với khoảng 10 phần trăm chi phí xác minh bổ sung, đó là 4.5 chia cho 1.1, khoảng 4.1 lần. Mức tăng thực tế tập trung quanh 2 đến 3 lần, vì alpha hiếm khi cao như vậy trên lưu lượng production và chi phí bổ sung tăng theo batch. Bài học đặt alpha hòa vốn ở mức đồng thời cao gần 0.45 đến 0.55.

### What to watch

Engine xuất các token được đề xuất và được chấp nhận. Chia số được chấp nhận cho số được đề xuất để có tỷ lệ chấp nhận, và đọc số token trung bình mỗi bước. Tỷ lệ chấp nhận cao mà thời gian mỗi token không cải thiện có nghĩa là batch đã bị giới hạn bởi tính toán.

## Follow-ups

- **Level 2:** Bộ đề xuất nào không cần mô hình bổ sung, và khi nào nó có lợi? Expected: n-gram, khớp các token cuối của đầu ra với văn bản trước đó trong yêu cầu; nó có lợi cho chỉnh sửa, trích dẫn, thay đổi mã và trích xuất, và thất bại với chat mở.
- **Level 3:** Tỷ lệ chấp nhận cao nhưng thời gian mỗi token không giảm. Điều đó cho bạn biết gì? Expected: batch đã bị giới hạn bởi tính toán; thời gian chờ bộ nhớ nhàn rỗi mà speculation sử dụng đã biến mất, nên các lần kiểm tra tốn bằng lượng chúng tiết kiệm.
- **Level 3:** Với lấy mẫu tham lam, lần kiểm tra quyết định ở mỗi vị trí như thế nào? Expected: một dự đoán chỉ được giữ nếu nó bằng token đứng đầu của mô hình đích ở đó; lần không khớp đầu tiên được thay bằng token của mô hình đích và phần còn lại bị bỏ.
- **Level 4:** Tại sao một lượt xác minh không bao giờ có thể chốt nhiều token hơn độ dài nháp cộng một? Expected: mô hình đích tính một phân phối tại mỗi vị trí nháp và một vị trí sau dự đoán cuối, nên khi tất cả dự đoán đều qua, bộ lấy mẫu vẫn rút một token thưởng từ phân phối cuối đó; tại một lần loại bỏ nó lấy mẫu một token đúng ở đó và dừng.

## Wrong answers

- "Speculation thay đổi đầu ra một chút, nên bạn đánh đổi một ít chất lượng để lấy tốc độ." Với lấy mẫu tham lam, một dự đoán chỉ được giữ nếu nó bằng token đứng đầu của mô hình đích, và với lấy mẫu ngẫu nhiên, quy tắc loại bỏ giữ phân phối đầu ra bằng phân phối của mô hình đích, nên chất lượng không thay đổi, dù một lần chạy lấy mẫu có thể khác một lần chạy không có speculation.
- "Bản nháp là nơi tốc độ đến từ đó, nên một bản nháp nhanh hơn luôn có ích." Mức tăng đến từ thời gian GPU nhàn rỗi trong một batch nhỏ; một bản nháp nhanh với tỷ lệ chấp nhận thấp thêm các lần kiểm tra tốn tính toán, và ở mức đồng thời 20, một báo cáo mất một phần tư thông lượng.
- "Cũng bật nó cho kiểm thử căng thẳng." Ở batch 1, một báo cáo tăng tốc hơn gấp đôi và ở mức đồng thời 20 nó chậm hơn; câu trả lời của người bảo trì là speculation dành cho các batch nhỏ.

## Taught in

[Cách speculative decoding kiểm tra các bản nháp](../../../manuals/vllm-101/sections/8-7-how-speculative-decoding-checks-drafts.md) và [phần speculative decoding của SGLang](../../../manuals/sglang-101/sections/4-4-speculative-decoding.md) giải thích quy tắc, [phần n-gram](../../../manuals/vllm-101/sections/4-2-use-n-gram-speculation-for-copy-heavy-work.md) đo bộ đề xuất miễn phí, và [bài học EAGLE-3](../../../phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/docs/en.md) đưa ra phép tính chấp nhận.
