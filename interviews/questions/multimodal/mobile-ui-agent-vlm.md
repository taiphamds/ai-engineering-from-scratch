---
id: mobile-ui-agent-vlm
title: Design a VLM for an on-device UI agent
card: multimodal
kind: design
level: 4
roles: [applied-ai-engineer, agentic-ai-engineer]
rounds: [system-design]
tags: [vlm-design, ui-agent, resolution, grounding]
minutes: 20
lessons: [phases/12-multimodal-ai/07-open-weight-vlm-recipes, phases/04-computer-vision/25-vision-language-models, phases/12-multimodal-ai/05-llava-visual-instruction-tuning]
manuals: []
practice: []
cheatsheet: [vlm-model-families, vlm-architectures]
related: [multimodal/which-knob-first, multimodal/spatial-reasoning-limit]
updated: 2026-11-03
---

Thiết kế một mô hình thị giác-ngôn ngữ cho một trợ lý di động trên thiết bị đọc màn hình điện thoại và chạm, gõ và cuộn. Giữ mô hình ngôn ngữ khoảng 2B tham số. Chọn encoder, cầu nối, kế hoạch độ phân giải và hỗn hợp dữ liệu, biện minh mỗi lựa chọn bằng bằng chứng ablation, và nêu khả năng bạn sẽ thận trọng để không hứa quá mức.

## Short answer

Encoder: encoder tương phản mạnh hơn ở độ phân giải gốc, với các đặc trưng của một encoder tự giám sát được nối cho một tín hiệu không gian dày đặc, vì encoder giải thích khoảng 20 phần trăm variance và các đặc trưng tự giám sát dẫn các kiểm thử tập trung thị giác. Cầu nối: một MLP hai lớp, vì connector giải thích khoảng 5 phần trăm, với các đặc trưng từ nhiều độ sâu encoder được xếp chồng để vị trí tinh đến mô hình ngôn ngữ. Độ phân giải: tăng dần từ thấp lên cao, với độ phân giải động đến khoảng 1280 pixel trên cạnh dài, vì các màn hình dày đặc văn bản và đọc được lợi nhiều nhất từ pixel. Dữ liệu: các mô tả con người dày đặc về màn hình cộng các trace hành động có grounding, không phải caption chưng cất; và thận trọng với lời hứa về quan hệ không gian, nơi các mô hình tổng quát đạt 50 đến 60 phần trăm và agent phải chạm đúng phần tử mỗi lần.

## Full answer

### Constraints first

Một mô hình ngôn ngữ 2B đặt một trần suy luận thấp: một mô hình ngôn ngữ lớn hơn thêm điểm trên các benchmark suy luận, và thiết kế này không thể tăng nó. Vì vậy mọi trục khác phải gánh nhiều hơn, và tác vụ phải được định hình là nhận thức cộng các hành động ngắn, không phải suy luận dài.

### Encoder

| Lựa chọn | Tại sao |
|---|---|
| Encoder tương phản mạnh ở độ phân giải gốc | thêm 3 điểm hoặc hơn so với loại thông dụng trong các ablation; độ phân giải gốc giữ văn bản màn hình đọc được |
| Các đặc trưng tự giám sát được nối | dẫn các benchmark tập trung thị giác 5 đến 7 điểm so với encoder tương phản; grounding UI tập trung thị giác |
| Các đặc trưng từ nhiều độ sâu encoder | các lớp sâu mang ngữ nghĩa và các lớp nông mang vị trí tinh; xếp chồng cả hai thắt chặt grounding, điều một agent chạm cần |

### Bridge

Một MLP hai lớp. Connector giải thích khoảng 5 phần trăm variance ở số token cố định, và MLP là loại đơn giản nhất để huấn luyện lại khi encoder hoặc mô hình ngôn ngữ thay đổi. Số token là núm điều chỉnh quan trọng: màn hình là tài liệu, nên lập ngân sách về đầu trên của điểm tối ưu 576 đến 1024, và trên nó cho các màn hình dày đặc.

### Resolution schedule

