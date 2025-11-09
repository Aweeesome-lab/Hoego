export type ModelPreset = {
  id: string;
  label: string;
  filename: string; // 저장될 파일명(.gguf)
  url: string; // 직접 다운로드 URL
  note?: string;
  approxSizeGB?: number;
};

// 한국어 성능: Qwen3 8B ≥ Qwen2.5 7B ≥ Llama3.1 8B > Qwen2.5 3B >>> TinyLlama (영어만)
export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "qwen3-8b-q4km",
    label: "Qwen3 8B Instruct (Q4_K_M) — 최신 ⭐⭐⭐",
    filename: "Qwen3-8B.i1-Q4_K_M.gguf",
    url: "https://huggingface.co/mradermacher/Qwen3-8B-i1-GGUF/resolve/main/Qwen3-8B.i1-Q4_K_M.gguf",
    approxSizeGB: 5.0,
    note: "2025년 최신, 한국어 최상급, Thinking 모드",
  },
  {
    id: "qwen2.5-3b-q4km",
    label: "Qwen2.5 3B Instruct (Q4_K_M) — 빠른 시작",
    filename: "Qwen2.5-3B-Instruct-Q4_K_M.gguf",
    url: "https://huggingface.co/bartowski/Qwen2.5-3B-Instruct-GGUF/resolve/main/Qwen2.5-3B-Instruct-Q4_K_M.gguf",
    approxSizeGB: 2.0,
    note: "한국어 우수, 빠름",
  },
  {
    id: "llama-3.1-8b-q4km",
    label: "Llama 3.1 8B Instruct (Q4_K_M) — 균형",
    filename: "Llama-3.1-8B-Instruct-Q4_K_M.gguf",
    url: "https://huggingface.co/bartowski/Llama-3.1-8B-Instruct-GGUF/resolve/main/Llama-3.1-8B-Instruct-Q4_K_M.gguf",
    approxSizeGB: 4.9,
    note: "한국어 매우 우수",
  },
  {
    id: "qwen2.5-7b-q4km",
    label: "Qwen2.5 7B Instruct (Q4_K_M) — 검증됨",
    filename: "Qwen2.5-7B-Instruct-Q4_K_M.gguf",
    url: "https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf",
    approxSizeGB: 4.7,
    note: "한국어 최상, 안정적",
  },
  {
    id: "tinyllama-1.1b-chat-q4km",
    label: "TinyLlama 1.1B Chat (Q4_K_M) — 영어 전용",
    filename: "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
    url: "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
    approxSizeGB: 0.7,
    note: "한국어 불가, 영어 테스트용",
  },
];
