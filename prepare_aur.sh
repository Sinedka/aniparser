#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Конфигурация
PROJECT_NAME="aniparser"
AUR_REPO="https://aur.archlinux.org/aniparser.git"
VERSION=$(grep '"version":' package.json | cut -d'"' -f4)

echo -e "${BLUE}Preparing AUR package for ${PROJECT_NAME} version ${VERSION}${NC}"

# Копируем новый архив в AUR репозиторий
echo -e "${BLUE}Updating AUR package...${NC}"
cp "${BUILD_DIR}/${PROJECT_NAME}-${VERSION}.tar.gz" aur/

# Переходим в директорию AUR
cd aur

rm -rf ${PROJECT_NAME}-${VERSION}
mkdir ${PROJECT_NAME}-${VERSION}
cd ${PROJECT_NAME}-${VERSION}

pwd

cp -r ../../dist-electron/ .
cp -r ../../dist-react/ .

tar -czvf ../${PROJECT_NAME}-${VERSION}.tar.gz .
cd ..

rm -rf ${PROJECT_NAME}-${VERSION}

# Обновляем версию в PKGBUILD если необходимо
sed -i "s/pkgver=.*/pkgver=${VERSION}/" PKGBUILD

# Генерируем .SRCINFO
echo -e "${BLUE}Generating .SRCINFO...${NC}"
makepkg --printsrcinfo > .SRCINFO

echo -e "${GREEN}Package preparation complete!${NC}"
echo -e "${BLUE}Now you can:${NC}"
echo -e "1. Review changes in ./aur directory"
echo -e "2. Commit and push changes to AUR:"
echo -e "   cd aur"
echo -e "   git add ."
echo -e "   git commit -m \"Update to version ${VERSION}\""
echo -e "   git push" 