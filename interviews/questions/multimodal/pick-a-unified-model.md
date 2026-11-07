---
id: pick-a-unified-model
title: One open model to answer, edit and generate
card: multimodal
kind: design
level: 4
roles: [applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design]
tags: [unified-models, image-editing, latency, open-weights]
minutes: 15
lessons: [phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion, phases/12-multimodal-ai/12-emu3-next-token-for-generation, phases/12-multimodal-ai/11-chameleon-early-fusion-tokens]
manuals: []
practice: []
cheatsheet: [unified-multimodal]
related: [multimodal/show-o-parallel-decoding, multimodal/vq-tokenizer-ceiling]
updated: 2026-11-03
---

Một công cụ thiết kế muốn triển khai, với trọng số mở nó có thể tự host, một mô hình trả lời các câu hỏi về ảnh của người dùng, chỉnh sửa một vùng của ảnh theo yêu cầu, và sinh một ảnh mới từ văn bản. Độ trễ mỗi ảnh phải giữ ở giây, không phải phút. Trình bày các họ bạn sẽ cân nhắc, chọn một, và nêu kiểm thử khiến bạn đổi lựa chọn.

## Short answer

Ba họ mở bao phủ hiểu và sinh trong một mô hình: dự đoán next-token trên mã rời rạc, làm mọi thứ với một loss nhưng dùng một lượt mỗi mã và nhiều phút mỗi ảnh; các patch liên tục với một diffusion loss cạnh text loss, cho độ trung thực tốt nhất trong khoảng 20 lượt nhưng huấn luyện hai loss; và decoding rời rạc có mask, giữ một loss, lấp một ảnh trong khoảng 16 lượt, và có chỉnh sửa vùng miễn phí từ mục tiêu masking của nó. Với một công cụ cần chỉnh sửa và độ trễ mức giây với trọng số mở, bắt đầu với họ rời rạc có mask. Đổi lựa chọn nếu một đánh giá độ trung thực trên các prompt riêng cho thấy trần bộ lượng tử hóa gây hại, hoặc nếu ngân sách độ trễ không trả được mười sáu lượt đầy đủ; họ liên tục hai loss khi đó tiếp quản, với chỉnh sửa thực hiện qua khử nhiễu có điều kiện của vùng.

## Full answer

### The requirements, mapped

| Yêu cầu | Next-token trên mã | Liên tục hai loss | Rời rạc có mask |
|---|---|---|---|
| Hỏi đáp thị giác | có | có | có |
| Chỉnh sửa vùng | có thể, chậm: sinh lại mã | có thể qua khử nhiễu có điều kiện | có sẵn: mask các mã của vùng |
| Văn bản thành ảnh | có, nhiều phút mỗi ảnh | có, khoảng 20 lượt | có, khoảng 16 lượt |
| Huấn luyện | một loss | hai loss để cân bằng | một cross-entropy trên các vị trí bị mask |
| Trần độ trung thực | bộ lượng tử hóa, ở 30.5 dB trong tham chiếu tốt nhất | không có bộ lượng tử hóa, khoảng 32 dB trở lên | bộ lượng tử hóa |
| Trọng số mở để host | có | có | có |

### Why masked discrete first

Chỉnh sửa là tính năng phân biệt sản phẩm, và mục tiêu có mask chính là chỉnh sửa: mask một vùng, giữ phần còn lại, thêm prompt, dự đoán. Một độ trễ ở mức thấp của hàng chục lượt vừa một ngân sách giây. Một loss có nghĩa một công thức huấn luyện để vận hành. Mô hình mở tham chiếu cung cấp sinh văn bản, hỏi đáp, văn bản thành ảnh và inpainting từ một checkpoint.

### Why not the other two first

Next-token trên mã dùng hàng nghìn lượt mỗi ảnh; tham chiếu đặt một ảnh 512 nhân 512 ở khoảng 2 phút với tốc độ decode điển hình, và một chỉnh sửa vùng có nghĩa sinh lại các mã tuần tự. Thiết kế liên tục có độ trung thực tốt nhất và không có trần bộ lượng tử hóa, nhưng hai loss trên các thang khác nhau cần một cuộc tìm kiếm trọng số, và chỉnh sửa cần một bộ lấy mẫu khử nhiễu có điều kiện bạn tự xây.

