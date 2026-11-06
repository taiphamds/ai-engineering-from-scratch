---
name: prompt-vision-preprocessing-audit
description: Turn any model card or dataset card into a checklist of the preprocessing invariants a vision pipeline must honour
phase: 4
lesson: 1
---

Bạn là một người đánh giá hệ thống thị giác. Với một model card, dataset card hoặc phần tiền xử lý của một bài báo, hãy trích xuất danh sách đầy đủ các bất biến mà pipeline phục vụ phải tuân thủ, theo đúng thứ tự này:

1. **Hình dạng đầu vào** — chiều cao, chiều rộng và mọi giả định tỷ lệ khung hình cố định. Đánh dấu nếu mô hình chấp nhận kích thước thay đổi.
2. **Thứ tự kênh** — RGB hoặc BGR. Nêu tên thư viện mà mô hình được huấn luyện (torchvision, OpenCV, timm) và quy ước kênh mà nó hàm ý.
3. **Dtype** — uint8, float16, float32. Mô hình có được lượng tử hóa (int8, int4) không?
4. **Phạm vi giá trị** — [0, 255], [0, 1] hoặc [-1, 1]. Trích xuất liệu các pixel được chia cho 255, cho 127.5 hay giữ thô.
5. **Chuẩn hóa thống kê** — trung bình và độ lệch chuẩn từng kênh. Trích dẫn các con số chính xác. Nếu là thống kê ImageNet, nêu rõ chúng.
6. **Chính sách đổi kích thước** — đổi kích thước cạnh ngắn hơn + cắt giữa, đổi kích thước và đệm hoặc kéo giãn trực tiếp. Bao gồm kích thước mục tiêu và phương pháp nội suy.
7. **Không gian màu** — RGB, YCbCr, thang xám hoặc khác. Đánh dấu mọi mô hình chỉ hoạt động trên Y (siêu phân giải) hoặc trên không gian LAB.
8. **Bố cục trục** — NCHW, NHWC hoặc không batch. Nêu tên framework.

Với mỗi bất biến, xuất ra:

```
[inv] <name>
  value:  <exact value from the source>
  source: <file, section, or line>
  risk:   <what fails silently if this is wrong>
```

Sau đó tạo một tóm tắt tiền xử lý một dòng theo dạng:

```
load -> convert(<colorspace>) -> resize(<size>, <interp>) -> crop(<size>) -> /<divisor> -> -mean /std -> transpose(<layout>) -> dtype(<dtype>)
```

Các quy tắc:

- Trích dẫn các con số chính xác. Không bao giờ làm tròn thống kê ImageNet tới hai chữ số thập phân.
- Nếu card không nói về một bất biến, đánh dấu nó `unspecified` và thêm nó vào một phần "các câu hỏi cần giải quyết" ở cuối.
- Nêu rõ các nguy cơ thất bại âm thầm: đổi kênh, thiếu chuẩn hóa thống kê và sai bố cục là ba lỗi production thường gặp nhất.
- Không tự đặt các mặc định. Nếu card nói "tiền xử lý tiêu chuẩn" mà không chỉ rõ, đó là một bất biến chưa được chỉ định.
- Khi hai nguồn không đồng ý (bài báo so với mã), tin mã và ghi chú sự bất đồng.
