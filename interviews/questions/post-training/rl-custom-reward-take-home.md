---
id: rl-custom-reward-take-home
title: Write and prove a custom reward for GRPO
card: post-training
kind: take-home
level: 3
roles: [applied-ai-engineer, inference-engineer]
rounds: [take-home, coding]
tags: [grpo, reward-function, custom-reward, float32, miles]
minutes: 30
lessons: []
manuals: [miles-101#s-write-a-custom-reward, miles-101#s-how-rollout-functions-plug-in, miles-101#s-troubleshoot-by-symptom, miles-101#s-keep-runs-comparable]
practice: [grpo-advantages]
cheatsheet: [miles-rl]
related: [post-training/grpo-groups-teach-nothing]
updated: 2026-11-03
---

Bài làm ở nhà. Framework RL bạn dùng chấm mỗi câu trả lời lấy mẫu bằng một hàm reward bạn thay bằng đường dẫn import. Viết một reward cho một tác vụ có đáp án cuối dạng số, viết một kế hoạch kiểm thử cho nó, và giải thích cách bạn sẽ chứng minh reward không làm hỏng các advantage GRPO trước một lần chạy dài. Giữ hàm và kế hoạch đủ ngắn để đọc trong năm phút.

## Short answer

Viết một hàm async nhận các đối số lần chạy và một mẫu, trích xuất số cuối từ câu trả lời và từ nhãn, và trả về 1.0 nếu khớp và 0.0 nếu không, so sánh như giá trị để 142 không bao giờ khớp 42. Kiểm thử nó trên mười câu trả lời bạn chấm bằng tay, với một câu đúng, một câu sai, một câu trống và một câu bị cắt ở giới hạn độ dài, vì một reward crash trên câu trả lời trống dừng rollout của toàn bộ bước. Sau đó kiểm tra các advantage: một nhóm mà mọi câu trả lời nhận cùng reward phải nhận advantage 0 cho mọi thành viên, và một reward phân số có thể làm điều đó thất bại qua làm tròn float32.

## Full answer

### The function

```python
import re


def last_number(text):
    found = re.findall(r"-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?", text.replace(",", ""))
    return float(found[-1]) if found else None


async def custom_rm(args, sample, **kwargs):
    answer = last_number(sample.response)
    label = last_number(str(sample.label))
    return 1.0 if answer is not None and answer == label else 0.0
```

Ba quy tắc từ tài liệu. Viết nó như `async def`, vì framework await kết quả và một hàm thông thường thất bại ở lời gọi đầu. Hàm nhận các đối số lần chạy và một mẫu, với câu trả lời trong `sample.response` và nhãn trong `sample.label`. Nếu nó trả về một dict, nêu tên trường giữ reward bằng cờ reward key; với cờ group, hàm nhận toàn bộ nhóm như một list và trả về một reward mỗi mẫu.

### Plug it in

Lưu module trong thư mục lab được mount, đặt thư mục đó trên `PYTHONPATH`, và truyền đường dẫn import bằng `--custom-rm-path my_rewards.custom_rm`. Khi import hoạt động, dòng `rollout 0` đầu hiển thị một reward hàm của bạn tạo. Khi không, log hiển thị `ModuleNotFoundError`, và lần chạy không tự dừng. Kiểm thử của tài liệu giữ chạy hai giờ không có bước nào, và watchdog không kích hoạt, vì engine chỉ ghi 44 dòng lỗi. Dừng container, sửa đường dẫn, và bắt đầu lại.

### The test plan

1. Một lời gọi bên trong container trên một mẫu viết tay trước bất kỳ công việc GPU nào: câu trả lời "Vậy đáp án là 42." với nhãn "42" phải trả về 1.0.
2. Mười câu trả lời chấm bằng tay: đúng, sai, đúng trong một định dạng khác, một số có dấu phẩy, một câu trả lời trống, một câu trả lời không có số, một câu trả lời bị cắt ở giới hạn độ dài, một nhãn âm, một nhãn thập phân, và một câu trả lời có hai số mà số cuối đúng.
3. Một lần chạy hai bước với reward được đặt vào; đọc `rollout/raw_reward` ở bước đầu và so sánh một vài mẫu được ghi log với các điểm bằng tay.

### Prove the advantages

GRPO trừ trung bình nhóm khỏi mỗi reward và chia cho độ lệch chuẩn nhóm. Một reward nhị phân cho một trung bình chính xác, nên một nhóm reward bằng nhau nhận chính xác 0 cho mọi thành viên. Một reward phân số có thể thất bại: trong float32, trung bình của 16 reward 0.3 không chính xác là 0.3, và phép chia cho một độ lệch chuẩn gần 0 làm phần dư phồng lên khoảng 0.029 mỗi câu trả lời. Nếu bạn chuyển sang điểm một phần, dùng các giá trị một float32 giữ chính xác, như các bội của 0.25, và kiểm tra một nhóm reward bằng nhau có các advantage không trước lần chạy dài.

### Use the smallest hook

Một quy tắc chấm điểm chỉ cần hook reward. Bộ lọc nhóm và hàm generate giữ nguyên, nên batching, các chỉ số và các kiểm tra khoảng cách tiếp tục hoạt động cho bạn.

## Follow-ups

- **Level 3:** Tại sao so sánh các số như giá trị và không như chuỗi? Expected: để một số không ở cuối hoặc một dấu phẩy không làm sai một đáp án đúng, và để 142 không khớp 42 bằng chuỗi con.
- **Level 3:** Tác vụ có một câu trả lời văn bản tự do. Điều gì thay đổi? Expected: việc trích xuất; dùng một bộ chấm overlap hoặc trắc nghiệm tích hợp khi có loại phù hợp, vì nó đã được kiểm thử, và giữ cùng kế hoạch kiểm thử mười câu trả lời.
- **Level 4:** Reward tích hợp nào cho âm một khi một đáp án sai, và điều đó thay đổi gì phía sau? Expected: reward kiểu DAPO trả về một dict với điểm, nên nó cần cờ reward key; dấu thay đổi trung bình, không phải thuộc tính advantage không của một reward hai giá trị.
- **Level 4:** Bạn sẽ kiểm thử một thay đổi reward không có rollout mới như thế nào? Expected: lưu các mẫu rollout của một lần chạy và phát lại chúng chỉ với trainer, để mọi reward ứng viên chấm cùng mẫu.

## Wrong answers

- "Viết một hàm thông thường; trợ giúp cờ cho thấy một hàm như vậy." Framework await kết quả, nên một hàm thông thường thất bại ở lời gọi đầu; viết nó như một hàm async.
- "Trả về bất kỳ float nào giữa 0 và 1 cho điểm một phần; GRPO xử lý nó." Các phân số float32 không thể giữ chính xác cho các nhóm reward bằng nhau một advantage khác không; làm tròn về các giá trị chính xác và kiểm thử một nhóm như vậy.
- "Bỏ trường hợp câu trả lời trống; mô hình luôn viết gì đó." Một câu trả lời bị cắt hoặc trống đến reward mỗi bước, và một crash ở đó dừng toàn bộ rollout.

## Taught in

[Phần 3.5 của Miles 101](../../../manuals/miles-101/sections/3-5-write-a-custom-reward.md) đưa ra hàm, các quy tắc import và kiểm tra advantage float32, và [phần 8.5](../../../manuals/miles-101/sections/8-5-how-rollout-functions-plug-in.md) giải thích tại sao hook reward là hook nhỏ nhất cho thay đổi này.
