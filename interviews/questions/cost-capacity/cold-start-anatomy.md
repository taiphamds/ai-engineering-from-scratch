---
id: cold-start-anatomy
title: Break an eight-minute start into its parts
card: cost-capacity
kind: estimate
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [system-design, ml-depth]
tags: [cold-start, weight-loading, compile-cache, startup-probe]
minutes: 12
lessons: [phases/17-infrastructure-and-production/10-cold-start-mitigation]
manuals: [vllm-101#s-size-memory-on-a-dgx-spark, vllm-101#s-keep-cuda-graphs-and-compile-on, vllm-101#s-run-vllm-in-production, sglang-101#s-operating-sglang]
practice: []
cheatsheet: [serving-engines-compared, gpu-kubernetes]
related: [cost-capacity/warm-pool-or-cold-start, cost-capacity/autoscale-on-the-right-signal]
updated: 2026-11-03
---

Một pod phục vụ một mô hình MoE trên một máy bộ nhớ hợp nhất mất khoảng tám phút từ khởi động đến sẵn sàng. Chia thời gian đó thành các phần của nó, nói những phần nào một lần khởi động lại có thể bỏ qua, và ước tính một lần khởi động lại ấm trông như thế nào trên cùng máy.

## Short answer

Phần lớn thời gian là nạp trọng số. Log của tài liệu cho thấy khoảng 330 giây để sao chép 57 GiB trọng số vào bộ nhớ trên máy đó, từng tensor một từ một trang có file hậu thuẫn. Khởi tạo engine mất 127.54 giây, và nó chứa hai lần capture CUDA graph 39 và 38 giây cùng phần biên dịch 18.67 giây. Một lần khởi động lại tái sử dụng compile cache và không gì khác, vì vậy một lần khởi động lại ấm trên máy đó chỉ ngắn hơn một chút so với lần lạnh, trừ khi các trọng số được chuẩn bị sẵn trong bộ nhớ host hoặc một snapshot tiến trình tồn tại, điều mà một báo cáo thực địa đã đưa từ cold start 695 giây xuống 9.6 giây.

## Full answer

### The parts, from the startup log

| Giai đoạn | Đo được | Nơi được ghi log |
|---|---|---|
| nạp trọng số | 56.93 GiB trong khoảng 330 giây | dòng nạp mô hình |
| khởi tạo engine, profile, KV cache, warmup, với cả hai lần capture graph | 127.54 giây, trong đó biên dịch 18.67 | dòng khởi tạo engine |
| lần capture graph đầu tiên, bên trong khởi tạo engine | 39 giây, 1.17 GiB | dòng capture graph đầu tiên |
| lần capture graph thứ hai, bên trong khởi tạo engine | 38 giây, 0.31 GiB | dòng capture graph thứ hai |

Hai lần capture kết thúc trước dòng khởi tạo, vì vậy chúng là một phần của 127.54 giây đó. Không cộng chúng vào nó.

Máy chủ báo cáo sẵn sàng khoảng tám phút sau khi đọc các đối số của nó. Chỉ riêng việc nạp đã hơn hai phần ba thời gian đó.

### Why the load is slow on this machine

Mỗi tensor được sao chép từ file trọng số ánh xạ bộ nhớ vào phần cấp phát GPU. Trên nền tảng này một issue đang mở đo được khoảng 1.7 ms cho mỗi tensor được sao chép từ view file, so với khoảng 0.2 ms cho một lần sao chép bắt đầu trong bộ nhớ host. Bản phát hành mà tài liệu ghim tiết kiệm khoảng 25 giây với một phép tra cứu có chỉ mục các tên expert, và chi phí sao chép theo từng tensor vẫn còn. Lời khuyên của tài liệu: giữ trọng số trên NVMe cục bộ, không trên một mount mạng, và khởi động máy chủ một lần rồi giữ nó chạy.

### What a restart skips

Compile cache nằm dưới thư mục cache của engine. Giữ nó trên một persistent volume, và một lần khởi động sau đọc nó, vì vậy phần biên dịch co lại. SGLang trỏ tất cả kernel cache của nó vào một thư mục vì cùng lý do, và tài liệu mount nó trên một volume tồn tại qua pod. Các lần capture graph và nạp trọng số lặp lại ở mọi lần khởi động. Vì vậy ước tính trung thực cho một lần khởi động lại ấm trên máy này là cold start trừ phần biên dịch, vẫn là vài phút.

### Getting under a minute

Bài học về cold start ánh xạ mỗi giai đoạn sang một lớp: một image được chuẩn bị sẵn loại bỏ việc kéo image, model streaming giảm khoảng một nửa thời gian nạp trọng số, và một snapshot bộ nhớ GPU khôi phục trạng thái đã nạp nhanh hơn khoảng mười lần so với nạp lại. Tài liệu SGLang trích một báo cáo thực địa có cùng dạng trên một engine khác và tám GPU: cold start 695 giây với 531 giây trong số đó dành cho nạp trọng số, 88 giây khi giữ kernel cache, và 9.6 giây với một checkpoint tiến trình và các trọng số được chuẩn bị sẵn trong bộ nhớ host. Dưới một phút có nghĩa là một snapshot hoặc các trọng số được chuẩn bị sẵn, không phải một đĩa nhanh hơn.

### What the number sets

Ví dụ Kubernetes trong tài liệu vLLM cho startup probe các lần kiểm tra cách nhau 10 giây trong một khoảng thời gian 15 phút, và bảo bạn đặt khoảng thời gian từ cold start đã đo của chính mình. Một autoscaler cần một khoảng thời gian ổn định ít nhất dài bằng, và đường tương tác cần một replica ấm, vì không lần mở rộng nào giúp được bên trong một khoảng thời gian tám phút.

## Follow-ups

- **Level 3:** Giai đoạn nào chiếm ưu thế trên máy này, và tại sao? Expected: nạp trọng số ở mức khoảng 330 giây, vì mỗi tensor được sao chép từ một trang có file hậu thuẫn, điều này chậm trên nền tảng này.
- **Level 3:** Một compile cache bền vững tiết kiệm gì trong một lần khởi động lại? Expected: phần biên dịch của khởi tạo engine, 18.67 giây ở đây. Việc nạp trọng số và các lần capture graph vẫn còn.
- **Level 4:** Bạn đưa lần khởi động lại xuống dưới một phút như thế nào? Expected: một checkpoint tiến trình hoặc snapshot bộ nhớ GPU với các trọng số được chuẩn bị sẵn trong bộ nhớ host, điều mà báo cáo thực địa đưa xuống 9.6 giây. Chỉ một đĩa nhanh hơn không đạt được điều đó.
- **Level 4:** Một lần khởi động tám phút hàm ý gì cho các probe và autoscaler? Expected: một khoảng thời gian startup probe dài hơn tám phút, một khoảng thời gian ổn định ít nhất dài bằng, và một replica ấm cho đường tương tác.

## Wrong answers

- "Biên dịch là phần chậm, dùng eager mode." Phần biên dịch là 18.67 giây của một lần khởi động tám phút, và eager mode đánh đổi tốc độ decode trên mọi request sau đó.
- "Một GPU nhanh hơn nạp nhanh hơn." Việc nạp bị giới hạn bởi đường sao chép từ view file, không phải bởi GPU.
- "Khởi động lại thường xuyên để nhận các thay đổi cấu hình." Mỗi lần khởi động lại trả toàn bộ chi phí nạp. Lời khuyên của tài liệu là khởi động một lần và giữ máy chủ chạy.

## Taught in

[Phần bộ nhớ hợp nhất của vLLM 101](../../../manuals/vllm-101/sections/2-3-size-memory-on-a-dgx-spark.md) giải thích việc nạp trọng số chậm, [phần biên dịch](../../../manuals/vllm-101/sections/4-3-keep-cuda-graphs-and-compile-on.md) đọc các thời gian capture và biên dịch, [phần production](../../../manuals/vllm-101/sections/7-2-run-vllm-in-production.md) giữ compile cache, [phần vận hành của SGLang 101](../../../manuals/sglang-101/sections/7-1-operating-sglang.md) báo cáo các lần khởi động ấm và từ checkpoint, và [bài học cold start](../../../phases/17-infrastructure-and-production/10-cold-start-mitigation/) ánh xạ mỗi giai đoạn sang một biện pháp giảm thiểu.
