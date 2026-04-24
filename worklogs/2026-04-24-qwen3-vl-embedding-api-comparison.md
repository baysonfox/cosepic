# Qwen3-VL-Embedding-8B API 调用对比测试报告

**日期**: 2026-04-24  
**测试目标**: 对比三个API（vLLM本地、硅基流动、Tumuer）的embedding输出一致性

---

## 测试环境

- **vLLM本地实例**: http://localhost:8000
- **硅基流动API**: https://api.siliconflow.cn/v1
- **Tumuer API**: https://router.tumuer.me/v1
- **模型**: Qwen/Qwen3-VL-Embedding-8B
- **测试图片**: AVIF格式，768px宽度

---

## 测试结果总结

### ✓ 成功找到一致的API组合

**vLLM + 硅基流动** 可以产出一致的embedding向量，相似度达到 **0.9975**（远超0.99标准）

### ✗ Tumuer API 无法正常工作

所有尝试的格式都返回错误（413/500），无法成功调用。

---

## 正确的调用方式

### vLLM (本地)

**格式**: 纯图片，不带text

```python
import requests
import base64
from PIL import Image
import io

# 预处理图片
img = Image.open(image_path)
if img.width > 768:
    ratio = 768 / img.width
    img = img.resize((768, int(img.height * ratio)), Image.Resampling.LANCZOS)

buffer = io.BytesIO()
img.save(buffer, format="PNG")
img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
data_uri = f"data:image/png;base64,{img_base64}"

# 调用API
payload = {
    "model": "Qwen/Qwen3-VL-Embedding-8B",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": data_uri}}
            ]
        }
    ]
}

response = requests.post(
    "http://localhost:8000/v1/embeddings",
    json=payload,
    headers={"Content-Type": "application/json"}
)

embedding = response.json()["data"][0]["embedding"]
```

### 硅基流动

**格式**: input为列表，包含字典，image字段使用完整data URI

```python
import requests
import base64
from PIL import Image
import io

# 预处理图片（同上）
img = Image.open(image_path)
if img.width > 768:
    ratio = 768 / img.width
    img = img.resize((768, int(img.height * ratio)), Image.Resampling.LANCZOS)

buffer = io.BytesIO()
img.save(buffer, format="PNG")
img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
data_uri = f"data:image/png;base64,{img_base64}"

# 调用API
payload = {
    "model": "Qwen/Qwen3-VL-Embedding-8B",
    "input": [{"image": data_uri}]
}

response = requests.post(
    "https://api.siliconflow.cn/v1/embeddings",
    json=payload,
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }
)

embedding = response.json()["data"][0]["embedding"]
```

---

## 关键发现

### 1. text参数的影响

text参数会**显著影响**embedding结果：

| 配置 | 相似度 |
|------|--------|
| 硅基流动：空text vs 带prompt | 0.337 |
| vLLM：纯图片 vs 带prompt | 0.419 |

**结论**: 要获得一致的embedding，必须确保text参数的使用方式完全相同。

### 2. 输入格式的重要性

硅基流动API测试的格式：

| 格式 | 状态 | 相似度 |
|------|------|--------|
| `input=[{"text": "", "image": base64}]` | ✓ | 0.515 |
| `input=[{"text": "prompt", "image": base64}]` | ✓ | 0.184 |
| `input=[{"image": base64}]` | ✗ | 400错误 |
| `input=[{"image": data_uri}]` | ✓ | **0.9975** ✓✓✓ |
| `input={"image": data_uri}` | ✓ | 0.997 |

**关键点**:
- 硅基流动的`image`字段必须使用完整的data URI格式（包含`data:image/png;base64,`前缀）
- 不能只传base64字符串
- 不要添加`text`字段

### 3. vLLM的格式要求

- 使用`messages`格式，不是直接的`input`
- `content`是列表，包含`image_url`对象
- 不要添加text内容到content中

---

## 测试过程中的错误尝试

### ❌ 错误格式1: 硅基流动使用纯base64

```python
# 这个不行！
payload = {
    "model": "Qwen/Qwen3-VL-Embedding-8B",
    "input": [{"text": "", "image": img_base64}]  # 只有base64，没有data URI前缀
}
# 结果：相似度只有0.515
```

### ❌ 错误格式2: vLLM添加text

```python
# 这个不行！
payload = {
    "model": "Qwen/Qwen3-VL-Embedding-8B",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": data_uri}},
                {"type": "text", "text": "Represent the image for retrieval."}  # 不要加这个
            ]
        }
    ]
}
# 结果：相似度只有0.184
```

### ❌ 错误格式3: 硅基流动不带text字段但只传base64

```python
# 这个不行！
payload = {
    "model": "Qwen/Qwen3-VL-Embedding-8B",
    "input": [{"image": img_base64}]  # 只有base64
}
# 结果：400错误
```

---

## 完整的对比脚本

已创建以下脚本文件：

1. **vllm_image_embedding.py** - 调用本地vLLM的工具脚本
2. **compare_embeddings.py** - 完整的三API对比测试脚本
3. **test_sf_list_format.py** - 验证最终成功格式的脚本

使用方法：
```bash
python compare_embeddings.py <图片路径>
```

---

## 建议

1. **生产环境推荐**: 统一使用一个API源以确保一致性
2. **本地部署优势**: vLLM本地部署最可控，无网络延迟
3. **云端API备选**: 硅基流动可作为备选，但必须使用正确的格式
4. **避免混用**: 不同API即使使用相同模型，也可能因实现差异导致结果不一致

---

## 附录：相似度对比矩阵

| 组合 | 相似度 | 是否一致 |
|------|--------|----------|
| vLLM(纯图片) vs 硅基流动(data_uri) | **0.9975** | ✓ |
| vLLM(纯图片) vs 硅基流动(空text+base64) | 0.515 | ✗ |
| vLLM(带prompt) vs 硅基流动(带prompt+base64) | 0.184 | ✗ |
| vLLM(纯图片) vs vLLM(带prompt) | 0.419 | ✗ |
| 硅基流动(空text) vs 硅基流动(带prompt) | 0.327 | ✗ |

---

**测试完成时间**: 2026-04-24  
**测试人员**: 阿米娅 & 博士
