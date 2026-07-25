from sentence_transformers import SentenceTransformer

model = SentenceTransformer(
    "Alibaba-NLP/gte-Qwen2-1.5B-instruct",
    trust_remote_code=True
)

print("Downloaded Successfully!")