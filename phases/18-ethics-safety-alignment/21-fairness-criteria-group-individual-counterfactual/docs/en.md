# Fairness Criteria — Group, Individual, Counterfactual

> Ba họ cấu trúc tài liệu công bằng. Công bằng nhóm: ngang bằng nhân khẩu học, cân bằng odds, bình đẳng độ chính xác sử dụng có điều kiện — tỷ lệ bằng nhau giữa nhóm được bảo vệ tính trung bình. Công bằng cá nhân (Dwork và cộng sự 2012): cá nhân tương tự nhận quyết định tương tự; điều kiện Lipschitz trên ánh xạ quyết định. Công bằng phản thực (Kusner và cộng sự 2017): quyết định công bằng với cá nhân nếu không đổi khi thuộc tính nhạy cảm được thay phản thực. Kết quả lý thuyết 2024 (NeurIPS 2024): có đánh đổi CF-với-độ chính xác vốn có; phương pháp không phụ thuộc mô hình chuyển bộ dự đoán tối ưu-nhưng-không công bằng thành bộ CF với mất độ chính xác bị chặn. Phản thực truy ngược (arXiv:2401.13935, tháng 1 năm 2024): mô hình mới tránh yêu cầu can thiệp lên thuộc tính được pháp luật bảo vệ. Hòa giải triết học (ICLR Blogposts 2024): với đồ thị nhân quả, thỏa mãn một số thước đo công bằng nhóm kéo theo công bằng phản thực.

**Type:** Learn
**Languages:** Python (stdlib, three-criteria comparison)
**Prerequisites:** Phase 18 · 20 (bias), Phase 02 (classical ML)
**Time:** ~60 minutes

## Learning Objectives

- Nêu ba tiêu chí công bằng nhóm (ngang bằng nhân khẩu học, cân bằng odds, bình đẳng độ chính xác sử dụng có điều kiện) và một kết quả bất khả thi.
- Mô tả công bằng cá nhân qua công thức Lipschitz của Dwork và cộng sự 2012.
- Mô tả công bằng phản thực và phụ thuộc đồ thị nhân quả.
- Giải thích phản thực truy ngược và tại sao tránh được vấn đề can thiệp lên thuộc tính được bảo vệ.

## The Problem

Bài 20 nói về đo thiên lệch. Bài 21 nói về định nghĩa tiêu chuẩn công bằng mà phép đo nên phục vụ. Ba họ đưa tiêu chuẩn khác cấu trúc — mô hình có thể công bằng nhóm và không công bằng cá nhân, công bằng phản thực và không công bằng nhóm. Chọn tiêu chuẩn là quyết định chính sách; không tiêu chuẩn nào tối ưu phổ quát.

## The Concept

### Group fairness

