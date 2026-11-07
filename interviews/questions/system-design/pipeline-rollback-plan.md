---
id: pipeline-rollback-plan
title: Write the rollback plan before the training run starts
card: system-design
kind: tradeoff
level: 4
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [rollback, manifest, content-addressed, reproducibility]
minutes: 20
lessons: [phases/10-llms-from-scratch/13-building-complete-llm-pipeline]
manuals: []
practice: []
cheatsheet: [llm-pipeline-capstone]
related: [system-design/eval-platform-ship-gate, system-design/finetune-pipeline-design]
updated: 2026-11-03
---

Một pipeline huấn luyện mười hai giai đoạn chạy từ tokenizer tới server suy luận, và giai đoạn tiền huấn luyện tốn nhiều tuần và hàng triệu đô la. Trước khi lần chạy bắt đầu, bạn phải viết điều xảy ra khi mỗi giai đoạn thất bại. Trình bày kế hoạch, giải thích bộ điều phối tính những gì phải chạy lại bằng cách nào, và nói "tái lập lần chạy" có thể và không thể hứa gì.

## Short answer

Sắp các giai đoạn theo chi phí chạy lại: tokenizer, đánh giá, lượng tử hóa và server rẻ và chạy lại trong vài giờ, tinh chỉnh có giám sát và alignment mất nhiều ngày, nên checkpoint cơ sở được giữ và chỉ các giai đoạn đó chạy lại, và tiền huấn luyện mất nhiều tuần cùng một ngân sách hàng triệu, nên kế hoạch là checkpoint tốt cuối cùng với các giai đoạn phía sau được sửa đổi. Tập chạy lại rút ra từ đồ thị phụ thuộc có kiểu, có hash: vô hiệu hóa giai đoạn thất bại và mọi hậu duệ. Một lần phát lại hứa cùng mã, công thức và các hash dữ liệu nguồn cùng các chỉ số chính, không phải các trọng số giống hệt từng bit hoặc cùng các hash đầu ra.

## Full answer

### Three cost classes

| Lớp | Các giai đoạn | Kế hoạch khi thất bại |
|---|---|---|
| Rẻ, vài giờ | Tokenizer, đánh giá, lượng tử hóa, server suy luận | Chạy lại |
| Trung bình, nhiều ngày | SFT, DPO, tinh luyện hiến pháp | Giữ mô hình cơ sở, chạy lại alignment |
| Đắt, nhiều tuần và hàng triệu | Tiền huấn luyện | Checkpoint tốt cuối cùng cùng các giai đoạn phía sau được sửa đổi |

Viết điều này trước lần chạy nghĩa là không ai ứng biến lúc bốn giờ sáng với một nhóm kiệt sức.

### How the rerun set is computed

Mọi giai đoạn có các đầu vào và đầu ra có kiểu, và hash đầu ra của một giai đoạn là hash đầu vào của giai đoạn tiếp theo. Một lỗi ở giai đoạn SFT vô hiệu hóa nó và mọi hậu duệ: mô hình phần thưởng, policy DPO, policy tinh luyện, báo cáo đánh giá, các trọng số lượng tử hóa và server, tức các giai đoạn sáu đến mười hai. Một lỗi ở lượng tử hóa chỉ vô hiệu hóa lượng tử hóa và server. Bộ điều phối đọc đồ thị từ manifest, nên tập rollback được tính, không được nhớ. Một thay đổi tokenizer vô hiệu hóa mọi thứ phía sau; một thay đổi tập đánh giá chỉ vô hiệu hóa quyết định phát hành.

### Why hashes make it safe

Các artifact nằm trong một kho bất biến được định địa chỉ theo hash nội dung, không bao giờ theo một tên như latest. Một lần chạy lại một phần kiểm tra liệu mỗi đầu ra mong đợi đã tồn tại ở hash đúng chưa và bỏ qua giai đoạn nếu có. Đó cũng là cách một rollback một phần tiết kiệm phần lớn thời gian thực: các giai đoạn một đến tám giữ được cache trong khi chín đến mười hai chạy lại. Bài tập của bài học pipeline đo đúng khoản tiết kiệm đó.

