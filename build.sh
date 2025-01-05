#!/bin/bash

# ZIP 파일 이름 설정
ZIP_FILE="extension.zip"

# 이전 ZIP 파일이 있다면 삭제
if [ -f "$ZIP_FILE" ]; then
    rm "$ZIP_FILE"
    echo "기존 $ZIP_FILE 파일이 삭제되었습니다."
fi

# 필요한 파일들 배열
files=(
    "calendar-utils.js",
    "cim.png",
    "content-script.js",
    "content.js",
    "evaluation-handler.js",
    "manifest.json",
    "popup.html",
    "selection-handler.js",
    "styles.css"
)

# 파일 존재 여부 확인
missing_files=()
for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

# 누락된 파일이 있다면 경고 출력
if [ ${#missing_files[@]} -ne 0 ]; then
    echo "경고: 다음 파일들을 찾을 수 없습니다:"
    printf '%s\n' "${missing_files[@]}"
    read -p "계속 진행하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ZIP 파일 생성
zip -9 "$ZIP_FILE" "${files[@]}" 2>/dev/null

# 결과 확인
if [ $? -eq 0 ]; then
    echo "ZIP 파일 생성 완료: $ZIP_FILE"
    # ZIP 파일 크기 출력
    zip_size=$(stat -f %z "$ZIP_FILE" 2>/dev/null || stat -c %s "$ZIP_FILE")
    echo "파일 크기: $zip_size bytes"
else
    echo "ZIP 파일 생성 실패"
    exit 1
fi 