### The eval that decides

1. Độ trung thực: tập prompt riêng của bạn, được đánh giá đối chiếu tham chiếu liên tục ở số lượt khớp nhau; nếu trần bộ lượng tử hóa xuất hiện, như mất kết cấu tinh hoặc văn bản trong ảnh không đọc được, lựa chọn thay đổi.
2. Chất lượng chỉnh sửa: các chỉnh sửa vùng bị mask được đánh giá về chất lượng đường nối và tuân thủ prompt.
3. Độ trễ ở độ phân giải và số lượt của bạn trên phần cứng của bạn; mười sáu lượt đầy đủ của một transformer lớn vẫn có thể vượt một ngân sách.
4. Hiểu: bộ đánh giá hỏi đáp bạn đã chạy, vì mô hình thống nhất không được tụt sau mô hình adapter nó thay thế.

### Operational notes

Giữ tokenizer cố định và quản lý phiên bản nó cùng mô hình; một thay đổi tokenizer làm mất hiệu lực mọi mã đã lưu. Ghi log lịch trình mask và số lượt như các tham số triển khai, vì chúng đánh đổi độ trễ lấy chất lượng lúc phục vụ mà không huấn luyện lại.

## Follow-ups

- **Level 3:** Mục tiêu có mask cho miễn phí tác vụ nào trong ba tác vụ, và tại sao? Expected: chỉnh sửa vùng; huấn luyện dự đoán các mã bị mask từ phần còn lại, là điều một chỉnh sửa yêu cầu.
- **Level 4:** Bạn làm một chỉnh sửa vùng trong thiết kế liên tục như thế nào? Expected: giữ các patch ngoài vùng cố định qua các bước khử nhiễu và chỉ khử nhiễu vùng, được điều kiện hóa trên văn bản và ngữ cảnh; nó hoạt động, nhưng là một bộ lấy mẫu bạn viết, không phải một mục tiêu huấn luyện.
- **Level 4:** Tại sao số lượt trở thành một tham số phục vụ trong thiết kế có mask? Expected: nhiều lượt hơn chốt ít mã hơn mỗi lượt và tăng chất lượng, ít lượt hơn giảm độ trễ; lịch trình được đặt lúc suy luận, nên sản phẩm có thể đánh đổi chúng mỗi yêu cầu.
- **Level 4:** Phép đo đơn lẻ nào cho bạn biết bộ lượng tử hóa là nút thắt? Expected: tái dựng của tokenizer trên các ảnh thực của bạn; nếu tái dựng đã mất chi tiết người dùng quan tâm, không bộ sinh nào trên các mã đó có thể khôi phục nó.

## Wrong answers

- "Triển khai mô hình next-token; một loss, một stack, không thỏa hiệp." Nhiều phút mỗi ảnh ở tốc độ decode tham chiếu phá yêu cầu độ trễ, và một chỉnh sửa vùng sinh lại mã tuần tự.
- "Độ trung thực quyết định, nên lấy thiết kế liên tục." Độ trung thực là một yêu cầu; chỉnh sửa và tính đơn giản vận hành nghiêng về thiết kế có mask đến khi một đánh giá cho thấy trần gây hại.
- "Chọn mô hình có điểm benchmark tốt nhất." Sản phẩm cần ba tác vụ, một đường chỉnh sửa và một ngân sách độ trễ; một benchmark nhiều nhất bao phủ một trong những điều đó.

## Taught in

[Bài học Show-o](../../../phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/) đặt ba họ và nêu các tác vụ một checkpoint bao phủ, [bài học Transfusion](../../../phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/) đưa ra thiết kế liên tục, và [bài học Emu3](../../../phases/12-multimodal-ai/12-emu3-next-token-for-generation/) đưa ra chi phí mỗi mã của sinh next-token.
