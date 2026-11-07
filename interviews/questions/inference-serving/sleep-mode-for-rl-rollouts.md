---
id: sleep-mode-for-rl-rollouts
title: Sleep, wake and weight updates for an RL loop
card: inference-serving
kind: concept
level: 2
roles: [inference-engineer]
rounds: [ml-depth, system-design]
tags: [sleep-mode, rl-rollout, weight-update, logprobs, dev-mode]
minutes: 8
lessons: []
manuals: [vllm-101#s-use-vllm-as-an-rl-rollout-engine]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Trainer RL của bạn chia sẻ các GPU của nó với máy chủ vLLM sinh rollout. Giữa các bước rollout, trainer cần lấy lại bộ nhớ GPU, và sau mỗi bước máy chủ cần các trọng số mới. vLLM cung cấp gì cho vòng lặp này, và điều gì có thể gặp trục trặc ở phiên bản được ghim?

## Short answer

vLLM có các route chế độ phát triển cho vòng lặp: chế độ ngủ giải phóng bộ nhớ GPU trên `/sleep` và lấy lại trên `/wake_up`, `/pause` và `/resume` dừng và khởi động lại việc sinh, và một lần truyền trọng số chạy qua `/init_weight_transfer_engine`, `/start_weight_update` và `/finish_weight_update`, qua NCCL giữa các GPU hoặc qua các handle bộ nhớ CUDA trên một máy. Ở mức 1, chế độ ngủ giữ trọng số, và ở mức 2 nó bỏ cả trọng số, phù hợp với một bước mà trainer dù sao cũng gửi trọng số mới. Có ba vấn đề đã biết ở 0.31.0: đánh thức mức 2 không nạp lại bản nháp speculative, ngủ mức 2 xóa các scale KV đã hiệu chuẩn, và cập nhật trọng số trong khi ngủ làm engine dừng, nên đánh thức trước, nạp lại, đặt lại prefix cache và đọc các bộ đếm chấp nhận.

## Full answer

### The loop

Một bước RL có hai nửa. Nửa rollout sinh các câu trả lời với trọng số hiện tại. Nửa huấn luyện tính một loss và cập nhật trọng số, và bộ sinh cần trọng số mới trước rollout tiếp theo. Trên một tập GPU, hai nửa thay phiên nhau trên cùng bộ nhớ, nên bộ sinh phải trả bộ nhớ trong khi huấn luyện và lấy lại sau đó.

### The pieces

Tất cả các route này chỉ tồn tại khi máy chủ khởi động với `VLLM_SERVER_DEV_MODE=1`. Chúng giải phóng bộ nhớ, thay trọng số và chạy các phương thức trên mọi worker, nên không bao giờ đưa một máy chủ ở chế độ này ra ngoài mạng của trainer; bind nó vào local host khi bạn thử bằng tay.

- **Chế độ ngủ.** Khởi động với `--enable-sleep-mode`. `/sleep?level=1` giải phóng KV cache và bộ nhớ khác và giữ trọng số; mức 2 bỏ cả trọng số. `--sleep-preserve-parameter-names` giữ các trọng số đóng băng trên GPU để chúng không di chuyển mỗi bước. `/is_sleeping` báo cáo trạng thái.
- **Tạm dừng và tiếp tục.** `/pause` dừng việc sinh mới và có thể hủy các yêu cầu đang chạy, chờ chúng hoặc giữ chúng; `/resume` bắt đầu lại.
- **Cập nhật trọng số.** Trainer bắt đầu một lần truyền, gọi start, gửi trọng số, gọi finish, và ghi phiên bản bằng `/update_weight_version` để các rollout tiếp theo được gắn nhãn.
- **Các lời gọi tập thể.** `/collective_rpc` chạy một phương thức trên mọi worker, cho thiết lập mà vLLM không bao quát.
- **Khởi chạy bên ngoài.** Với backend launcher bên ngoài, một launcher như torchrun khởi động các worker vLLM bên trong các tiến trình của trainer.

### What the manual saw

Một lần ngủ mức 1 với Qwen3-0.6B trên L4: mỗi POST trả về 200 với body trống, lần ngủ mất 1.9 s, bộ nhớ GPU giảm từ 14,861 xuống 4,245 MiB và trở lại sau khi đánh thức, và dòng log ghi `Sleep mode freed 10.37 GiB memory`. Đó là thời gian duy nhất tài liệu có; một lần ngủ mức 2 và một lần cập nhật trọng số không được đo thời gian.

### What can go wrong at 0.31.0

- Đánh thức mức 2 không nạp lại một bản nháp speculative. Việc nạp lại chỉ bao gồm mô hình đích, nên mô hình đích từ chối mọi token nháp và decode giảm xuống khoảng tốc độ khi không có speculation. Đầu ra vẫn đúng và không có lỗi xuất hiện. Issue đang mở.
- Ngủ mức 2 xóa các scale KV đã hiệu chuẩn trên một số checkpoint có cache FP8. Yêu cầu đầu tiên sau khi nạp lại trả về logprobs NaN và một token đầu tiên sai. Bản phát hành tiếp theo sửa điều này.
- Một cập nhật trọng số trong khi ngủ gây segfault cho engine. Máy chủ API vẫn hoạt động và mọi yêu cầu sau đó thất bại. Issue đang mở.

Vì vậy sau mỗi lần đánh thức mức 2, nạp lại trọng số, đặt lại prefix cache và đọc các bộ đếm chấp nhận speculative. Nạp lại không khôi phục các scale KV đã bị xóa ở 0.31.0; bản phát hành 0.32.0 sửa trường hợp đó. Luôn đánh thức máy chủ trước khi trainer gửi trọng số.

### The logprob gap

Trainer so sánh các logprobs mà máy chủ trả về với những logprobs nó tự tính. Chúng không bao giờ khớp chính xác, vì các kernel khác nhau; một khoảng cách nhỏ ổn định là bình thường, và một khoảng cách tăng dần có nghĩa trọng số chưa đến bộ sinh. Kiểm tra giá trị nào máy chủ trả về trước. `--logprobs-mode raw_logprobs`, mặc định, cho logprob trên toàn bộ từ vựng; `processed_logprobs` cho nó sau khi các thiết lập lấy mẫu thay đổi phân phối. Với top-p 0.9, chế độ raw khớp một tham chiếu toàn từ vựng với khoảng cách tuyệt đối trung vị là 0.005, và chế độ processed cao hơn bằng âm log của khối lượng được giữ, một độ dịch trung vị khoảng 0.053. Khớp chế độ với cách trainer chấm điểm token.

## Follow-ups

- **Level 2:** Sự khác biệt giữa hai mức ngủ là gì? Expected: mức 1 giải phóng KV cache và bộ nhớ khác và giữ trọng số; mức 2 bỏ cả trọng số, phù hợp với một bước mà trọng số mới dù sao cũng đến và tốn một lần nạp lại.
- **Level 3:** Sau một lần đánh thức mức 2, đầu ra đúng nhưng decode chạy chậm như khi không có speculation. Tại sao? Expected: việc nạp lại trọng số chỉ bao gồm mô hình đích, nên bản nháp không được nạp lại và mô hình đích từ chối mọi token nháp; không có lỗi xuất hiện, và các bộ đếm chấp nhận cho thấy điều đó.
- **Level 3:** Logprobs của trainer khác với của máy chủ trên mọi token. Có phải bug không? Expected: một khoảng cách nhỏ ổn định là bình thường vì các kernel khác nhau, tuyệt đối trung vị 0.005 với raw logprobs; một khoảng cách tăng dần có nghĩa trọng số chưa đến, và một độ lệch hằng gần log của khối lượng được giữ có nghĩa máy chủ trả về processed logprobs dưới top-p trong khi trainer chấm điểm toàn bộ từ vựng.
- **Level 4:** Sắp thứ tự các bước của một vòng lặp RL quanh các route này. Expected: tạm dừng hoặc đợi việc sinh hoàn tất, ngủ, huấn luyện, đánh thức, rồi bắt đầu và hoàn tất cập nhật trọng số và ghi phiên bản, đặt lại prefix cache, nạp lại bản nháp nếu speculation được bật, đọc các bộ đếm chấp nhận, tiếp tục; không bao giờ gửi trọng số trong khi máy chủ ngủ, vì điều đó làm engine dừng.

## Wrong answers

- "Đưa các route ngủ và trọng số ra cổng công khai." Chúng chỉ tồn tại trong chế độ phát triển, và chúng giải phóng bộ nhớ, thay trọng số và chạy các phương thức trên mọi worker; giữ chúng trên mạng của trainer, bind vào local host khi bạn kiểm thử bằng tay.
- "Gửi trọng số mới trong khi máy chủ ngủ để tiết kiệm thời gian." Ở 0.31.0 điều đó gây segfault cho engine; máy chủ API vẫn hoạt động và mọi yêu cầu sau đó thất bại, nên luôn đánh thức trước khi trainer gửi trọng số.
- "Logprobs từ máy chủ và trainer phải khớp chính xác." Các kernel khác nhau, nên một khoảng cách nhỏ ổn định là bình thường; theo dõi nó mỗi bước và xem một khoảng cách tăng dần là dấu hiệu trọng số chưa đến bộ sinh.
- "Đánh thức mức 2 khôi phục máy chủ về trạng thái trước khi ngủ." Nó chỉ nạp lại trọng số đích; bản nháp speculative không được nạp lại và các scale KV đã hiệu chuẩn bị xóa trên một số checkpoint, nên nạp lại, đặt lại cache và đọc tỷ lệ chấp nhận sau mỗi lần đánh thức mức 2, và ở 0.31.0 việc nạp lại không khôi phục các scale.

## Taught in

[Dùng vLLM làm engine rollout RL](../../../manuals/vllm-101/sections/3-9-use-vllm-as-an-rl-rollout-engine.md) liệt kê các route, kiểm tra ngủ và các vấn đề đã biết.
