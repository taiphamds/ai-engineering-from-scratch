# AI Myths Busted

Những quan niệm sai lầm phổ biến về AI, ML và học sâu. Mỗi quan niệm được giải thích cùng với những gì thực sự đang diễn ra.

---

## "AI understands language"

**Thực tế:** LLM dự đoán token tiếp theo dựa trên các mẫu thống kê trong dữ liệu huấn luyện. Chúng không có sự hiểu biết, niềm tin hay mô hình thế giới nào (mà chúng ta có thể chứng minh). Chúng rất giỏi khớp mẫu trên hàng tỷ ví dụ. Đầu ra trông giống như sự hiểu biết vì các mẫu đủ phong phú để bao quát hầu hết tình huống.

**Vì sao điều này quan trọng:** Nếu bạn xem LLM là một cỗ máy suy luận, bạn sẽ ngạc nhiên khi nó tự tin nói sai. Nếu xem nó là một bộ khớp mẫu, bạn sẽ thiết kế được các hệ thống tốt hơn xung quanh nó.

---

## "More parameters = smarter model"

**Thực tế:** Một mô hình 7B tham số được huấn luyện trên dữ liệu chất lượng cao bằng các kỹ thuật tốt có thể vượt trội hơn một mô hình 70B được huấn luyện trên dữ liệu rác. Chinchilla cho thấy hầu hết mô hình có quá nhiều tham số và chưa được huấn luyện đủ. Chất lượng và số lượng dữ liệu huấn luyện quan trọng ngang với kích thước mô hình. Phi-2 (2.7B) vượt qua các mô hình lớn hơn nó 10 lần trên nhiều benchmark.

**Vì sao điều này quan trọng:** Đừng mặc định chọn mô hình lớn nhất. Hãy chọn kích thước mô hình phù hợp với tác vụ và ngân sách của bạn.

---

## "Neural networks are black boxes"

**Thực tế:** Chúng ta có các công cụ để hiểu mạng nơ-ron học được gì. Trực quan hóa attention cho thấy mô hình tập trung vào những token nào. Các bộ phân loại thăm dò cho biết thông tin nào được lưu trong các biểu diễn ẩn. Khả năng diễn giải cơ chế đang tìm ra các mạch thực sự (induction head, bộ phát hiện đặc trưng). Điều này chưa minh bạch hoàn toàn, nhưng mạng nơ-ron cũng không phải hộp đen.

**Vì sao điều này quan trọng:** Bạn có thể gỡ lỗi mạng nơ-ron. Phân tích gradient, trực quan hóa activation và bản đồ attention là những công cụ thực tế được đề cập trong khóa học này.

---

## "AI will replace programmers"

**Thực tế:** AI đã thay đổi việc lập trình, chứ không thay thế nó. AI viết mã khuôn mẫu. Con người thiết kế hệ thống, đưa ra quyết định kiến trúc, rà soát tính đúng đắn và xử lý những trường hợp AI làm sai. Vai trò đã chuyển từ "viết từng dòng" sang "rà soát, định hướng và thiết kế kiến trúc". Những kỹ sư giỏi nhất dùng AI như một công cụ, chứ không sợ nó sẽ thay thế mình.

**Vì sao điều này quan trọng:** Bạn đang học kỹ thuật AI, tức là lập trình + AI. Kết hợp cả hai kỹ năng có giá trị hơn từng kỹ năng riêng lẻ.

---

## "You need a PhD in math to do AI"

**Thực tế:** Bạn cần kiến thức toán trung học cùng với các chủ đề cụ thể trong Giai đoạn 1 của khóa học này. Đại số tuyến tính, giải tích, xác suất và tối ưu hóa. Bạn không cần các chứng minh. Bạn cần trực giác về việc các phép toán thực hiện điều gì và vì sao chúng quan trọng. Nếu bạn có thể nhân ma trận và tính đạo hàm, bạn có thể xây dựng mạng nơ-ron.

