---
id: acceptance-fell-after-upgrade
title: Mean latency improved and the tail got worse
card: tokenization-decoding
kind: debug
level: 4
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, system-design]
tags: [speculative-decoding, acceptance-rate, draft-drift, tail-latency, monitoring]
minutes: 12
lessons: [phases/19-capstone-projects/14-speculative-decoding-server, phases/17-infrastructure-and-production/05-eagle3-speculative-decoding, phases/10-llms-from-scratch/15-speculative-decoding-eagle3]
manuals: []
practice: []
cheatsheet: [speculative-decoding]
related: [tokenization-decoding/choose-the-draft-for-a-new-model, tokenization-decoding/speedup-from-alpha]
updated: 2026-11-03
---

Hai thay đổi được phát hành trong một tuần: mô hình đích chuyển lên phiên bản tiếp theo, và một khách hàng mới có lưu lượng phần lớn là mã được định tuyến lên cùng cụm. Giải mã suy đoán đã bật nhiều tháng. Từ đó, độ trễ liên token trung bình giảm 25 phần trăm, P99 tăng 15 phần trăm, và thông lượng ở mức đồng thời thường dùng giảm. Chẩn đoán.

## Short answer

Cả hai thay đổi đánh vào sự chấp nhận. Draft head được huấn luyện theo phiên bản đích trước, nên phân phối của nó trôi dạt và nhiều draft bị từ chối hơn; lưu lượng mã dịch phân phối đầu vào khỏi dữ liệu chat chung mà head được huấn luyện trên đó, nơi sự chấp nhận rơi vào dải 0.4 đến 0.6. Một draft bị từ chối tốn một lần xác minh và một lần lấy lại, hai lượt nối tiếp dưới một batch đầy, đúng là một đuôi tệ hơn trong khi trung bình vẫn cải thiện. Đọc sự chấp nhận theo từng lát lưu lượng và từng phiên bản đích từ các chỉ số suy đoán của engine, huấn luyện lại hoặc quay về một head aligned với đích mới, và chặn qua cổng suy đoán theo từng lớp yêu cầu.

## Full answer

### Why mean and tail move in opposite directions

Phần lớn các yêu cầu vẫn chấp nhận phần lớn các draft, nên độ trễ liên token của chúng giảm và trung bình cải thiện. Các yêu cầu từ chối sớm trả phí các bước draft, lần xác minh và một lượt đích thứ hai cho hiệu chỉnh, và dưới một batch đầy các lượt đó xếp hàng sau nhau. Đuôi là nơi các yêu cầu bị từ chối nằm. Theo dõi P99, không phải P50.

### Cause one: a draft one version behind

Một draft trạng thái ẩn được huấn luyện để dự đoán token tiếp theo của một đích cụ thể từ các feature của đích đó. Một phiên bản đích mới thay đổi các feature và phân phối, và mức đồng thuận của draft với nó giảm. Bài tập đầu tiên của capstone là đo suy giảm này và xây cảnh báo cho nó.

### Cause two: a domain the head never saw

Một head được huấn luyện trên chat chung nằm ở mức chấp nhận 0.6 đến 0.8 ở đó và ở 0.4 đến 0.6 trên lưu lượng mã, y tế hoặc pháp lý. Các token mã có thể dự đoán với một draft được huấn luyện trên mã, và được dự đoán kém bởi một draft không được huấn luyện như vậy. Dưới mức chấp nhận khoảng 0.55 ở độ đồng thời cao, suy đoán có lợi ích ròng âm, nên khách hàng mới có thể đã đẩy cụm xuống dưới sàn.

### The diagnosis

1. Lấy các token draft được chấp nhận và các token draft được đề xuất theo từng yêu cầu từ engine, chia số đầu cho số sau, và tách theo phiên bản đích và theo khách hàng hoặc lớp yêu cầu. Một con số cho toàn cụm giấu cả hai nguyên nhân.
2. So sánh lát chat trước và sau nâng cấp: nếu nó giảm, drift phiên bản là thật.
3. So sánh lát mã với lát chat ở cùng phiên bản: nếu nó nằm thấp hơn nhiều, dịch chuyển lĩnh vực là thật.
4. Xác nhận câu chuyện đuôi bằng cách chia bucket P99 theo sự chấp nhận; đuôi chậm nên là lát chấp nhận thấp.

### The fix

- Huấn luyện lại head theo phiên bản đích mới, hoặc rollback đích cho đến khi head aligned sẵn sàng.
- Định tuyến khách hàng mã tới một pool giải mã thuần, hoặc huấn luyện một head riêng cho mã; công việc huấn luyện nhẹ so với fine-tuning đích.
- Chặn qua cổng suy đoán theo từng lớp yêu cầu dựa trên sự chấp nhận được đo, với một fallback n-gram hoặc không draft dưới sàn.
- Cảnh báo sự chấp nhận theo từng lát để lần tăng phiên bản tiếp theo không thể phát hành thiếu draft.

## Follow-ups

- **Level 3:** Tại sao trung bình có thể cải thiện trong khi thông lượng giảm? Expected: các yêu cầu được chấp nhận nhanh hơn, nhưng các yêu cầu bị từ chối tiêu hai lượt đích mỗi yêu cầu, và ở một batch đầy công việc thêm đó chiếm chỗ các yêu cầu khác.
- **Level 4:** Thiết kế cảnh báo trong hai câu. Expected: tính sự chấp nhận theo từng lát và từng phiên bản đích trên một cửa sổ ngắn và so với baseline được ghi lúc rollout; gọi người khi một lát vượt qua sàn hoặc giảm một tỷ lệ cố định so với baseline.
- **Level 4:** Fallback là gì khi sự chấp nhận chỉ giảm trên một lát? Expected: chuyển lát đó sang một draft n-gram hoặc sang giải mã thuần trong khi head được huấn luyện lại, và giữ suy đoán ở nơi nó vẫn mang lợi ích.
- **Level 4:** Điều này thay đổi quy trình phát hành của bạn như thế nào? Expected: một nâng cấp đích phát hành cùng một draft được huấn luyện theo nó, và benchmark làm cổng phát hành báo cáo sự chấp nhận và P99 theo từng lát.

## Wrong answers

- "Tăng độ dài draft để lấy lại thông lượng." Nhiều draft hơn ở mức chấp nhận thấp phần lớn bị từ chối và chi phí của chúng vẫn được trả; đuôi tệ hơn.
- "Tắt suy đoán ở mọi nơi." Lát chat có thể vẫn mang lợi ích; đặt cổng theo lát và sửa head.
- "Đích mới chỉ chậm hơn; suy đoán không liên quan." Một benchmark giải mã thuần của đích mới giải quyết điều đó trong vài phút, và trung bình cải thiện trong khi đuôi tệ hơn chỉ tới các lần từ chối.

## Taught in

[Capstone server giải mã suy đoán](../../../phases/19-capstone-projects/14-speculative-decoding-server/) đặt ra đo drift và các bài tập fallback, [bài học EAGLE-3 production](../../../phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/) giải thích đuôi và sàn chấp nhận, và [bài học EAGLE-3](../../../phases/10-llms-from-scratch/15-speculative-decoding-eagle3/) giải thích tại sao draft gắn với một phiên bản đích.
