#!/bin/bash

VERSION=$(grep '"version":' package.json | cut -d'"' -f4)



echo "Введите описание релиза (оставьте пустым для 'Release $VERSION'):"
read -r RELEASE_NOTES
RELEASE_NOTES=${RELEASE_NOTES:-"Release $VERSION"}

# Проверка существования тега
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo "Тег $VERSION уже существует!"
    exit 1
fi

# Создание тега
echo "Создание git тега $VERSION..."
git tag -a "$VERSION"

# Пуш тега
echo "Отправка тега в репозиторий..."
git push origin "$VERSION"

# Создание релиза через GitHub CLI (если установлен)
if command -v gh &> /dev/null; then
    echo "Создание релиза на GitHub..."
    mkdir -p release
    # Копирование файлов только с определенной версией
    cp -r "dist/aniparser-$VERSION"* release/
    cp -r "dist/aniparser $VERSION"* release/
    gh release create "v$VERSION" \
        --title "v$VERSION" \
        --notes "$RELEASE_NOTES" \
        ./release/*
else
    echo "GitHub CLI (gh) не установлен. Пожалуйста, создайте релиз вручную на GitHub"
fi

echo "Процесс создания релиза завершен!" 