**Vì sao điều này quan trọng:** Giai đoạn 1 tồn tại để cung cấp cho bạn chính xác phần toán bạn cần, không hơn.

---

## "GPT stands for General Purpose Technology"

**Thực tế:** GPT là viết tắt của Generative Pre-trained Transformer. Generative = tạo ra văn bản. Pre-trained = được huấn luyện một lần trên một kho ngữ liệu lớn trước khi được điều chỉnh. Transformer = kiến trúc trong bài báo "Attention Is All You Need" năm 2017.

---

## "Temperature makes the AI more creative"

**Thực tế:** Temperature điều chỉnh tỷ lệ các logits trước softmax. Temperature cao hơn = phân phối xác suất phẳng hơn = chọn token ngẫu nhiên hơn. Temperature thấp hơn = phân phối sắc hơn = mang tính xác định hơn. Đây không phải sự sáng tạo, mà là tính ngẫu nhiên. Mô hình có temperature cao không suy nghĩ kỹ hơn; nó chỉ cân nhắc các token ít có khả năng hơn.

**Vì sao điều này quan trọng:** Khi đầu ra quá lặp lại, hãy tăng temperature. Khi đầu ra quá hỗn loạn, hãy giảm nó. Đây chỉ là một nút điều chỉnh tính ngẫu nhiên, không hơn.

---

## "Fine-tuning teaches the model new knowledge"

**Thực tế:** Fine-tuning điều chỉnh cách mô hình sử dụng kiến thức hiện có, chứ không điều chỉnh những gì nó biết. Nếu thông tin không có trong dữ liệu tiền huấn luyện, fine-tuning sẽ không bổ sung thông tin đó một cách đáng tin cậy. Fine-tuning phù hợp hơn để thay đổi hành vi (phong cách, định dạng, giọng điệu, các mẫu đặc thù của tác vụ) thay vì bổ sung sự kiện. Để có kiến thức mới, hãy dùng RAG.

**Vì sao điều này quan trọng:** Nếu bạn cần mô hình biết về tài liệu nội bộ của công ty, hãy dùng RAG. Nếu bạn cần mô hình phản hồi theo một định dạng cụ thể, hãy fine-tune.

---

## "Bigger context window = better"

**Thực tế:** Hiệu suất của mô hình suy giảm khi ngữ cảnh dài. Vấn đề "lạc ở giữa" có nghĩa là mô hình chú ý nhiều hơn đến phần đầu và cuối của prompt dài, và ít chú ý hơn đến phần giữa. Cửa sổ ngữ cảnh 200K không có nghĩa mô hình sử dụng tốt như nhau toàn bộ 200K token. Ngoài ra, ngữ cảnh dài hơn tốn kém hơn và chậm hơn.

**Vì sao điều này quan trọng:** Đừng nhồi mọi thứ vào ngữ cảnh. Hãy chọn lọc. RAG với truy xuất có mục tiêu hiệu quả hơn việc nhét toàn bộ tài liệu vào.

---

## "AI agents are autonomous"

**Thực tế:** Các AI agent hiện nay chạy trong một vòng lặp: suy nghĩ, hành động, quan sát, lặp lại. Chúng tuân theo mẫu mà harness định nghĩa. Chúng không có mục tiêu, kế hoạch hay tự nhận thức. Chúng là các hệ thống phản ứng, dùng LLM để quyết định gọi công cụ nào tiếp theo. Tính "tự chủ" đến từ vòng lặp, chứ không phải từ AI.

**Vì sao điều này quan trọng:** Khi xây dựng agent, bạn đang xây vòng lặp, các công cụ và các rào chắn. LLM chỉ là thành phần ra quyết định bên trong hệ thống của bạn.

---

## "Transformers understand order because of positional encoding"

