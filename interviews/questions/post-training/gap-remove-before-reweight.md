---
id: gap-remove-before-reweight
title: Remove a cause of the gap before you reweight it
card: post-training
kind: tradeoff
level: 3
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth, system-design]
tags: [logprob-gap, importance-sampling, sampling-replay, fp16, miles]
minutes: 15
lessons: []
manuals: [miles-101#s-the-correction-methods, miles-101#s-lower-the-logprob-gap, miles-101#s-why-true-on-policy-is-a-contract, miles-101#s-roll-out-in-fp8, miles-101#s-why-rl-owns-an-engine]
practice: []
cheatsheet: [miles-rl]
related: [post-training/logprob-gap-at-step-zero]
updated: 2026-11-03
---

Lần chạy RL của bạn cho thấy một bất đồng ổn định giữa trainer và engine rollout về xác suất mỗi token được lấy mẫu. Một kỹ sư muốn bật ngay một cách đặt trọng số importance bị giới hạn. Một người khác nói nó là một tạo tác kernel và nên bị bỏ qua. Trình bày cách bạn quyết định, và bạn sẽ thử gì trước.

## Short answer

Khớp phương pháp với nguồn khoảng cách. Có năm nguồn: token được encode lại giữa các lượt, định tuyến expert trên một mô hình hỗn hợp, một bộ lấy mẫu cắt từ vựng, khác biệt số giữa các kernel hoặc precision, và các mẫu cũ. Ba nguồn đầu có các hiệu chỉnh loại bỏ nguyên nhân; thử chúng trước, vì một cách đặt lại trọng số như truncated importance sampling để khoảng cách nguyên và thêm variance vào gradient. Một khoảng cách phẳng trên một mô hình dense với lấy mẫu thông thường là sàn kernel của thiết lập đó; đo nó, giữ nó trong khoảng của bạn, và chỉ đặt lại trọng số phần còn lại sau khi các nguyên nhân đã hết.

## Full answer

### Two kinds of method

Một phương pháp loại bỏ một nguyên nhân khiến cả hai phía tính cùng thứ, và phần khoảng cách đó biến mất. Một phương pháp đặt lại trọng số để lại khoảng cách và thay đổi mỗi token được tính bao nhiêu trong loss. Loại bỏ các nguyên nhân trước.

| Phương pháp | Loại | Nguyên nhân |
|---|---|---|
| Sampling replay | loại bỏ | top-p và top-k chỉ cắt từ vựng ở phía engine |
| Routing replay | loại bỏ | một router mixture-of-experts chọn các expert khác nhau ở mỗi phía |
| Các session token-in, token-out | loại bỏ | các vòng đi-về văn bản giữa các lượt agent thay đổi token |
| Chế độ true on-policy | loại bỏ | tất cả khác biệt kernel, cho các mô hình và GPU nó bao phủ |
| Truncated importance sampling | đặt lại trọng số | bất kỳ khoảng cách còn lại |
| Một giới hạn tuổi mẫu | bỏ | các mẫu từ trọng số cũ hơn |

### What the manual measured

Sampling replay trên một seed giảm khoảng cách trung vị từ 0.0153 xuống 0.0135, 11.5 phần trăm. Không bước nào của lần chạy replay đạt bước thấp nhất của lần chạy thông thường, và reward giữ trong cùng khoảng. Phần bộ lấy mẫu không phải nhiễu: một lần cắt top-p tăng log xác suất của engine cho một token được giữ thêm âm log của khối lượng được giữ, ở top-p 0.9 là một độ dịch trung vị khoảng 0.053 trong một kiểm tra ngoài framework huấn luyện. Suy luận xác định không loại bỏ gì, vì nó không phải một hiệu chỉnh.

### The kernel floor

Trên một mô hình dense trong BF16 ở cả hai phía, khoảng cách của tài liệu giữ ở khoảng 0.015 mỗi token trong mọi lần chạy khỏe mạnh. Đó là sàn của một thiết lập, không phải một quy luật. Một kiểm tra với FP16 ở cả hai phía giảm khoảng cách trung vị khoảng 7.8 lần, từ 0.0073 xuống 0.00094 trên một engine phục vụ đối chiếu một lượt forward tham chiếu, và token tệ nhất giảm từ 0.355 xuống 0.033. FP16 chỉ ở một phía không giúp. Precision là một đòn bẩy loại bỏ một nguyên nhân, và nó tốn khoảng số.

### When to reweight

Truncated importance sampling đặt trọng số mỗi token bằng tỷ số xác suất trainer trên xác suất engine và giới hạn tỷ số, với `--use-tis --tis-clip 2.0` là ví dụ của tài liệu. Dùng nó cho một khoảng cách bạn không thể loại bỏ: một rollout precision thấp, nơi làm tròn FP8 không có cách sửa kernel, hoặc một mô hình hỗn hợp sau routing replay. Ghép nó với kiểm tra bước-0, để đặt lại trọng số không bao giờ giấu một lỗi thiết lập.

### How to run the comparison

Cùng seed, cùng bước, một thay đổi mỗi lần chạy, và khoảng cách được đọc ở mọi bước. Một phương pháp giúp cho thấy khoảng cách thấp hơn trên cùng các bước. Một khoảng cách tăng sau một thay đổi gọi tên nguyên nhân bạn thêm.

## Follow-ups

- **Level 3:** Tại sao một cách đặt lại trọng số thêm variance? Expected: các token có tỷ số lớn nhận trọng số lớn, nên một vài token chi phối cập nhật; giới hạn hạn chế điều đó, nhưng không loại bỏ nó.
- **Level 3:** Replay cần cả top-k và top-p được đặt. Tại sao cần top-k? Expected: framework yêu cầu top-k dương cho replay, nên một lần chạy chỉ top-p thay đổi bộ lấy mẫu mà không phát lại tập được giữ.
- **Level 4:** FP16 trên engine và BF16 trên trainer không khép khoảng cách. Tại sao? Expected: sự làm tròn riêng mỗi phía đặt một sàn; khoảng cách chỉ khép khi cả hai phía làm tròn cùng cách, nên precision phải khớp ở cả hai phía.
- **Level 4:** Khi nào chế độ chính xác từng bit là đáp án đúng, và khi nào nó không có sẵn? Expected: khi bạn cần một khoảng cách không và mô hình cùng GPU nằm trong hợp đồng của nó; nó ghim một kernel attention và các phép toán batch-invariant cho các mô hình dense cụ thể trên một thế hệ GPU, và từ chối phần còn lại.

## Wrong answers

- "Bật importance sampling trước; nó rẻ." Nó để mọi nguyên nhân nguyên vẹn, thêm variance, và giấu một lỗi thiết lập mà kiểm tra bước-0 sẽ cho thấy.
- "Khoảng cách là một tạo tác kernel, nên không bao giờ quan trọng." Phần bộ lấy mẫu đo được và loại bỏ được, và một khoảng cách tăng sau một thay đổi là một nguyên nhân bạn thêm.
- "Suy luận xác định là một phương pháp hiệu chỉnh." Nó khiến engine lặp lại chính nó và để khoảng cách ở nguyên nơi nó có; bốn lần chạy của tài liệu cho thấy cùng khoảng cách khi bật và tắt nó.

## Taught in

[Phần 8.2 của Miles 101](../../../manuals/miles-101/sections/8-2-the-correction-methods.md) khớp mỗi hiệu chỉnh với nguyên nhân, [phần 4.4](../../../manuals/miles-101/sections/4-4-lower-the-logprob-gap.md) đo sampling replay, và [phần 8.3](../../../manuals/miles-101/sections/8-3-why-true-on-policy-is-a-contract.md) đo đòn bẩy precision.
