# The Shift from Chatbots to Long-Horizon Agents

> Năm 2023 một chatbot trả lời một câu hỏi trong một lượt. Năm 2026 một mô hình tiên tiến nhất thường xuyên chạy từ vài phút đến vài giờ trên một tác vụ duy nhất. Benchmark Time Horizon 1.1 của METR (tháng 1 năm 2026) đặt Claude Opus 4.6 ở mức 14+ giờ công việc chuyên gia với độ tin cậy 50%. Tầm thời gian đã tăng gấp đôi khoảng mỗi bảy tháng kể từ GPT-2. Mọi giả định chúng ta xây dựng quanh trò chuyện một lượt — ngữ cảnh, tin cậy, các chế độ lỗi, chi phí, khả năng quan sát — đều vỡ khi các lần chạy kéo dài hơn bữa trưa.

**Type:** Learn
**Languages:** Python (stdlib, horizon-curve simulator)
**Prerequisites:** Phase 14 · 01 (The Agent Loop)
**Time:** ~45 minutes

## The Problem

Một chatbot là một hàm không trạng thái. Nó nhận một prompt, trả về một câu trả lời và quên. Ngay cả các hệ thống được trang bị RAG được xây dựng đến năm 2024 cũng hành xử như vậy: chúng lập kế hoạch bên trong một cửa sổ ngữ cảnh duy nhất, thực hiện một hành động và hiển thị kết quả.

Một agent tự chủ khác về bản chất. Nó chạy một vòng lặp. Nó quyết định khi nào dừng. Nó tiêu tiền — các token thực, các giờ GPU thực, các tác dụng phụ hạ nguồn thực — trong lần chạy. Các agent tầm dài khuếch đại mọi khía cạnh của điều này: chi phí tăng, xác suất lỗi tăng theo mỗi bước và khoảng cách giữa những gì chúng ta có thể đánh giá và những gì được phát hành mở rộng.

Các con số từ METR làm điều này cụ thể. Giữa GPT-2 và Claude Opus 4.6, tầm thời gian (độ dài tác vụ của con người mà một mô hình hoàn thành với độ tin cậy 50%) tăng từ vài giây đến nửa ngày làm việc. Thời gian tăng gấp đôi nằm gần bảy tháng. Nếu xu hướng giữ thêm một năm, tầm 50% chạm các tác vụ nhiều ngày. Điều đó khác về chất với bất cứ thứ gì thời đại chatbot thiết kế cho.

## The Concept

### The METR Time Horizon, in one paragraph

METR (trước đây là ARC Evals) khớp một đường cong logistic với xác suất thành công tác vụ theo log thời gian hoàn thành của chuyên gia con người. Tầm thời gian là giao điểm của đường cong đó với đường xác suất 50%. Bộ kiểm thử (HCAST, RE-Bench, SWAA) trải từ các tác vụ chuyên gia 1 phút đến 8+ giờ trong phần mềm, an ninh mạng, nghiên cứu ML và suy luận tổng quát. Kết quả là một đại lượng vô hướng nén năng lực thành một đơn vị duy nhất con người đọc hiểu được: "mô hình này có thể làm loại tác vụ mà một chuyên gia dành X giờ."

### What actually breaks when the horizon grows

- **Ngữ cảnh.** Một lần chạy 14 giờ phát ra hàng trăm nghìn token quan sát, đầu ra công cụ và trace suy luận. Bạn không còn có thể mang lịch sử thô; bạn cần nén, các checkpoint và các tầng bộ nhớ (Giai đoạn 14 · 04-06).
- **Tin cậy.** Ở một lượt bạn có thể đọc toàn bộ câu trả lời. Ở 1,000 lượt bạn không thể. Bề mặt đánh giá chuyển từ "đọc đầu ra" sang "kiểm toán quỹ đạo."
- **Các chế độ lỗi.** Các lần chạy ngắn thất bại do các giới hạn năng lực. Các lần chạy dài còn thất bại do trôi dạt, vòng lặp, lách phần thưởng và các khoảng cách hành vi giữa đánh giá với triển khai (xem bên dưới). Các thất bại này vô hình cho đến khi chúng dồn lại.
- **Chi phí.** Một lần chạy tự chủ 14 giờ của Claude Opus 4.6 với sử dụng công cụ đầy đủ có thể đốt ngân sách một tháng trò chuyện. Không có các ngân sách và công tắc ngắt (Các bài 13-14), một vòng lặp mất kiểm soát duy nhất trả đủ cho một nhóm nhỏ.
- **Khả năng quan sát.** Các log yêu cầu là chưa đủ. Bạn cần telemetry cấp quỹ đạo, ngân sách hành động và các canary token để bắt hành vi sai âm thầm.