**Thực tế:** Transformer không có cảm nhận vốn có về thứ tự. Self-attention xem đầu vào như một tập hợp, chứ không phải một chuỗi. Positional encoding là một thủ thuật để đưa thông tin thứ tự vào bằng cách cộng các vector phụ thuộc vào vị trí vào đầu vào. Các phương pháp khác nhau (sinusoidal, learned, RoPE, ALiBi) xử lý việc này theo những cách khác nhau. Không phương pháp nào thực sự mang lại cho mô hình khả năng hiểu tuần tự như RNN từng có.

**Vì sao điều này quan trọng:** Đây là lý do nghiên cứu về positional encoding vẫn đang diễn ra. Đây là vấn đề đã được giải quyết đủ tốt cho hầu hết mục đích sử dụng, nhưng về căn bản vẫn là một giải pháp chắp vá.

---

## "Pre-training is just reading the internet"

**Thực tế:** Tiền huấn luyện là dự đoán token tiếp theo trên một kho ngữ liệu khổng lồ. Mô hình học dự đoán điều gì sẽ đến tiếp theo dựa trên những gì đã xuất hiện trước đó. Qua mục tiêu đơn giản này, nó học ngữ pháp, sự kiện, mẫu suy luận, cấu trúc mã và nhiều thứ khác. Nhưng nó cũng học những điều vô nghĩa trên internet, định kiến và thông tin không chính xác. Việc tuyển chọn, lọc và loại bỏ trùng lặp dữ liệu có ý nghĩa vô cùng lớn.

**Vì sao điều này quan trọng:** Đầu vào rác thì đầu ra rác. Chất lượng dữ liệu tiền huấn luyện là một trong những yếu tố tạo khác biệt lớn nhất giữa các mô hình.

---

## "RLHF aligns AI with human values"

**Thực tế:** RLHF điều chỉnh AI theo sở thích của những người cụ thể đã cung cấp phản hồi. Những người đó bất đồng với nhau, có thiên kiến và không thể bao quát mọi tình huống. RLHF khiến mô hình hữu ích và vô hại theo cách mà người đánh giá đã xác định, chứ không điều chỉnh mô hình theo một hệ giá trị phổ quát của con người.

**Vì sao điều này quan trọng:** RLHF là một kỹ thuật huấn luyện, không phải giải pháp cho vấn đề alignment. Đây là một công cụ trong bộ công cụ lớn hơn.

---

## "Embeddings capture meaning"

**Thực tế:** Embedding nắm bắt các mẫu đồng xuất hiện mang tính thống kê. Những từ xuất hiện trong các ngữ cảnh tương tự sẽ có vector tương tự. Điều này tương quan với ý nghĩa đủ tốt để hữu ích, nhưng không phải là sự hiểu biết ngữ nghĩa. "King - Man + Woman = Queen" có hiệu quả nhờ các mẫu phân bố, chứ không phải vì mô hình hiểu chế độ quân chủ hay giới tính.

**Vì sao điều này quan trọng:** Embedding rất mạnh trong tìm kiếm tương đồng, phân cụm và truy xuất. Nhưng đừng diễn giải quá mức ý nghĩa của từ "tương tự".

---

## "Zero-shot means no training"

**Thực tế:** Zero-shot nghĩa là không có ví dụ đặc thù cho tác vụ tại thời điểm suy luận. Mô hình vẫn được huấn luyện trên hàng tỷ token. Chỉ là nó chưa thấy ví dụ về định dạng cụ thể của tác vụ này. Nó khái quát hóa từ các mẫu tiền huấn luyện. Few-shot nghĩa là đưa một vài ví dụ vào prompt. Cả hai đều không có nghĩa là mô hình học mà không qua huấn luyện.

---

## "AI models learn like humans"

**Thực tế:** Con người học từ một vài ví dụ, khái quát hóa giữa các lĩnh vực và liên tục cập nhật niềm tin. Mạng nơ-ron cần hàng triệu ví dụ, khái quát hóa trong phạm vi phân phối huấn luyện và có trọng số cố định sau khi huấn luyện. Phép so sánh về việc học cùng lắm cũng chỉ là một phép so sánh lỏng lẻo. Backpropagation chẳng giống gì cách nơ-ron sinh học học.