- **Ngang bằng nhân khẩu học.** P(Y=1 | A=a) = P(Y=1 | A=a') cho mọi nhóm. Tỷ lệ chấp nhận bằng nhau.
- **Cân bằng odds.** P(Y=1 | Y*=y, A=a) = P(Y=1 | Y*=y, A=a'). TPR và FPR bằng nhau giữa nhóm.
- **Bình đẳng độ chính xác sử dụng có điều kiện.** P(Y*=y | Y=y, A=a) = P(Y*=y | Y=y, A=a'). Giá trị dự đoán bằng nhau giữa nhóm.

Bất khả thi (Chouldechova, Kleinberg-Mullainathan-Raghavan 2017): không thể đồng thời thỏa mãn cả ba khi tỷ lệ nền không bằng nhau.

### Individual fairness

Dwork và cộng sự 2012. Ánh xạ quyết định f công bằng cá nhân theo thước đo tương đồng riêng cho tác vụ d nếu |f(x) - f(x')| <= L * d(x, x') với một hằng số Lipschitz L nào đó. Cá nhân tương tự nhận quyết định tương tự.

Cần định nghĩa d. Câu hỏi chính sách, không phải thống kê.

### Counterfactual fairness

Kusner và cộng sự 2017. Quyết định công bằng phản thực với cá nhân i nếu, dưới mô hình nhân quả của quần thể, quyết định không đổi khi thuộc tính nhạy cảm của i được thay phản thực.

Cần DAG nhân quả. DAG là lựa chọn mô hình hóa. Công bằng phản thực chỉ có cơ sở đến mức DAG có cơ sở.

### The CF-vs-accuracy trade-off

Lý thuyết NeurIPS 2024: có đánh đổi vốn có giữa công bằng phản thực và độ chính xác dự đoán. Phương pháp không phụ thuộc mô hình chuyển được bộ dự đoán tối ưu-nhưng-không công bằng thành bộ CF, với chi phí độ chính xác bị chặn. Chi phí độ chính xác phụ thuộc độ lớn hệ số thuộc tính nhạy cảm trong bộ dự đoán không công bằng tối ưu.

### Backtracking counterfactuals

arXiv:2401.13935 (tháng 1 năm 2024). Phản thực truyền thống cần can thiệp lên thuộc tính nhạy cảm — "quyết định có thay đổi nếu người này thuộc giới khác không." Về pháp lý, có vấn đề: không thể can thiệp lên thuộc tính được bảo vệ trong luật phân loại.

Phản thực truy ngược đảo hướng: thay vì can thiệp thuộc tính, hỏi tổ hợp đặc trưng thực nào của cá nhân sẽ tạo kết quả phản thực. Điều này tránh phản đối pháp lý.

### Philosophical reconciliation

ICLR Blogposts 2024. Với đồ thị nhân quả trong tay, thỏa mãn một số thước đo công bằng nhóm kéo theo công bằng phản thực. Ba họ không trực giao; là mặt khác nhau của cùng cấu trúc nhân quả nền.

Điều này không giải quyết định lý bất khả thi (tỷ lệ nền không bằng nhau vẫn ngăn công bằng nhóm đồng thời). Nhưng cho thấy đối lập biểu kiến giữa "nhóm" và "cá nhân / phản thực" một phần là tạo tác của việc không nêu tường minh mô hình nhân quả.

### Where this fits in Phase 18

Bài 20 là đo thiên lệch. Bài 21 là định nghĩa công bằng. Bài 22 là quyền riêng tư (quyền riêng tư vi sai). Bài 23 là watermark. Đây là các bài gần phân bổ bổ sung Bài 7-11 gần lừa dối.

```figure
an-fairness-trilemma
```

## Use It

`code/main.py` xây tập dữ liệu phân loại nhị phân đơn giản có thuộc tính nhạy cảm và tỷ lệ nền không bằng nhau. Tính ngang bằng nhân khẩu học, cân bằng odds và bình đẳng độ chính xác sử dụng có điều kiện trên bộ phân loại đơn giản. Quan sát ba chỉ số bất đồng. Áp dụng điều chỉnh trọng số cho ngang bằng nhân khẩu học và quan sát chi phí trên hai chỉ số còn lại.

## Ship It

Bài học này tạo ra `outputs/skill-fairness-criterion.md`. Với khẳng định hoặc chính sách công bằng, xác định tiêu chí được khẳng định, mô hình có thỏa mãn tiêu chí còn lại dưới tỷ lệ nền không bằng nhau được nêu không, và khẳng định phụ thuộc DAG nhân quả nào.

## Exercises

1. Chạy `code/main.py`. Báo cáo ba chỉ số nhóm trên dữ liệu mặc định. Áp dụng điều chỉnh trọng số nhắm ngang bằng nhân khẩu học và báo cáo lại.

2. Triển khai chỉ số công bằng cá nhân Dwork và cộng sự 2012 bằng L2 trên đặc trưng không nhạy cảm. Báo cáo bao nhiêu cặp vi phạm Lipschitz với hằng số L=1.

3. Đọc Kusner và cộng sự 2017. Xây DAG nhân quả hai đặc trưng đơn giản cho chấm hồ sơ và xác định điều kiện công bằng phản thực nó hàm ý.

4. Bài báo phản thực truy ngược 2024 tránh can thiệp thuộc tính được bảo vệ. Mô tả kịch bản điều này quan trọng cho tuân thủ pháp lý.

5. Hòa giải ICLR 2024 lập luận công bằng nhóm và phản thực là các mặt cùng cấu trúc. Chọn hai trong ba tiêu chí trong `code/main.py` và nêu giả định nhân quả khiến chúng tương đương.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Demographic parity (Ngang bằng nhân khẩu học) | "tỷ lệ bằng nhau" | P(Y=1 | A=a) bằng nhau giữa nhóm |
| Equalized odds (Cân bằng odds) | "TPR/FPR bằng nhau" | Tỷ lệ dương tính thật và dương tính giả bằng nhau giữa nhóm |
| Conditional use accuracy (Độ chính xác sử dụng có điều kiện) | "PPV/NPV bằng nhau" | Giá trị dự đoán bằng nhau giữa nhóm |
| Individual fairness (Công bằng cá nhân) | "điều kiện Lipschitz" | Cá nhân tương tự nhận quyết định tương tự |
| Counterfactual fairness (Công bằng phản thực) | "bất biến thay đổi nhân quả" | Quyết định không đổi dưới thay thuộc tính phản thực |
| Backtracking counterfactual (Phản thực truy ngược) | "giải thích qua thực tế" | Phản thực suy ngược từ kết quả, không xuôi từ thuộc tính |
| Impossibility theorem (Định lý bất khả thi) | "ba tiêu chí xung đột" | Chouldechova / KMR 2017: tiêu chí nhóm loại trừ nhau dưới tỷ lệ nền không bằng nhau |

## Further Reading

- [Dwork et al. — Fairness through Awareness (arXiv:1104.3913)](https://arxiv.org/abs/1104.3913) — công bằng cá nhân
- [Kusner, Loftus, Russell, Silva — Counterfactual Fairness (arXiv:1703.06856)](https://arxiv.org/abs/1703.06856) — công bằng phản thực
- [Chouldechova — Fair prediction with disparate impact (arXiv:1703.00056)](https://arxiv.org/abs/1703.00056) — bất khả thi
- [Backtracking Counterfactuals (arXiv:2401.13935)](https://arxiv.org/abs/2401.13935) — mô hình mới cho can thiệp thuộc tính được bảo vệ
