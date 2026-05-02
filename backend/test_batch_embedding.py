"""测试批量图片 embedding 的返回格式.

用法:
    source .venv/bin/activate && python test_batch_embedding.py
"""

import base64
import io
import json
import os

import httpx
import numpy as np
from PIL import Image, ImageDraw


def create_dummy_image(text: str, size: tuple = (256, 256)) -> bytes:
    """生成一张带文字的测试图片."""
    img = Image.new("RGB", size, color=(42, 85, 128))
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), text, fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def image_to_data_uri(img_bytes: bytes) -> str:
    b64 = base64.b64encode(img_bytes).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def main():
    # 生成 3 张测试图
    images = [
        create_dummy_image("Image A", (256, 256)),
        create_dummy_image("Image B", (128, 256)),
        create_dummy_image("Image C", (256, 128)),
    ]
    data_uris = [image_to_data_uri(img) for img in images]

    vllm_url = os.getenv("EMBEDDING_VLLM_URL", "http://localhost:8001/v1/embeddings")
    api_url = os.getenv("EMBEDDING_API_URL", "https://api.siliconflow.cn/v1/embeddings")
    api_key = os.getenv("EMBEDDING_API_KEY", "")
    model = os.getenv("EMBEDDING_MODEL", "Qwen/Qwen3-VL-Embedding-8B")

    # ---- 测试 vLLM ----
    print("=" * 60)
    print("Testing vLLM batch embedding")
    print(f"URL: {vllm_url}")
    print(f"Images: {len(data_uris)}")
    print("=" * 60)

    async def test_vllm():
        content_parts = [
            {"type": "image_url", "image_url": {"url": uri}}
            for uri in data_uris
        ]
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": content_parts},
            ],
        }
        print(f"\nPayload content parts: {len(content_parts)}")
        print(f"Full payload size: {len(json.dumps(payload))} bytes")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    vllm_url,
                    headers={"Content-Type": "application/json"},
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                print(f"\nResponse keys: {list(data.keys())}")
                print(f"data type: {type(data['data'])}")
                print(f"data length: {len(data['data'])}")
                for i, item in enumerate(data["data"]):
                    emb = np.array(item["embedding"], dtype=np.float32)
                    print(f"  [{i}] index={item.get('index','?')} "
                          f"shape={emb.shape} "
                          f"norm={np.linalg.norm(emb):.4f} "
                          f"first5={emb[:5].tolist()}")
        except Exception as e:
            print(f"vLLM error: {e}")

    # ---- 测试 SiliconFlow ----
    print("\n" + "=" * 60)
    print("Testing SiliconFlow batch embedding")
    print(f"URL: {api_url}")
    print(f"Images: {len(data_uris)}")
    print("=" * 60)

    async def test_siliconflow():
        payload = {
            "model": model,
            "input": [{"image": uri} for uri in data_uris],
        }
        print(f"\nInput entries: {len(payload['input'])}")
        print(f"Full payload size: {len(json.dumps(payload))} bytes")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    api_url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                print(f"\nResponse keys: {list(data.keys())}")
                print(f"data type: {type(data['data'])}")
                print(f"data length: {len(data['data'])}")
                for i, item in enumerate(data["data"]):
                    emb = np.array(item["embedding"], dtype=np.float32)
                    print(f"  [{i}] index={item.get('index','?')} "
                          f"shape={emb.shape} "
                          f"norm={np.linalg.norm(emb):.4f} "
                          f"first5={emb[:5].tolist()}")
        except Exception as e:
            print(f"SiliconFlow error: {e}")

    # ---- 单图测试作为对照 ----
    print("\n" + "=" * 60)
    print("Testing single-image (baseline) via SiliconFlow")
    print("=" * 60)

    async def test_single():
        payload = {
            "model": model,
            "input": [{"image": data_uris[0]}],
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    api_url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                print(f"data length: {len(data['data'])}")
                emb = np.array(data["data"][0]["embedding"], dtype=np.float32)
                print(f"  shape={emb.shape} first5={emb[:5].tolist()}")
        except Exception as e:
            print(f"Single error: {e}")

    import asyncio
    asyncio.run(test_vllm())
    asyncio.run(test_siliconflow())
    asyncio.run(test_single())


if __name__ == "__main__":
    main()