Bắt đầu thấp và tăng dần. Huấn luyện độ phân giải thấp phẳng đạt bình nguyên; một lịch trình tăng dần huấn luyện nhanh hơn và kết thúc cao hơn. Độ phân giải động với tối thiểu 256 và tối đa gần 1280 pixel trên cạnh dài xử lý dải mật độ màn hình, và các mức tăng đọc tài liệu 3 đến 5 điểm từ việc chia áp dụng cho màn hình.

### Data mix

- Các mô tả con người dày đặc về màn hình: có gì trên màn hình, ở đâu, và cái gì tương tác được. Các caption con người dày đặc thắng chưng cất trên mọi mặt trong so sánh tham chiếu.
- Các trace hành động có grounding: ảnh chụp màn hình, chỉ dẫn, phần tử và hành động, với tọa độ. Benchmark agent thị giác mà các mô hình tiên phong dẫn có hình dạng này.
- Dữ liệu instruction theo tác vụ cho các họ ứng dụng bạn triển khai đến.
- Dữ liệu tổng hợp chỉ nơi một mô tả con người neo nó, được lọc cho grounding.

### The capability to guard

Các quan hệ không gian. Các mô hình tổng quát đạt 50 đến 60 phần trăm trên trên, dưới, trái, phải và đếm, và một agent chạm sai phần tử thất bại tác vụ. Xây đánh giá từ các màn hình thật với các câu hỏi chọn phần tử chính xác, đo nó trước bất kỳ lời hứa nào, và giữ một bước xác minh trong vòng lặp agent: đọc lại màn hình sau hành động và kiểm tra trạng thái.

### Serving on the device

Một mô hình ngôn ngữ 2B và một encoder mạnh ở độ phân giải cao vẫn cần đếm ngân sách token thị giác mỗi màn hình; đo độ trễ mỗi bước ở độ phân giải của bạn trước khi đặt lịch trình.

## Follow-ups

- **Level 3:** Tại sao xếp chồng các lớp encoder nông và sâu cho một agent mà không cho một bộ tạo caption? Expected: một bộ tạo caption cần ngữ nghĩa; một agent cần chính xác ở đâu, điều các lớp nông mang và lớp cuối làm mờ.
- **Level 4:** Mô hình ngôn ngữ cố định ở 2B. Bạn dựa mạnh nhất vào trục nào, và giới hạn của nó là gì? Expected: độ phân giải và số token, vì màn hình dày đặc văn bản; giới hạn là độ trễ mỗi bước trên thiết bị, mà số token đặt.
- **Level 4:** Bạn khiến agent vững trước việc sai về một phần tử như thế nào? Expected: một lần đọc lại sau mỗi hành động so sánh màn hình mới với trạng thái kỳ vọng, và dừng khi chúng không khớp; độ tự tin riêng của mô hình không phải một tín hiệu an toàn.
- **Level 4:** Bằng chứng ablation không cho bạn biết gì về thiết kế này? Expected: nó đến từ các benchmark tổng quát trên GPU trung tâm dữ liệu; độ trễ thiết bị, miền UI và định dạng hành động cần ablation riêng của bạn, một trục mỗi lần chạy.

## Wrong answers

- "Dùng một cầu nối dựa trên query để tiết kiệm token trên thiết bị." Nó giới hạn token ở một số lượng quá thấp cho văn bản màn hình dày đặc, và các ablation đặt 64 token là quá ít cho đọc; dùng token ở đây và tiết kiệm nơi khác.
- "Sinh các mô tả màn hình bằng một mô hình độc quyền mạnh." Các mô tả chưng cất kế thừa ảo giác, và một agent chạm một phần tử ảo giác thất bại; các mô tả con người dày đặc thắng so sánh tham chiếu.
- "Một mô hình 2B với một encoder tuyệt vời ngang một agent 70B." Mô hình ngôn ngữ đặt trần suy luận; định hình tác vụ là nhận thức cộng hành động ngắn và xác minh mỗi bước, thay vì hứa suy luận dài.

## Taught in

[Bài học các công thức trọng số mở](../../../phases/12-multimodal-ai/07-open-weight-vlm-recipes/) cung cấp bằng chứng ablation cho mỗi trục và đặt bài tập này, và [bài học các mô hình thị giác-ngôn ngữ](../../../phases/04-computer-vision/25-vision-language-models/) trình bày các đặc trưng nhiều cấp, agent thị giác và giới hạn suy luận không gian.
