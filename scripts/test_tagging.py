#!/usr/bin/env python3
"""
Phase 0 Validation: Test local LLM tagging performance
Tests Gemma2 2b model for automatic tagging of dump entries
"""

import json
import time
import requests
from datetime import datetime

# Ollama API endpoint
OLLAMA_API = "http://localhost:11434/api/generate"
MODEL = "gemma2:2b"

# Sample dump entries (realistic Korean examples)
SAMPLE_ENTRIES = [
    {"time": "09:15:00", "task": "출근, 사무실 도착"},
    {"time": "09:30:00", "task": "이메일 확인 및 답장"},
    {"time": "10:00:00", "task": "팀 미팅 - 주간 스프린트 계획"},
    {"time": "11:30:00", "task": "코딩 - 사용자 인증 API 구현"},
    {"time": "12:00:00", "task": "점심 식사"},
    {"time": "13:00:00", "task": "유튜브 시청"},
    {"time": "14:00:00", "task": "디자인 리뷰 미팅"},
    {"time": "15:30:00", "task": "버그 수정 - 로그인 에러"},
    {"time": "16:00:00", "task": "커피 브레이크"},
    {"time": "16:30:00", "task": "문서 작성 - API 가이드"},
    {"time": "17:00:00", "task": "사이드 프로젝트 아이디어 정리"},
    {"time": "17:30:00", "task": "퇴근 준비"},
]

# Expected tags for validation (human-labeled)
EXPECTED_TAGS = {
    "출근, 사무실 도착": ["work", "commute"],
    "이메일 확인 및 답장": ["work", "communication"],
    "팀 미팅 - 주간 스프린트 계획": ["work", "meeting"],
    "코딩 - 사용자 인증 API 구현": ["work", "coding"],
    "점심 식사": ["personal", "break"],
    "유튜브 시청": ["personal", "leisure"],
    "디자인 리뷰 미팅": ["work", "meeting", "design"],
    "버그 수정 - 로그인 에러": ["work", "coding", "bugfix"],
    "커피 브레이크": ["personal", "break"],
    "문서 작성 - API 가이드": ["work", "documentation"],
    "사이드 프로젝트 아이디어 정리": ["personal", "sideproject"],
    "퇴근 준비": ["work", "personal"],
}

def create_prompt(entry, previous_entries=None):
    """Create prompt for tag suggestion"""

    # Few-shot examples (simulated previous user tagging)
    few_shot = """You are a personal activity tagger for a Korean user's work log.

Previous user tagging examples:
- "코딩 작업" → tags: work, coding
- "점심 먹음" → tags: personal, break
- "회의" → tags: work, meeting
- "넷플릭스 시청" → tags: personal, leisure

Current entry:
- "{task}" ({time})

Suggest 1-3 relevant tags from these categories:
- work, personal, coding, meeting, break, leisure, documentation, bugfix, design, sideproject, communication, commute

Output ONLY in this exact format (no explanation):
tag1,tag2,tag3
"""

    return few_shot.format(task=entry["task"], time=entry["time"])

def call_ollama(prompt, model=MODEL):
    """Call Ollama API and measure performance"""

    start_time = time.time()

    try:
        response = requests.post(
            OLLAMA_API,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,  # Low temp for consistent tagging
                    "num_predict": 50,   # Short response
                }
            },
            timeout=10
        )

        elapsed = time.time() - start_time

        if response.status_code == 200:
            result = response.json()
            suggested_text = result.get("response", "").strip()

            # Parse tags (format: tag1,tag2,tag3)
            tags = [tag.strip() for tag in suggested_text.split(",") if tag.strip()]

            # Remove any extra text (LLM sometimes adds explanation)
            tags = [tag.split()[0].replace(".", "").lower() for tag in tags[:3]]

            return {
                "tags": tags,
                "response_time": elapsed,
                "tokens": result.get("eval_count", 0),
                "success": True
            }
        else:
            return {"success": False, "error": f"HTTP {response.status_code}"}

    except Exception as e:
        return {"success": False, "error": str(e)}

def calculate_accuracy(suggested, expected):
    """Calculate tag overlap accuracy"""
    if not expected or not suggested:
        return 0.0

    # Jaccard similarity
    suggested_set = set(suggested)
    expected_set = set(expected)

    intersection = len(suggested_set & expected_set)
    union = len(suggested_set | expected_set)

    return intersection / union if union > 0 else 0.0

