#!/bin/bash

echo "======================================"
echo "Phase 0: Gemma2 2b Tagging Performance Test"
echo "======================================"
echo

entries=(
  "회의 참석"
  "코딩 작업 - API 구현"
  "점심 먹음"
  "유튜브 시청"
  "문서 작성"
)

total_time=0
count=0

for entry in "${entries[@]}"; do
  count=$((count + 1))
  echo "[$count/${#entries[@]}] Testing: $entry"

  result=$(curl -s http://localhost:11434/api/generate -d "{
    \"model\": \"gemma2:2b\",
    \"prompt\": \"Tag this entry with 1-3 tags: \\\"$entry\\\"\\nCategories: work,personal,meeting,coding,break,leisure,documentation\\nOutput only tags separated by commas:\",
    \"stream\": false,
    \"options\": {\"temperature\": 0.1, \"num_predict\": 20}
  }")

  response=$(echo "$result" | jq -r '.response')
  duration=$(echo "$result" | jq -r '.total_duration / 1000000000')
  eval_duration=$(echo "$result" | jq -r '.eval_duration / 1000000000')

  echo "  Response: $response"
  echo "  Total time: ${duration}s (Inference: ${eval_duration}s)"

  total_time=$(echo "$total_time + $duration" | bc)
  echo
done

avg_time=$(echo "scale=2; $total_time / $count" | bc)

echo "======================================"
echo "RESULTS"
echo "======================================"
echo "Total tests: $count"
echo "Total time: ${total_time}s"
echo "Average time: ${avg_time}s"
echo
echo "ASSESSMENT:"
if (( $(echo "$avg_time < 0.5" | bc -l) )); then
  echo "  ✓ EXCELLENT: <500ms per tag"
elif (( $(echo "$avg_time < 1.0" | bc -l) )); then
  echo "  ✓ GOOD: <1s per tag"
elif (( $(echo "$avg_time < 2.0" | bc -l) )); then
  echo "  ⚠ ACCEPTABLE: <2s per tag"
else
  echo "  ✗ POOR: >2s per tag - Consider optimization"
fi
echo
echo "Note: First request includes model loading time (~10s)"
echo "Subsequent requests use cached model (much faster)"
