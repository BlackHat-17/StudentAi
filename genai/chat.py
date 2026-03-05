import ollama
from query_engine import search_with_scores

print("Chat system ready")

while True:
    question = input("\nAsk question: ")
    
    results = search_with_scores(question)
    
    # Display confidence scores
    print("\n--- Retrieved Context (with confidence) ---")
    for i, (chunk, score) in enumerate(results, 1):
        print(f"[{i}] Confidence: {score:.4f}")
        print(f"    {chunk[:150]}...\n")
    
    # Combine chunks for LLM
    context = "\n".join([chunk for chunk, _ in results])
    
    prompt = f"""
Answer only using the context below.
If the answer is not present say: I don't have enough information.

Context:
{context}

Question:
{question}
"""
    
    response = ollama.chat(
        model="mistral",
        messages=[{"role": "user", "content": prompt}]
    )
    
    answer = response["message"]["content"]
    
    print("\nAnswer:\n", answer)