def main():
    print("=" * 60)
    print(f"Phase 0 Validation: Local LLM Tagging Test")
    print(f"Model: {MODEL}")
    print(f"Samples: {len(SAMPLE_ENTRIES)} entries")
    print("=" * 60)
    print()

    results = []
    total_time = 0
    total_tokens = 0
    successful = 0

    for i, entry in enumerate(SAMPLE_ENTRIES, 1):
        print(f"[{i}/{len(SAMPLE_ENTRIES)}] Testing: {entry['task']}")

        prompt = create_prompt(entry)
        result = call_ollama(prompt)

        if result["success"]:
            suggested_tags = result["tags"]
            expected_tags = EXPECTED_TAGS.get(entry["task"], [])
            accuracy = calculate_accuracy(suggested_tags, expected_tags)

            print(f"  ✓ Response time: {result['response_time']:.2f}s")
            print(f"  ✓ Suggested: {suggested_tags}")
            print(f"  ✓ Expected: {expected_tags}")
            print(f"  ✓ Accuracy: {accuracy:.1%}")

            total_time += result["response_time"]
            total_tokens += result["tokens"]
            successful += 1

            results.append({
                "entry": entry,
                "suggested": suggested_tags,
                "expected": expected_tags,
                "accuracy": accuracy,
                "response_time": result["response_time"]
            })
        else:
            print(f"  ✗ Error: {result['error']}")

        print()

    # Summary statistics
    print("=" * 60)
    print("VALIDATION RESULTS")
    print("=" * 60)

    if successful > 0:
        avg_time = total_time / successful
        avg_accuracy = sum(r["accuracy"] for r in results) / len(results)

        print(f"Success rate: {successful}/{len(SAMPLE_ENTRIES)} ({successful/len(SAMPLE_ENTRIES):.1%})")
        print(f"Average response time: {avg_time:.2f}s")
        print(f"Average accuracy: {avg_accuracy:.1%}")
        print(f"Total tokens generated: {total_tokens}")
        print()

        # Performance assessment
        print("ASSESSMENT:")
        if avg_time < 0.5:
            print("  ✓ Response time: EXCELLENT (<500ms)")
        elif avg_time < 1.0:
            print("  ✓ Response time: GOOD (<1s)")
        elif avg_time < 2.0:
            print("  ⚠ Response time: ACCEPTABLE (<2s)")
        else:
            print("  ✗ Response time: POOR (>2s)")

        if avg_accuracy > 0.7:
            print("  ✓ Accuracy: EXCELLENT (>70%)")
        elif avg_accuracy > 0.5:
            print("  ✓ Accuracy: GOOD (>50%)")
        elif avg_accuracy > 0.3:
            print("  ⚠ Accuracy: ACCEPTABLE (>30%)")
        else:
            print("  ✗ Accuracy: POOR (<30%)")

        print()
        print("GO/NO-GO DECISION:")
        if avg_time < 2.0 and avg_accuracy > 0.5:
            print("  ✓✓✓ GO - Proceed to Phase 1")
            print("  Local LLM performance is sufficient for production use")
        elif avg_time < 3.0 and avg_accuracy > 0.3:
            print("  ⚠⚠ CONDITIONAL GO - Consider optimizations")
            print("  May need to tune model or use hybrid approach")
        else:
            print("  ✗✗✗ NO-GO - Need alternative approach")
            print("  Consider cloud API or simpler rule-based tagging")
    else:
        print("✗ All tests failed. Check Ollama service and model.")

    # Save detailed results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"/Users/tony/Develop/Hoego/scripts/tagging_results_{timestamp}.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({
            "model": MODEL,
            "timestamp": timestamp,
            "summary": {
                "total_samples": len(SAMPLE_ENTRIES),
                "successful": successful,
                "avg_response_time": total_time / successful if successful > 0 else 0,
                "avg_accuracy": sum(r["accuracy"] for r in results) / len(results) if results else 0
            },
            "results": results
        }, f, indent=2, ensure_ascii=False)

    print(f"\nDetailed results saved to: {output_file}")

if __name__ == "__main__":
    main()
