---
id: gate-aggregation-table
title: Walk three requests through the gate's aggregator
card: safety
kind: code-reading
level: 3
roles: [agentic-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [coding, system-design]
tags: [safety-gate, aggregation, severity, streaming-filter, trace]
minutes: 12
lessons: [phases/19-capstone-projects/87-end-to-end-safety-gate]
manuals: []
practice: []
cheatsheet: [guardrails-moderation]
related: [safety/output-router-severity, safety/rule-needs-three-parts]
updated: 2026-11-03
---

Đọc bước tổng hợp của cổng an toàn bên dưới. Đưa ba yêu cầu qua nó: một prompt mà bộ phát hiện đánh dấu trên ngưỡng chặn, một prompt lành tính có stream bị cắt sớm, và một prompt lành tính có đầu ra kích hoạt một quy tắc mức nghiêm trọng cao. Rồi nói bảng này làm sai điều gì theo thiết kế.

```python
SEVERITY_RANK = {"none": 0, "low": 1, "medium": 2, "high": 3}

def _aggregate(self, pre, during, post):
    signals = []
    if pre.category != "benign":
        if pre.confidence >= self.block_confidence:
            signals.append(("pre", SEVERITY_RANK["high"]))
        elif pre.confidence >= self.note_confidence:
            signals.append(("pre", SEVERITY_RANK["medium"]))
        else:
            signals.append(("pre", SEVERITY_RANK["low"]))
    if during.terminated_early:
        signals.append(("during", SEVERITY_RANK["medium"]))
    if post is not None:
        signals.append(("post.classifier", SEVERITY_RANK.get(post.classifier_severity, 0)))
        if post.rules_max_severity:
            signals.append(("post.rules", SEVERITY_RANK.get(post.rules_max_severity, 0)))
    if not signals:
        return "allow"
    max_rank = max(rank for _, rank in signals)
    if max_rank >= SEVERITY_RANK["high"]:
        return "block"
    if max_rank >= SEVERITY_RANK["medium"]:
        return "redact"
    if max_rank >= SEVERITY_RANK["low"]:
        return "warn"
    return "allow"
```

## Short answer

Yêu cầu đầu bị chặn trước khi sinh: một danh mục không lành tính ở hoặc trên độ tin cậy chặn được xếp mức cao, và cao ánh xạ thành block. Yêu cầu thứ hai được che dữ liệu: chỉ riêng việc kết thúc sớm là một tín hiệu trung bình, nên đầu ra một phần đi qua các bộ che dữ liệu và bộ sửa. Yêu cầu thứ ba bị chặn: một mức nghiêm trọng quy tắc cao được xếp giống một mức nghiêm trọng bộ phân loại cao. Theo thiết kế, bảng lấy mức tối đa, nên các tín hiệu không bao giờ cộng dồn; ba tín hiệu thấp vẫn là warn, và một cờ bộ phát hiện trung bình cạnh một phát hiện bộ phân loại trung bình vẫn là redact.

## Full answer

### The thresholds

Cổng đặt độ tin cậy chặn ở 0.85 và độ tin cậy ghi chú ở 0.5. Một phán quyết bộ phát hiện không lành tính ở hoặc trên 0.85 là cao và chặn trước khi mô hình chạy. Giữa 0.5 và 0.85 là trung bình. Dưới 0.5 là thấp. Một phán quyết lành tính hoàn toàn không thêm tín hiệu.

### Request one: flagged prompt

Bộ phát hiện trả về một danh mục không lành tính trên 0.85. Tín hiệu trước sinh xếp cao. Cổng không bao giờ gọi mô hình; nó trả về một sự từ chối và ghi một trace với phán quyết bộ phát hiện và không có phần sau sinh.

### Request two: benign prompt, stream cut

Bộ phát hiện nói lành tính, nên không có gì từ trước sinh. Bộ lọc streaming đệm hai chunk bốn token và quét một regex các cụm từ tiếp nối trên cửa sổ; nó khớp, kết thúc iterator và đánh dấu đầu ra kết thúc sớm. Đó là một tín hiệu trung bình. Sau sinh chạy trên văn bản một phần; nếu bộ phân loại và các quy tắc trả về none, mức tối đa là trung bình và hành động là redact: các bộ che dữ liệu của bộ phân loại và bộ sửa quy tắc chạy trên đầu ra một phần, được đưa ra cùng trace.

### Request three: benign prompt, high rule

Không có tín hiệu trước sinh và không có kết thúc sớm. Bộ định tuyến phân loại trả về none. Bộ máy quy tắc trả về một vi phạm cao, chẳng hạn một tên thư viện nội bộ trong đầu ra. Tín hiệu quy tắc xếp cao và hành động là block, giống như nếu một bộ phân loại tìm thấy thứ gì đó cao.

### The limits the design accepts

- **Không tích lũy.** Mức tối đa bỏ qua bao nhiêu tín hiệu đã kích hoạt. Nhiều tín hiệu yếu cùng nhau mô tả một cuộc tấn công vẫn cảnh báo.
- **Không trọng số.** Một mức trung bình từ bộ phát hiện và một mức trung bình từ bộ phân loại mang cùng trọng lượng bất kể thành tích trước đó.
- **Một cửa sổ ngắn.** Bộ lọc streaming giữ hai chunk, nên một cụm từ tiếp nối bị chia qua nhiều chunk hơn thoát khỏi nó; lượt sau sinh là chốt chặn dự phòng, và một prefix injection chỉ lộ ra sau đó sống sót qua một cổng chỉ xem xét hậu kiểm.
- **Các ngưỡng cố định.** Bài tập của capstone đề xuất một điểm có trọng số kích hoạt tại một ngưỡng, được tinh chỉnh bằng cách quét nó theo kho ngữ liệu và đọc precision và recall theo từng danh mục.

Mục đích của cổng là trace theo từng yêu cầu với phán quyết của mọi checkpoint, hành động cuối và độ trễ, không phải một điểm hoàn hảo trên kho ngữ liệu.

## Follow-ups

- **Level 3:** Tại sao kết thúc sớm là trung bình mà không phải cao? Expected: một kết quả khớp regex trên một cửa sổ hai chunk là bằng chứng yếu hơn một phát hiện bộ phân loại cao đã xác nhận; đầu ra một phần vẫn đi qua che dữ liệu.
- **Level 3:** Một cờ bộ phát hiện thấp và một vi phạm quy tắc thấp đến cùng nhau. Điều gì được đưa ra? Expected: một warn với một thông báo nhẹ; mức tối đa của hai mức thấp là thấp, và bảng không tích lũy.
- **Level 4:** Một bộ tổng hợp có trọng số sẽ thay đổi gì, và tốn gì? Expected: các tín hiệu sẽ cộng về một ngưỡng để nhiều tín hiệu yếu có thể chặn; chi phí là một ngưỡng được tinh chỉnh, đặt bằng cách quét nó theo kho ngữ liệu và đọc precision và recall theo từng danh mục.
- **Level 4:** Bộ đệm hai chunk bỏ lỡ gì, và điều gì bắt được nó? Expected: một cụm từ tiếp nối bị chia qua nhiều chunk hơn bộ đệm giữ; lượt sau sinh là chốt chặn dự phòng.

## Wrong answers

- "Chặn bất cứ khi nào một lớp bất kỳ kích hoạt." Các tín hiệu thấp và trung bình tồn tại để các prompt lành tính có kết quả khớp yếu không bị từ chối; bảng ánh xạ chúng thành warn và redact.
- "Đặt ngưỡng chặn thấp để tiết kiệm lệnh gọi mô hình." Một ngưỡng thấp biến precision tầm trung của bộ phát hiện trên nhập vai thành các lần từ chối yêu cầu sáng tạo; capstone chặn ở 0.85.
- "Demo thoát với mã không, nên cổng bắt được mọi cuộc tấn công." Demo tự kết thúc theo thiết kế; trace là sản phẩm bàn giao, và các số đếm tóm tắt cho thấy điều gì lọt qua.

## Taught in

[Capstone cổng an toàn đầu cuối](../../../phases/19-capstone-projects/87-end-to-end-safety-gate/) cung cấp bảng tổng hợp, ba checkpoint và trace.