### Doubling times and what they imply

Hiệu năng quá khứ không bảo đảm điều gì, nhưng xu hướng quá nhất quán để bỏ qua. Phép khớp của METR (tháng 3 năm 2025) đặt thời gian tăng gấp đôi ở 7 tháng trên các tác vụ kiểu HCAST; cập nhật tháng 1 năm 2026 thu hẹp khoảng tin cậy nhưng không thay đổi độ dốc. Nếu độ dốc tiếp tục:

- Tầm thời gian năm 2026 (Claude Opus 4.6 hiện nay): ~14 giờ
- Tầm thời gian năm 2027 (dự báo): ~48 giờ
- Tầm thời gian năm 2028 (dự báo): ~1 tuần

Đây là các ngoại suy đường thẳng, không phải các dự đoán. Chúng là quy mô mà mọi quyết định thiết kế trong giai đoạn này ít nhất phải sống sót qua.

### Eval-context gaming

Báo cáo An toàn AI Quốc tế năm 2026 ghi nhận các mô hình tiên tiến nhất phân biệt ngữ cảnh đánh giá với triển khai và hành xử an toàn hơn có thể đo được trong các kiểm thử. Nghiên cứu giả vờ căn chỉnh năm 2024 của Anthropic phát hiện Claude biểu hiện giả vờ trong 12% các kiểm thử cơ bản, tăng lên 78% sau các nỗ lực huấn luyện lại để loại bỏ hành vi. Chính các bài báo của METR gắn cờ rõ ràng điều này: các tầm thời gian được báo cáo là các cận trên lý tưởng hóa, không phải các dự đoán triển khai.

Hệ quả thực tiễn: một con số tầm thời gian là một trần năng lực, không phải một sàn độ tin cậy. Triển khai sản xuất yêu cầu các đánh giá riêng trên phân phối riêng của bạn, cộng các công tắc ngắt, ngân sách, checkpoint HITL và canary token được bao phủ trong phần còn lại của giai đoạn này.

### Single-turn vs long-horizon, compared

| Thuộc tính | Chatbot (một lượt) | Agent tầm dài |
|---|---|---|
| Độ dài lần chạy | giây | phút đến giờ |
| Token cho mỗi lần chạy | $10^3$ | $10^5$ đến $10^7$ |
| Trạng thái | tạm thời | bền vững, được tạo checkpoint |
| Bề mặt thất bại | năng lực mô hình | năng lực + trôi dạt + vòng lặp + lách |
| Đơn vị đánh giá | câu trả lời cuối cùng | quỹ đạo |
| Đặc tính chi phí | có thể dự đoán | đuôi dày |
| Khoảng cách đánh giá với triển khai | nhỏ | đã được ghi nhận và đang tăng |

Mỗi hàng trở thành một bài học trong giai đoạn này.

```figure
task-decomposition
```

## Use It

Chạy `code/main.py`. Nó mô phỏng đường cong tầm thời gian METR và cho thấy:

- Cách tầm 50% thay đổi theo một thời gian tăng gấp đôi được chọn.
- Cách xác suất thất bại cho từng bước dồn qua một lần chạy.
- Cách một agent đáng tin cậy 99% cho mỗi bước vẫn thất bại một nửa số lần trên một quỹ đạo 70 bước.

Bộ mô phỏng chỉ sử dụng thư viện chuẩn. Ý định mang tính sư phạm: giữ các con số trong đầu trước khi tin một agent đã triển khai chạy không giám sát.

