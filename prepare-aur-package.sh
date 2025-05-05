#!/bin/bash

  #  git init
  #  git add PKGBUILD .SRCINFO
  #  git add aniparser*.tar,gz
  #  git commit -m "Initial commit"
  #  git push -u origin master

# Переменные
PKGNAME="aniparser"
PKGVER="2.0.1"
DEST_DIR="aniparser/$PKGNAME-$PKGVER"

# Очистка предыдущих сборок
rm -rf "$DEST_DIR" "$PKGNAME-$PKGVER.tar.gz"
mkdir -p "$DEST_DIR"

# Копирование файлов проекта
cp -r src "$DEST_DIR/"
cp -r public "$DEST_DIR/"
cp package.json "$DEST_DIR/"
cp package-lock.json "$DEST_DIR/"
cp tsconfig.json "$DEST_DIR/"
cp tsconfig.app.json "$DEST_DIR/"
cp tsconfig.node.json "$DEST_DIR/"
cp vite.config.ts "$DEST_DIR/"
cp electron-builder.json "$DEST_DIR/"
cp index.html "$DEST_DIR/"
# Если есть другие важные файлы, добавьте их сюда

# Создание архива tar.gz
tar -czf "aniparser/$PKGNAME-$PKGVER.tar.gz" "$DEST_DIR"

echo "Архив $PKGNAME-$PKGVER.tar.gz создан успешно"
echo "Теперь вы можете запустить 'makepkg -si' чтобы собрать и установить пакет" 