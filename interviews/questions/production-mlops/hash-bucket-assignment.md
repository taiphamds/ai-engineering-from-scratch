---
id: hash-bucket-assignment
title: Read the prompt router's experiment assignment
card: production-mlops
kind: code-reading
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [coding, debugging]
tags: [ab-testing, assignment, hashing, prompt-versions]
minutes: 8
lessons: [phases/11-llm-engineering/13-production-app]
manuals: []
practice: []
cheatsheet: [production-llm-app, progressive-delivery]
related: [production-mlops/split-ratio-mismatch, production-mlops/evals-or-ab-test]
updated: 2026-11-03
---

Hàm này từ ứng dụng production chọn phiên bản prompt cho một yêu cầu. Giải thích nó làm gì, tại sao nó hash user id cùng tên thí nghiệm, và số 10 trong cấu hình thí nghiệm có nghĩa gì cho một người dùng qua một tuần.

```python
AB_EXPERIMENTS = {
    "general_chat_v2_test": {
        "template": "general_chat",
        "control": "v1",
        "variant": "v2",
        "traffic_pct": 10,
    },
}


def select_prompt(template_name, user_id, variables):
    versions = PROMPT_TEMPLATES.get(template_name)
    if not versions:
        raise ValueError(f"Unknown template: {template_name}")
    version = "v1"
    for exp_name, exp in AB_EXPERIMENTS.items():
        if exp["template"] == template_name:
            bucket = int(hashlib.md5(f"{user_id}:{exp_name}".encode()).hexdigest(), 16) % 100
            if bucket < exp["traffic_pct"]:
                version = exp["variant"]
            else:
                version = exp["control"]
            break
    template = versions.get(version, versions["v1"])
    return template, template.template.format(**variables)
```

## Short answer

Mã hash user id cộng tên thí nghiệm, lấy kết quả modulo 100, và gửi các người dùng có bucket dưới phần trăm lưu lượng đến biến thể. Hash có tính xác định, nên một người dùng rơi vào cùng nhánh trên mọi yêu cầu trong suốt thí nghiệm. Tên thí nghiệm trong hash giữ các bucket của hai thí nghiệm độc lập, để những người dùng thấy biến thể trong một kiểm thử không phải cùng những người dùng trong kiểm thử tiếp theo. Với phần trăm lưu lượng 10, khoảng một phần mười người dùng thấy biến thể trên mọi yêu cầu cả tuần, và các người khác không bao giờ thấy.

## Full answer

### Line by line

1. Phiên bản mặc định là `v1`, nên một mẫu không có thí nghiệm luôn được phân giải.
2. Vòng lặp tìm thí nghiệm cho mẫu này và dừng ở lần khớp đầu. Một thí nghiệm mỗi mẫu tại một thời điểm.
3. Bucket là một hash của `user_id:exp_name`, được đọc như một số nguyên và giảm modulo 100. Điều đó cho một giá trị từ 0 đến 99.
4. Một bucket dưới `traffic_pct` nhận biến thể, và mọi bucket khác nhận đối chứng.
5. Mẫu render với các biến yêu cầu.

### Why the hash is deterministic

Bài học nói rõ: hash user id, không rút ngẫu nhiên. Một lần rút ngẫu nhiên mỗi yêu cầu sẽ chuyển một người dùng giữa hai prompt, nên người dùng thấy hai hành vi và các chỉ số theo người dùng trộn cả hai nhánh. Một nhánh ổn định mỗi người dùng cũng khiến số phơi lộ là số người dùng, điều phân tích thí nghiệm cần.

### Why the experiment name is in the key

Không có nó, bucket của một người dùng giống nhau trong mọi thí nghiệm, nên cùng một phần mười người dùng sẽ là nhóm biến thể mỗi lần. Các thí nghiệm sẽ có tương quan, và tác động của một thí nghiệm mang sang thí nghiệm tiếp theo. Tên thí nghiệm đóng vai một salt cho mỗi thí nghiệm phần chia riêng.

### What to watch

- Modulo 100 cho các bước một phần trăm. Một tỷ phần nhỏ hơn cần một modulus lớn hơn.
- Demo chạy 1000 user id tổng hợp qua bộ chọn và in các tỷ phần đối chứng và biến thể. Đó là một kiểm tra tỷ lệ mẫu rẻ, và nó thuộc về một kiểm thử.
- `break` có nghĩa một thí nghiệm thứ hai trên cùng mẫu không bao giờ chạy. Hình dạng cấu hình khiến điều đó nhìn thấy, nhưng không gì cảnh báo bạn.

## Follow-ups

- **Level 2:** Tại sao một người dùng ở lại cùng nhánh qua các yêu cầu? Expected: hash của cùng user id và tên thí nghiệm cho cùng bucket mỗi lần.
- **Level 2:** Hai thí nghiệm được cấu hình cho cùng mẫu. Điều gì xảy ra? Expected: vòng lặp lấy lần khớp đầu và break, nên thí nghiệm thứ hai không bao giờ phân ai.
- **Level 3:** Tại sao không chỉ hash user id? Expected: cùng người dùng sẽ rơi vào biến thể của mọi thí nghiệm, nên các thí nghiệm có tương quan và các tác động mang sang trộn kết quả.
- **Level 3:** Demo kiểm tra phần chia như thế nào, và bạn sẽ thêm gì? Expected: nó chạy 1000 id tổng hợp qua bộ chọn và in cả hai tỷ phần. Thêm cùng kiểm tra trên các log phơi lộ thực như một kiểm tra tỷ lệ mẫu.

## Wrong answers

- "Một lần rút ngẫu nhiên dưới phần trăm sẽ đơn giản hơn và giống nhau." Nó phân theo yêu cầu, nên một người dùng chuyển giữa các nhánh và thấy cả hai prompt.
- "Hàm hash yếu, nên phân nhóm hỏng." Hash không phải một kiểm soát bảo mật ở đây. Nó chỉ phải có tính xác định và phân bố tốt.
- "Phần trăm là tỷ phần yêu cầu." Nó là tỷ phần người dùng, vì bucket theo người dùng và giữ cố định.

## Taught in

[Bài học ứng dụng production](../../../phases/11-llm-engineering/13-production-app/) xây bộ định tuyến prompt với phân thí nghiệm dựa trên hash và kiểm tra phần chia trong demo.