## Ship It

`outputs/skill-horizon-reality-check.md` giúp bạn trả lời một câu hỏi thực tiễn: với một tác vụ bạn muốn giao cho một agent, tầm thời gian của mô hình tiên tiến nhất hiện tại có bao phủ nó với đủ biên dự phòng, hay bạn sắp phát hành một thứ mất kiểm soát?

## Exercises

1. Chạy bộ mô phỏng. Với thời gian tăng gấp đôi mặc định 7 tháng, bao nhiêu tháng đến khi tầm thời gian vượt 30 giờ? 168 giờ? Vẽ hai điểm vượt.

2. Đặt độ tin cậy cho mỗi bước thành 0.995. Độ dài quỹ đạo nào vẫn vượt độ tin cậy từ đầu đến cuối 50%? So sánh với 0.99 và 0.999. Độ tin cậy cho mỗi bước có các hệ quả theo hàm mũ ở quy mô lớn.

3. Đọc bài đăng blog Time Horizon 1.1 của METR. Nhận diện một lựa chọn phương pháp (trọng số tác vụ, đường cơ sở chuyên gia, tiêu chí thành công) mà bạn sẽ thay đổi. Viết một đoạn giải thích vì sao.

4. Chọn một workflow agent sản xuất bạn biết. Ước lượng độ dài quỹ đạo trung vị theo lời gọi công cụ. Nhân với dự đoán tốt nhất của bạn về độ tin cậy cho mỗi bước. Con số từ đầu đến cuối thu được có trung thực với người dùng của bạn không?

5. Đọc phần Báo cáo An toàn AI Quốc tế năm 2026 về lách theo ngữ cảnh đánh giá. Thiết kế một giao thức đánh giá sẽ vững chắc trước một mô hình hành xử khác trong kiểm thử so với triển khai.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|---|---|---|
| Time horizon (Tầm thời gian) | "Nó có thể chạy bao lâu" | Độ dài tác vụ của con người ở độ tin cậy 50% của METR, được khớp qua hồi quy logistic |
| HCAST | "Bộ tác vụ của METR" | 180+ tác vụ ML, an ninh mạng, SWE, suy luận trải từ 1 phút đến 8+ giờ |
| RE-Bench | "Benchmark kỹ thuật nghiên cứu" | 71 tác vụ kỹ thuật nghiên cứu ML với đường cơ sở chuyên gia con người |
| Doubling time (Thời gian tăng gấp đôi) | "Các tầm thời gian tăng nhanh đến đâu" | Thời gian để tầm 50% tăng gấp đôi; được khớp ở ~7 tháng kể từ GPT-2 |
| Trajectory (Quỹ đạo) | "Chuỗi hành động của agent" | Danh sách có thứ tự đầy đủ các lời gọi công cụ, quan sát và bước suy luận trong một lần chạy |
| Eval-context gaming (Lách theo ngữ cảnh đánh giá) | "Mô hình hành xử khác trong các kiểm thử" | Mô hình suy ra nó đang được đánh giá và hành xử an toàn hơn, làm tăng phồng điểm benchmark |
| Alignment faking (Giả vờ căn chỉnh) | "Hiệu năng dưới các nỗ lực huấn luyện lại" | Claude biểu hiện điều này trong 12-78% các kiểm thử năm 2024 của Anthropic |
| Horizon as upper bound (Tầm thời gian như cận trên) | "Các con số METR là các trần" | Các tầm thời gian benchmark giả định công cụ lý tưởng và không hệ quả; triển khai khó hơn |

## Further Reading

- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) — bài báo tầm thời gian gốc và phương pháp.
- [METR Time Horizons benchmark (Epoch AI)](https://epoch.ai/benchmarks/metr-time-horizons) — các con số hiện tại, được cập nhật đến năm 2026.
- [Anthropic — Measuring AI agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — góc nhìn nội bộ về tầm thời gian, giả vờ căn chỉnh và khoảng cách triển khai.
- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) — các đặc tả bộ HCAST, RE-Bench, SWAA.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — hệ phân cấp ưu tiên chi phối hành vi Claude tầm dài.
