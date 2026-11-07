---
id: when-to-split-prefill-and-decode
title: When prefill-decode disaggregation pays
card: inference-serving
kind: design
level: 3
roles: [inference-engineer]
rounds: [system-design, design-review]
tags: [disaggregation, kv-transfer, p99-itl, router, prefill]
minutes: 12
lessons: []
manuals: [vllm-101#s-split-prefill-and-decode, sglang-101#s-prefill-decode-disaggregation]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Người dùng chat của bạn thấy một luồng mượt đến khi ai đó dán một tài liệu dài, rồi mọi luồng tạm dừng trong khi máy chủ prefill nó. Một đồng nghiệp đề xuất tách prefill-decode: các máy chủ prefill và máy chủ decode riêng. Khi nào việc tách đó có lợi, nó không làm gì, và bạn sẽ quyết định như thế nào?

## Short answer

Tách prefill khỏi decode khi vấn đề được đo là phần đuôi độ trễ giữa token và các prompt dài gây ra nó, vì một máy chủ prefill khi đó không bao giờ chia sẻ một bước với một luồng. Nó không tăng thông lượng: tài liệu nói như vậy, nó tốn một lần truyền KV cho mọi yêu cầu cộng thêm máy chủ và một router, và một nghiên cứu năm 2025 tìm thấy rằng ngay cả mức cải thiện phần đuôi cũng phụ thuộc vào tải và đường di chuyển cache. Quyết định bằng một phép đo: một máy chủ trước, rồi các bản sao sau một gateway, và tách sau cùng, được so sánh với cùng các GPU chạy như máy chủ thông thường ở tải thực của bạn.

## Full answer

### What it solves and what it does not

Trên một máy chủ, một prompt dài chia sẻ mỗi bước với các luồng đang chạy, và mọi luồng chờ lâu hơn một chút cho token tiếp theo. Chunked prefill làm khoảng dừng ngắn hơn nhưng không thể loại bỏ nó. Hai loại máy chủ loại bỏ nó: một máy chủ prefill tính prompt và xây dựng KV cache của nó, và một máy chủ decode nhận cache đó và viết câu trả lời.

Tài liệu vLLM nói rằng prefill được tách không tăng thông lượng. Nó cho quyền kiểm soát token đầu tiên và luồng như hai con số riêng, và nó kiểm soát phần đuôi độ trễ giữa token. Ngay cả mức tăng đó cũng là một điều kiện, không phải mặc định: nghiên cứu so sánh các máy chủ tách với các máy chủ chạy cả hai giai đoạn tìm thấy rằng nó phụ thuộc vào tải yêu cầu và đường di chuyển cache.

### How the cache moves

Trong SGLang, gateway bắt đầu mọi trao đổi. Nó chọn một máy chủ prefill và một máy chủ decode, thêm host và cổng bootstrap của máy chủ prefill và một số phòng ngẫu nhiên 63-bit, rồi gửi cùng yêu cầu đến cả hai. Máy chủ decode dành các slot KV và công bố địa chỉ của chúng. Máy chủ prefill chạy một prefill thông thường và ghi các trang KV thẳng vào các slot đó, một lần ghi RDMA một phía với backend truyền mặc định, hoặc qua TCP trên một cụm không có card RDMA. Máy chủ decode thấy việc truyền hoàn tất và thêm yêu cầu vào batch đang chạy của nó. Mọi lần truyền đi qua bootstrapping, chờ, truyền và thành công, và bất kỳ giai đoạn nào cũng có thể thất bại. Cổng bootstrap mặc định là 8998, cả hai timeout là 300 giây, và số hàng đợi truyền là 4.

Trong vLLM, mỗi máy chủ nhận một connector KV và một vai trò, `kv_producer` hoặc `kv_consumer`, và connector thông dụng cần một thư viện mà wheel không cài, được ghim ở 1.4.1. Một router gửi mỗi yêu cầu đến máy chủ prefill trước, đọc các tham số truyền từ phản hồi của nó, và gửi yêu cầu đến máy chủ decode với chúng. Nếu một lần truyền thất bại, chính sách mặc định làm yêu cầu thất bại; `kv_load_failure_policy` đặt thành `recompute` thay vào đó tính lại prompt trên máy chủ decode.

Không bao giờ gửi một yêu cầu thẳng đến một máy chủ vai trò. Bộ lập lịch assert rằng một phòng bootstrap tồn tại và bảo bạn dùng router.

### The order to decide

1. Đo TTFT và độ trễ giữa token trên một máy chủ với một benchmark trộn prompt dài và ngắn.
2. Thêm các bản sao data-parallel sau một gateway, và đo lại.
3. Chỉ tách khi phần đuôi giữa token vẫn tăng khi các prompt dài đến, và so sánh phần tách với cùng các GPU như máy chủ thông thường ở tải thực của bạn.

### Size the two sides

Prompt dài với câu trả lời ngắn cần nhiều năng lực prefill hơn. Prompt ngắn với câu trả lời dài cần nhiều năng lực decode hơn. Một kiểm thử trên tám GPU tìm thấy rằng ở mức đồng thời cao, một máy chủ prefill cho ba máy chủ decode thắng mọi chỉ số, trong khi ở mức đồng thời thấp, ba trên một và hai trên hai cho token đầu tiên tốt hơn. Nó cho thấy hướng, không phải tỷ lệ của bạn. Đo token đầu tiên và luồng ở mỗi phía và di chuyển một máy chủ mỗi lần.

### What went wrong for other teams

- Một cặp với một máy chủ prefill và một máy chủ decode có token đầu tiên cao hơn một máy chủ thông thường với cùng cách chia GPU. Một thư viện truyền cũ là nguyên nhân, và nâng cấp đã sửa nó. Không có đường cơ sở một máy chủ thì không ai biết được.
- Ở 64 yêu cầu đồng thời, một thiết lập ghi log nhiều lỗi bootstrap và `Aborted by AbortReq` ở phía prefill, trong khi 4 đến 7 yêu cầu đồng thời hoạt động. Timeout của router cho client prefill quá ngắn, và một bản sửa sau đó kéo dài nó. Quy tắc: một lần hủy có nghĩa là client hoặc router đã hủy, nên kiểm tra timeout trước khi nghi ngờ việc truyền.
- Khi bật bộ lập lịch overlap, một lần triển khai thấy thông lượng tăng khoảng 10 phần trăm và token đầu tiên tệ hơn nhiều, vì việc truyền KV chờ lần khởi chạy kernel tiếp theo; cách sửa của họ là một cờ mà tài liệu không tìm thấy trong phiên bản được ghim.

### What to watch after the split

Các bộ đếm bootstrap-failed và transfer-failed phải giữ phẳng. Các gauge độ trễ và tốc độ truyền cho thấy chi phí của mỗi lần di chuyển. Các gauge cấp phát trước decode và hàng đợi truyền cho thấy những yêu cầu chờ bộ nhớ hoặc một lần truyền. Trong mọi benchmark, đọc các token đầu ra được tokenize lại trước thông lượng.

## Follow-ups

- **Level 3:** Trên cùng các GPU, token đầu tiên của cặp tách đến muộn hơn của máy chủ thông thường. Bạn nghi ngờ gì trước? Expected: đường truyền, một thư viện truyền cũ hoặc một timeout router; một sự cố sửa nó bằng nâng cấp, và chỉ đường cơ sở một máy chủ cho thấy việc tách làm nó tệ hơn.
- **Level 3:** Prefill ghi log các lần hủy ở tải 64 người dùng và hoạt động ở 4 đến 7. Lỗi ở đâu? Expected: trong các timeout router hoặc client, đã hủy những yêu cầu vẫn đang chạy, không phải trong việc truyền; một bản sửa sau đó kéo dài timeout router.
- **Level 4:** Bạn chọn tỷ lệ máy chủ prefill trên decode như thế nào? Expected: từ độ dài prompt và câu trả lời và mức đồng thời của bạn; prompt dài với câu trả lời ngắn cần thêm prefill và ngược lại thêm decode; một kiểm thử tìm thấy một prefill cho ba máy chủ decode thắng ở mức đồng thời cao và ba trên một hoặc hai trên hai cho token đầu tiên tốt hơn ở mức đồng thời thấp, nên đo cả hai phía và di chuyển một máy chủ mỗi lần.

## Wrong answers

- "Việc tách tăng thông lượng." Tài liệu nói nó không tăng; nó cho quyền kiểm soát token đầu tiên và luồng như hai con số và tốn một lần truyền KV mỗi yêu cầu cùng thêm máy chủ.
- "Gửi yêu cầu thẳng đến máy chủ decode để bỏ qua router." Bộ lập lịch assert rằng một phòng bootstrap tồn tại và bảo bạn gửi yêu cầu đến router; phòng là cách hai máy chủ tìm nửa của nhau của một yêu cầu.
- "Một lần truyền thất bại quay về một prefill bình thường." Chính sách mặc định của vLLM làm yêu cầu thất bại; đặt chính sách thất bại thành recompute nếu bạn muốn máy chủ decode tính lại prompt.
- "Chunked prefill đã giải quyết điều này." Nó làm khoảng dừng ngắn hơn nhưng không thể loại bỏ nó, vì chunk vẫn chia sẻ bước với các decode đang chạy; việc tách loại bỏ sự chia sẻ với cái giá một lần truyền và một tập lỗi thứ hai.

## Taught in

[Tách prefill và decode](../../../manuals/vllm-101/sections/6-3-split-prefill-and-decode.md) và [phần tách của SGLang](../../../manuals/sglang-101/sections/6-3-prefill-decode-disaggregation.md) trình bày thiết lập, các giới hạn và các sự cố.
