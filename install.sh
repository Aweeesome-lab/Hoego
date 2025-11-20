#!/usr/bin/env bash
# Hoego CLI 설치 스크립트

set -e

echo "🚀 Hoego CLI 설치 시작..."

# 프로젝트 루트 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. 릴리즈 빌드
echo "📦 바이너리 빌드 중... (최초 1회, 1-2분 소요)"
cd src-tauri
cargo build --release --bin hoego-cli

# 2. 설치 위치 결정
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="hoego"

# sudo 권한 확인
if [ ! -w "$INSTALL_DIR" ]; then
    echo "쓰기 권한이 필요합니다."
    USE_SUDO="sudo"
else
    USE_SUDO=""
fi

# 3. 바이너리 복사
echo "📥 $INSTALL_DIR/$BINARY_NAME 에 설치 중..."
$USE_SUDO cp target/release/hoego-cli "$INSTALL_DIR/$BINARY_NAME"
$USE_SUDO chmod +x "$INSTALL_DIR/$BINARY_NAME"

echo ""
echo "✅ 설치 완료!"
echo ""
echo "사용법:"
echo "  hoego                    # Daily Log 모드 (기본)"
echo "  hoego --session \"세션명\"  # 세션과 함께 시작"
echo "  :q                       # 종료"
echo ""
echo "💡 이제 어디서든 'hoego' 명령어를 사용할 수 있습니다!"
