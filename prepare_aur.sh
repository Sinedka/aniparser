# Конфигурация
PROJECT_NAME="aniparser"
AUR_REPO="ssh://aur@aur.archlinux.org/aniparser.git"
VERSION=$(grep '"version":' package.json | cut -d'"' -f4)

echo -e "Preparing AUR package for ${PROJECT_NAME} version ${VERSION}"

# Переходим в директорию AUR
git clone $AUR_REPO aur && cd aur || echo "wtf is going on?"

# Обновляем версию в PKGBUILD если необходимо
sed -i "s/pkgver=.*/pkgver=${VERSION}/" PKGBUILD


# Генерируем .SRCINFO
makepkg --printsrcinfo > .SRCINFO

updpkgsums

makepkg --printsrcinfo > .SRCINFO

git add .
git commit -m "Update to version ${VERSION}"
git push
