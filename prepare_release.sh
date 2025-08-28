npm run build
npm run transpile:electron 
mkdir dist-full
cp -r dist-react dist-full
cp -r dist-electron dist-full
cp -r assets/icon.png dist-full
cp -r package_aur.json dist-full/package.json
tar -czvf dist-full.tar.gz dist-full