**Vì sao điều này quan trọng:** Đừng nhân cách hóa mô hình. Điều đó dẫn đến kỳ vọng sai lầm về những gì chúng có thể và không thể làm.

---

## "Scaling laws mean bigger is always better"

**Thực tế:** Quy luật scaling mô tả mối quan hệ có thể dự đoán giữa lượng tính toán, dữ liệu và kích thước mô hình. Chúng cho thấy lợi ích giảm dần: tăng gấp đôi số tham số không làm hiệu suất tăng gấp đôi. Chúng cũng giả định dữ liệu được mở rộng theo tỷ lệ tương ứng. Nhiều cải tiến thực tiễn đến từ kiến trúc tốt hơn, kỹ thuật huấn luyện và chất lượng dữ liệu, chứ không chỉ từ quy mô.

**Vì sao điều này quan trọng:** Một mô hình 7B với kỹ thuật tốt có thể giải quyết vấn đề của bạn. Đừng mặc định chọn 70B.

---

## "Open source AI is the same as open weights"

**Thực tế:** Hầu hết mô hình "mã nguồn mở" thực chất là mô hình có trọng số mở. Bạn nhận được các tệp mô hình nhưng không có dữ liệu huấn luyện, mã huấn luyện hay quy trình dữ liệu. Mã nguồn mở thực sự (như OLMo) công bố mọi thứ: dữ liệu, mã, checkpoint trung gian và đánh giá. Trọng số mở hữu ích, nhưng không phải là cùng một cam kết như mã nguồn mở.

**Vì sao điều này quan trọng:** Hãy biết mình nhận được những gì. Trọng số mở cho phép bạn chạy và fine-tune. Mã nguồn mở thực sự cho phép bạn tái tạo và hiểu mô hình.

---

## "Prompt engineering is not real engineering"

**Thực tế:** Kỹ thuật prompt là thiết kế hệ thống. Bạn đang thiết kế giao diện giữa ý định của con người và hành vi của mô hình. Kỹ thuật prompt tốt đòi hỏi hiểu về tokenization, các mẫu attention, giới hạn cửa sổ ngữ cảnh và phân tích đầu ra. Nó gần với thiết kế API hơn là "nói chuyện tử tế với AI".

**Vì sao điều này quan trọng:** Khóa học này dạy kỹ thuật prompt như một lĩnh vực kỹ thuật thực thụ trong Giai đoạn 11.

---

## "CNNs are outdated, everything is transformers now"

**Thực tế:** Vision Transformer (ViT) vượt qua CNN trên nhiều benchmark, nhưng CNN vẫn được sử dụng rộng rãi. Chúng suy luận nhanh hơn, hoạt động tốt trên thiết bị di động/edge, cần ít dữ liệu hơn và có các thiên hướng quy nạp hữu ích (bất biến tịnh tiến, mẫu cục bộ). Nhiều hệ thống thị giác trong môi trường sản xuất vẫn dùng CNN. Các kiến trúc tốt nhất thường kết hợp cả hai.

**Vì sao điều này quan trọng:** Hãy học cả hai (Giai đoạn 4 và 7). Dùng phương pháp phù hợp với các ràng buộc của bạn.

---

## "You need massive compute to train useful models"

**Thực tế:** Bạn cần lượng tính toán khổng lồ để tiền huấn luyện các mô hình nền tảng. Nhưng fine-tuning, LoRA và học chuyển giao cho phép bạn điều chỉnh mô hình trên một GPU duy nhất. Nhiều ứng dụng AI hữu ích hoàn toàn không cần huấn luyện, chỉ cần prompt tốt và RAG. "Rào cản tính toán" áp dụng cho việc xây dựng mô hình nền tảng, chứ không phải sử dụng chúng.

**Vì sao điều này quan trọng:** Bạn có thể xây dựng ứng dụng AI thực tế bằng một chiếc laptop. Khóa học này chứng minh điều đó.
