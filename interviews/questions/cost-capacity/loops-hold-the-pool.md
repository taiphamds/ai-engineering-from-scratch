---
id: loops-hold-the-pool
title: A few endless answers fill the pool for everyone
card: cost-capacity
kind: debug
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [debugging, ml-depth]
tags: [kv-pool, output-cap, graceful-shutdown, capacity]
minutes: 12
lessons: []
manuals: [sglang-101#s-operating-sglang, vllm-101#s-watch-vllm-in-production]
practice: []
cheatsheet: [sglang-serving, serving-engines-compared]
related: [cost-capacity/size-the-pool-from-peak, cost-capacity/autoscale-on-the-right-signal]
updated: 2026-11-03
---

Một máy chủ tự lưu trữ cho thấy KV pool của nó gần đầy trong nhiều giờ trong khi tốc độ request bình thường. Một vài request đã sinh trong nhiều phút mỗi request, và những người dùng phía sau các request khác chờ. Điều gì đang xảy ra, và bạn thay đổi gì tối nay và ngày mai?

## Short answer

Một số ít request đang trong một vòng lặp sinh. Mọi token của một request đang chạy ở lại pool cho đến khi request kết thúc, vì vậy một request không bao giờ dừng tăng lên cho đến khi nó lấn chỗ phần còn lại. Tối nay, giới hạn độ dài đầu ra để mọi request kết thúc, và thêm một presence penalty cho các workload bị lặp. Ngày mai, đặt thời gian ân hạn tắt từ giới hạn mới, vì một request chạy đến giới hạn quyết định một lần khởi động lại có trật tự mất bao lâu.

## Full answer

### The mechanism

Pool giữ các key và value của mọi token của mọi request đang chạy. Một request trong một vòng lặp tiếp tục sinh, vì vậy nó tiếp tục lấy các vị trí cho đến khi đạt giới hạn đầu ra hoặc độ dài ngữ cảnh. Không có giới hạn, một request bị lặp có thể giữ một tỷ lệ lớn của pool cho toàn bộ ngữ cảnh, và các request mới chờ hoặc các request đang chạy bị rút lại.

### A production report with the same shape

Tài liệu SGLang tóm tắt một dịch vụ học thuật đã phục vụ một trăm tỷ token và gặp các vòng lặp mô hình giữ KV cache. Lưu lượng của họ đến từ các công cụ lập trình agentic, với prompt trung vị 2,179 token và phân vị thứ 95 là 99,746 token. Cách sửa của họ thuộc vận hành, không phải một kernel: một giới hạn đầu ra 32K token và một presence penalty cho các workload bị lặp. Lời khuyên của tài liệu là đọc một báo cáo như vậy để biết thứ tự các cách sửa của nó, và dịch vụ đó giới hạn đầu ra trước khi điều chỉnh bất cứ thứ gì khác.

### Read the metrics

Bảng cảnh báo của tài liệu vLLM có mẫu này: mức sử dụng cache trên 0.95 trong hơn một phút, các request đang chờ trên không, và một preemption rate trên không. Quy tắc ghép cặp của nó nêu nguyên nhân: các lần preemption với các câu trả lời dài nghĩa là các request đang chạy tăng lên cho đến khi pool cạn. Các cách sửa nó liệt kê là mức đồng thời thấp hơn hoặc một FP8 KV cache, và giới hạn đầu ra là thứ biến các câu trả lời dài thành những câu có giới hạn.

### Why the cap comes before the grace period

Một lần tắt có trật tự drain các request đang chạy trước khi nó dừng. Thời gian ân hạn phải dài hơn request dài nhất, và request dài nhất là một request chạy đến giới hạn. Phép tính của tài liệu SGLang: một câu trả lời 32K token ở 30 token mỗi giây cần hơn 18 phút. Giới hạn đầu ra trước, rồi đặt thời gian ân hạn kết thúc từ giới hạn, nếu không một lần drain không bao giờ có thể hoàn tất kịp thời và một rolling update giết các request giữa câu trả lời.

### Tomorrow

- Tìm các vòng lặp: các request hoàn tất với lý do độ dài tại giới hạn, được nhóm theo tenant và prompt template.
- Đặt các giới hạn đầu ra theo tenant mà bộ phận sản phẩm đã đồng ý.
- Nếu các câu trả lời dài hóa ra là các phiên agent thật, tăng pool bằng một FP8 KV cache hoặc thêm bộ nhớ, và hạ giới hạn mức đồng thời.
- Cảnh báo trên cặp: mức sử dụng cache gần một với một tốc độ request bình thường.

## Follow-ups

- **Level 3:** Tại sao một request bị lặp gây hại cho những người dùng khác chứ không chỉ chính nó? Expected: pool được dùng chung. Một request không bao giờ kết thúc giữ các vị trí của nó, vì vậy các request mới chờ hoặc các request đang chạy bị rút lại.
- **Level 3:** Bạn tìm các request bị lặp sau sự việc như thế nào? Expected: các request hoàn tất với lý do độ dài tại giới hạn, được nhóm theo tenant và prompt template.
- **Level 4:** Tại sao giới hạn độ dài đầu ra đến trước, trước khi bạn chọn một lần drain có thể mất bao lâu? Expected: thời gian ân hạn phải dài hơn request dài nhất, và request dài nhất chạy đến giới hạn. Phép tính của tài liệu cho hơn 18 phút cho 32K token ở 30 token mỗi giây.
- **Level 4:** Các câu trả lời dài là các phiên agent hợp lệ. Sau đó thì sao? Expected: tăng pool bằng một FP8 KV cache hoặc thêm bộ nhớ, hạ giới hạn mức đồng thời, và giữ một giới hạn đầu ra mà bộ phận sản phẩm đã đồng ý.

## Wrong answers

- "Khởi động lại máy chủ để xóa pool." Mọi request đang chạy thất bại, và các vòng lặp quay lại ở prompt tiếp theo.
- "Tăng tỷ lệ bộ nhớ." Một pool lớn hơn trì hoãn triệu chứng. Một request không có giới hạn lấp đầy bất kỳ pool nào.
- "Hạ temperature để dừng các vòng lặp." Các thiết lập lấy mẫu thay đổi xác suất xảy ra một vòng lặp. Chỉ một giới hạn bảo đảm rằng một request kết thúc.

## Taught in

[Phần vận hành của SGLang 101](../../../manuals/sglang-101/sections/7-1-operating-sglang.md) báo cáo giới hạn đầu ra và phép tính thời gian ân hạn, và [phần theo dõi production của vLLM 101](../../../manuals/vllm-101/sections/5-2-watch-vllm-in-production.md) ghép counter preemption với độ dài các câu trả lời.
