#!/usr/bin/env bash
# Hoego CLI 테스트 스크립트
# 실제 터미널에서 실행하세요 (iTerm2, Terminal.app 등)

set -e

echo "🔍 Hoego CLI 진단 시작..."
echo ""

# 1. 바이너리 확인
echo "1️⃣  설치된 바이너리 확인:"
if [ -f "/usr/local/bin/hoego" ]; then
    ls -lh /usr/local/bin/hoego
    file /usr/local/bin/hoego
else
    echo "❌ /usr/local/bin/hoego가 없습니다!"
    echo "다음 명령어로 설치하세요:"
    echo "  sudo cp /Users/tony/Develop/Hoego/src-tauri/target/release/hoego-cli /usr/local/bin/hoego"
    exit 1
fi

echo ""

# 2. TTY 확인
echo "2️⃣  TTY 환경 확인:"
if [ -t 0 ] && [ -t 1 ]; then
    echo "✅ stdin과 stdout이 모두 TTY입니다 - 정상!"
else
    echo "❌ TTY가 아닙니다!"
    echo "  stdin TTY: $([ -t 0 ] && echo 'yes' || echo 'no')"
    echo "  stdout TTY: $([ -t 1 ] && echo 'yes' || echo 'no')"
    echo ""
    echo "⚠️  이 스크립트를 실제 터미널에서 직접 실행하세요:"
    echo "  ./test-hoego-cli.sh"
    exit 1
fi

echo ""

# 3. Help 테스트
echo "3️⃣  --help 옵션 테스트:"
/usr/local/bin/hoego --help

echo ""
echo ""

# 4. 로그 디렉토리 확인
echo "4️⃣  로그 디렉토리 확인:"
if [ -d "$HOME/Documents/Hoego/history" ]; then
    echo "✅ 로그 디렉토리 존재: $HOME/Documents/Hoego/history"
    ls -lh "$HOME/Documents/Hoego/history" | head -5
else
    echo "📁 로그 디렉토리가 아직 없습니다 (첫 실행 시 자동 생성됨)"
fi

echo ""
echo ""

# 5. 실행 안내
echo "5️⃣  실행 방법:"
echo ""
echo "기본 실행:"
echo "  hoego"
echo ""
echo "세션과 함께 실행:"
echo "  hoego --session \"회의 메모\""
echo ""
echo "TUI 명령어:"
echo "  :q 또는 :quit - 종료"
echo "  Ctrl+C - 강제 종료"
echo ""
echo "✨ 준비 완료! 'hoego' 명령어로 시작하세요."
