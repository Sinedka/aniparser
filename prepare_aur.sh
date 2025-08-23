ask_yes_no() {
    prompt="$1"

    printf "%s [y/n] " "$prompt"

    # отключаем канонический ввод и эхо
    stty -echo -icanon time 0 min 1
    answer=$(dd bs=1 count=1 2>/dev/null)
    stty sane

    printf "%s\n" "$answer"

    case "$answer" in
        [Yy]) return 0 ;;  # Да
        *)    return 1 ;;  # Нет
    esac
}

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Конфигурация
PROJECT_NAME="aniparser"
AUR_REPO="ssh://aur@aur.archlinux.org/aniparser.git"
VERSION=$(grep '"version":' package.json | cut -d'"' -f4)

echo -e "${BLUE}Preparing AUR package for ${PROJECT_NAME} version ${VERSION}${NC}"

# Переходим в директорию AUR
cd aur || git clone $AUR_REPO aur && cd aur || echo "${RED}wtf is going on?${RED}"

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
if ask_yes_no "exec them?"; then
  cd aur || echo "${RED}wtf is going on?${RED}"
  git add .
  git commit -m "Update to version ${VERSION}"
  git push
fi
