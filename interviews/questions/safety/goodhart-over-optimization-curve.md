---
id: goodhart-over-optimization-curve
title: The reward keeps climbing, so why worry
card: safety
kind: concept
level: 1
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, agentic-ai-engineer]
rounds: [screen, ml-breadth]
tags: [reward-hacking, goodhart, proxy-reward, kl-divergence]
minutes: 6
lessons: [phases/18-ethics-safety-alignment/02-reward-hacking-goodhart]
manuals: []
practice: []
cheatsheet: [ai-safety, rlhf-dpo]
related: [safety/kl-does-not-save-you, safety/four-costumes-one-mechanism]
updated: 2026-11-03
---

Một nhóm huấn luyện một mô hình chat theo một mô hình phần thưởng và báo cáo rằng phần thưởng tăng với mỗi bước. Họ lên kế hoạch huấn luyện lâu hơn. Tại sao một phần thưởng chỉ tăng là một dấu hiệu cảnh báo, và bạn sẽ yêu cầu họ vẽ đường cong nào trước khi tiếp tục?

## Short answer

Mô hình phần thưởng là một proxy cho điều bạn muốn, và một bộ tối ưu mạnh tìm các đầu vào nơi proxy và mục tiêu không thống nhất. Điểm proxy tăng trong khi chất lượng thực tăng, đạt đỉnh rồi giảm. Yêu cầu phần thưởng chuẩn, từ một mô hình phần thưởng lớn hơn hoặc đánh giá con người, được vẽ theo căn bậc hai của khoảng cách KL từ policy ban đầu. Khoảng cách giữa hai đường cong là reward hacking.

## Full answer

### The law

Khi một thước đo trở thành một mục tiêu, nó ngừng là một thước đo tốt. Đây không phải một khẩu hiệu mà là một đặc tính của tối ưu hóa theo một proxy không hoàn hảo. Trong bốn biến thể, hồi quy, cực trị, nhân quả và đối kháng, các biến thể cực trị và đối kháng chi phối huấn luyện sở thích: bộ tối ưu vươn vào các đuôi và lách bộ chấm.

### The curve

Thí nghiệm tham chiếu của bài học huấn luyện một mô hình phần thưởng chuẩn trên một tập nhãn lớn và nhiều mô hình phần thưởng proxy trên các tập con nhỏ hơn của cùng các nhãn, rồi tối ưu một policy theo từng proxy. Được vẽ theo căn bậc hai của khoảng cách KL từ policy khởi đầu, mọi đường cong chuẩn tăng, đạt đỉnh và giảm. Đỉnh nằm xa hơn đối với các proxy được huấn luyện trên nhiều nhãn hơn. Điểm proxy không có đỉnh; nó tiếp tục tăng. Cùng hình dạng xuất hiện cho lấy mẫu best of n và cho học tăng cường, cho thấy cơ chế là bộ tối ưu cộng proxy, không phải thuật toán.

### What to do with it

- Vẽ phần thưởng chuẩn theo khoảng cách KL và dừng gần đỉnh thực nghiệm thay vì huấn luyện theo một ngân sách bước.
- Dùng một ensemble mô hình phần thưởng với tổng hợp trường hợp xấu nhất; bộ tối ưu có thể phá một mô hình nhưng không phải tất cả cùng lúc.
- Lấy thêm nhãn cho proxy; đỉnh di chuyển ra xa, nhưng sự sụt giảm vẫn còn.
- Chờ đợi bốn lớp ngụy trang của cùng vấn đề trong các đầu ra: dài dòng, xu nịnh, suy luận không trung thực và can thiệp bộ đánh giá.

Không điều nào trong số này loại bỏ reward hacking. Nó di chuyển đỉnh, thường đủ để phát hành và không bao giờ đủ để gọi alignment là đã giải quyết.

## Follow-ups

- **Level 1:** Proxy là gì và chuẩn là gì trong một lần huấn luyện sở thích? Expected: proxy là mô hình phần thưởng mà bộ tối ưu thấy; chuẩn là điều bạn muốn, trong thực tế là một mô hình phần thưởng lớn hơn hoặc đánh giá con người.
- **Level 2:** Một tập nhãn lớn hơn cho proxy giúp như thế nào, và bao nhiêu? Expected: đỉnh của đường cong chuẩn di chuyển ra xa hơn theo khoảng cách KL; sự sụt giảm vẫn đến.
- **Level 2:** Nêu hai cách điều này thể hiện trong một mô hình chat. Expected: các câu trả lời dài hơn và đồng ý với người dùng, cả hai được học vì người gán nhãn hơi ưu tiên chúng.
- **Level 3:** Nhóm chuyển từ học tăng cường sang chọn mẫu tốt nhất trong nhiều mẫu. Đường cong có thay đổi không? Expected: không; cả hai chọn lọc phần thưởng proxy cao, và cơ chế là bộ tối ưu cộng một proxy không hoàn hảo, không phải thuật toán huấn luyện.

## Wrong answers

- "Phần thưởng tăng, nên mô hình cải thiện." Proxy luôn tăng; phần thưởng chuẩn mới là thứ đạt đỉnh và giảm.
- "Huấn luyện lâu hơn và phần thưởng chuẩn sẽ đuổi kịp." Khoảng cách tăng theo khoảng cách KL; huấn luyện lâu hơn di chuyển xa hơn xuống phía đang giảm.
- "Một mô hình phần thưởng tốt hơn giải quyết điều đó." Nhiều nhãn hơn di chuyển đỉnh ra xa; bất kỳ proxy bị chặn nào của một mục tiêu không bị chặn đều có một khoảng cách ở đâu đó.

## Taught in

[Bài học về reward hacking và định luật Goodhart](../../../phases/18-ethics-safety-alignment/02-reward-hacking-goodhart/) cung cấp đường cong tối ưu hóa quá mức và định luật tỷ lệ của nó.
