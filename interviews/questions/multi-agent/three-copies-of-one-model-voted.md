---
id: three-copies-of-one-model-voted
title: Three copies of one model voted, and the majority was wrong
card: multi-agent
kind: concept
level: 4
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth, system-design]
tags: [consensus, bft, monoculture, confidence-weighting, sycophancy]
minutes: 15
lessons: [phases/16-multi-agent-and-swarms/14-consensus-and-bft]
manuals: []
practice: []
cheatsheet: [multi-agent, emergent-agent-societies]
related: [multi-agent/two-workers-return-different-facts]
updated: 2026-11-03
---

Năm agent trả lời cùng một câu hỏi sự thật và bỏ phiếu. Ba trong số chúng chạy cùng mô hình nền và đồng ý một đáp án sai, và hai agent còn lại đúng. Bỏ phiếu đa số chọn đáp án sai. Một đồng nghiệp nói đồng thuận chịu lỗi cổ điển giải quyết điều này. Giải thích tại sao nó không giải quyết, các giả định nào bị phá, và các giao thức gần đây dành riêng cho agent thay đổi gì.

## Short answer

Đồng thuận cổ điển chịu được ít hơn một phần ba node hành xử tùy ý, và nó giả định các lỗi độc lập, các node trung thực đúng, và một ground truth tồn tại. Ba agent trên một mô hình nền dùng chung chia sẻ lỗi, một mô hình trung thực vẫn ảo giác, và trên một số câu hỏi các agent định nghĩa sự thật. Các biến thể dành riêng cho agent đặt trọng số mỗi phiếu bằng một phép thăm dò độ tự tin, tổng hợp các đề xuất không có trưởng bằng một trung vị hình học, hoặc chia agent thành lõi và biên với các trọng số tin cậy được học. Không biến thể nào khiến đồng thuận bằng tính đúng đắn, nên đầu ra đồng thuận vẫn đến một bộ xác minh độc lập.

## Full answer

### What the classical protocol gives and assumes

Giao thức tiêu chuẩn đạt đồng thuận về một giá trị giữa n node khi ít hơn n chia ba node bị lỗi, cần n ít nhất ba f cộng một. Nó chạy ba pha trên các thông điệp được ký và chứng chỉ quorum. Ba giả định của nó:

1. Các lỗi độc lập, nên các node lỗi không phối hợp.
2. Các node trung thực đúng, nên giao thức chỉ căn chỉnh bất đồng.
3. Câu hỏi có một ground truth, nên đồng thuận về một giá trị sai vẫn là đồng thuận.

Các agent mô hình phá cả ba. Các agent trên một mô hình nền chia sẻ lỗi. Một agent trung thực ảo giác. Và trên một câu hỏi mơ hồ các agent quyết định điều gì đúng.

### Three attacks that pass the signature check

| Tấn công | Điều gì xảy ra | Giao thức cổ điển có xử lý nó không |
|---|---|---|
| Một lời nói dối cố ý | Một agent xuất một đáp án sai với độ tự tin cao | Có, khi các bên nói dối dưới một phần ba |
| Tuân theo xu nịnh | Một agent đọc các agent khác và theo bất cứ ai nói cuối | Không, vì agent vượt mọi kiểm tra |
| Đơn canh tương quan | Ba agent trên một mô hình ảo giác cùng đáp án | Không, vì cả ba trung thực đồng ý |

Trường hợp của prompt là trường hợp thứ ba.

### The agent-specific responses