### What reproduce means

Có thể tái lập: cùng manifest, mã và hạ tầng cho một checkpoint với các chỉ số phía sau tương đương. Xác định: đầu ra giống hệt từng bit. Thứ tự reduce phân tán, tính không xác định của kernel và làm tròn mixed precision khiến huấn luyện hiện đại có thể tái lập nhưng không xác định; các trọng số khác nhau ở mức khoảng 1e-5 giữa các lần chạy trong khi các chỉ số không dịch chuyển. Cách khắc phục là ghi nhật ký hash đầu vào, hash đầu ra và các chỉ số chính theo từng giai đoạn. Nếu mã, công thức và các hash dữ liệu nguồn cùng các chỉ số chính khớp, lần chạy được tái lập ngay cả khi một artifact trọng số và các hash đầu vào sau nó nhận giá trị mới, và một diff cấp bit là công cụ gỡ lỗi sai. Quy tắc của bài học rằng hash đầu vào, hash đầu ra và các chỉ số đều khớp giữ đầy đủ cho các giai đoạn có đầu ra xác định, như tokenizer và dữ liệu đánh giá; với một artifact trọng số, vốn không thể giống hệt từng bit, các chỉ số gánh phép kiểm tra.

### Budget as part of the plan

Ước lượng chi phí trước chạy dùng sáu nhân tham số nhân token cho tính toán huấn luyện, chia thông lượng đỉnh và mức sử dụng, ở đơn giá thuê. Nếu ước lượng vượt cổng chi phí, pipeline từ chối bắt đầu. Sau mỗi giai đoạn, ngân sách còn lại được kiểm tra lại, nên một vượt chi ở một giai đoạn thay đổi cổng cho giai đoạn tiếp theo thay vì được phát hiện khi tiền đã hết.

## Follow-ups

- **Level 3:** Tại sao không đặt tên các artifact theo chuỗi phiên bản? Expected: hai artifact có thể chung một tên và khác nội dung; hash là định danh, và một tên như latest là một cái bẫy.
- **Level 4:** Mô hình phần thưởng và policy DPO đều phụ thuộc vào checkpoint SFT. Điều gì có thể chạy song song và điều gì phải chờ? Expected: hai thứ có thể chạy cùng nhau sau SFT; policy tinh luyện chờ cả hai, và hash đầu vào của nó phải là một tổ hợp xác định của cả hai đầu ra.
- **Level 4:** Một checkpoint hỏng được phát hiện sau khi alignment hoàn tất. Kế hoạch nào áp dụng? Expected: lớp đắt; lấy checkpoint tiền huấn luyện tốt cuối cùng và chạy lại các giai đoạn trung bình và rẻ, không bao giờ toàn bộ tiền huấn luyện.
- **Level 4:** Một đồng đội báo lần phát lại có các trọng số khác. Lần chạy có hỏng không? Expected: không phải tự nó; so sánh mã, công thức và các hash dữ liệu nguồn cùng các chỉ số chính, và chỉ một không khớp ở đó nghĩa là lần chạy chưa được tái lập.

## Wrong answers

- "Chạy lại từ đầu cho an toàn." Giai đoạn đắt tốn nhiều tuần; đồ thị có kiểu cho bạn biết chính xác các giai đoạn nào không hợp lệ.
- "Giữ file checkpoint mới nhất và ghi đè nó mỗi bước." Một tên có thể thay đổi không thể được xác minh hoặc phát lại; định địa chỉ theo nội dung là điều khiến tập rollback đáng tin.
- "Nếu các trọng số không giống hệt từng bit, pipeline không thể tái lập." Huấn luyện phân tán không xác định; tính tái lập được định nghĩa trên mã, công thức và các hash dữ liệu nguồn cùng các chỉ số.

## Taught in

[Bài học pipeline LLM hoàn chỉnh](../../../phases/10-llms-from-scratch/13-building-complete-llm-pipeline/) cung cấp ba lớp chi phí, quy tắc hậu duệ, kho định địa chỉ theo nội dung và phân biệt giữa có thể tái lập và xác định.