- **Bỏ phiếu có trọng số độ tự tin.** Mỗi bên bỏ phiếu gắn một phép thăm dò độ tự tin, tự báo cáo hoặc từ một mô hình hiệu chuẩn, và trọng số phiếu tỷ lệ theo nó. Bài học báo cáo một cải thiện lớn trên các đồ thị kết nối đầy đủ. Nó giúp nhiều nhất chống sự tuân theo, vì một agent nhận một lập trường mà nó không tự suy ra có xu hướng báo cáo độ tự tin thấp.
- **Tổng hợp không có trưởng bằng trung vị hình học.** Các worker đề xuất song song, các bên đánh giá chấm các đề xuất, và câu trả lời là trung vị hình học của các vị trí đã chấm. Nó vững khi tỷ phần lỗi dưới một nửa, và nó chống ngoại lai và kéo về cụm dày đặc thay vì trung bình bị bias mô hình.
- **Bỏ phiếu có trọng số với một lõi và một biên.** Các trọng số đến từ chất lượng phản hồi và một điểm tin cậy học từ lịch sử. Một lõi nhỏ đạt đồng thuận trước và biên theo sau, giới hạn độ trễ và cho phép chọn lõi để có đa dạng.

### The stripped-down round

Mỗi agent tạo một câu trả lời và một độ tự tin. Bộ tổng hợp nhóm các câu trả lời thành các cụm ngữ nghĩa, để hai cách diễn đạt của một giá trị được tính cùng nhau, lấy tổng độ tự tin mỗi cụm, và chỉ chấp nhận cụm đứng đầu khi tỷ phần của nó vượt một ngưỡng. Dưới ngưỡng, nó thử lại hoặc chuyển lên. Khoảng hoạt động của bài học cho ngưỡng là 0.5 đến 0.67 với năm đến bảy agent. Các cụm thiểu số được ghi log với nguồn gốc, vì chúng là cảnh báo sớm cho các lỗi tương quan.

### The uncomfortable measurement

Bài học trích dẫn một nghiên cứu về đồng thuận vô hướng giữa các mô hình tiên phong: ngay cả không có đối thủ, các agent bất đồng trên các câu hỏi vô hướng ở tỷ lệ trên 30 phần trăm trên nhiều benchmark, và một agent đơn với một persona lừa dối kéo đồng thuận của hỗn hợp lệch hơn 40 điểm phần trăm khỏi baseline trung thực. Cơ chế đồng thuận căn chỉnh các đầu ra. Nó không cho bạn biết liệu đầu ra đã căn chỉnh có đúng.

## Follow-ups

- **Level 3:** Trung vị hình học có cứu trường hợp này không? Expected: không. Trung vị giảm trọng số ngoại lai và di chuyển về cụm dày đặc, chỉ giúp khi cụm sai dưới một nửa. Ở đây ba trên năm phiếu sai, nên cụm dày đặc là cụm sai và trung vị chọn nó.
- **Level 3:** Ba agent sai cũng là những agent tự tin nhất. Bây giờ làm gì? Expected: không bộ tổng hợp nào sửa một cụm sai vừa lớn hơn vừa tự tin hơn, nên hệ thống cần đa dạng mô hình nền hoặc một bộ xác minh độc lập.
- **Level 4:** Tại sao giới hạn các vòng ở hai hoặc ba? Expected: các agent quan sát các vòng trước bắt đầu bắt chước nhau bất kể sự thật, nên nhiều vòng hơn thưởng cho sự tuân theo.
- **Level 4:** Bạn theo dõi gì trong production? Expected: tỷ lệ đồng thuận, nơi một mức tăng mạnh có nghĩa tuân theo và một mức giảm mạnh có nghĩa trôi mô hình, và các cụm thiểu số với nguồn gốc của chúng.

## Wrong answers

- "Dùng giao thức cổ điển với một quorum hai phần ba." Ba agent trung thực chia sẻ một ảo giác tạo thành quorum, và giao thức đồng thuận về giá trị sai.
- "Thêm các bản sao của cùng mô hình đến khi đa số đúng." Thêm bản sao của một mô hình thêm các phiếu tương quan, và cụm sai tăng theo chúng.
- "Đồng thuận có nghĩa câu trả lời đúng." Đồng thuận và tính đúng đắn là các phép đo khác nhau, và đầu ra đồng thuận cần một bộ xác minh độc lập với ensemble.

## Taught in

[Bài học đồng thuận và chịu lỗi](../../../phases/16-multi-agent-and-swarms/14-consensus-and-bft/) xây dựng giao thức tối thiểu và chạy ba cuộc tấn công đối với ba bộ tổng hợp.
