npm run dist:win
npm run dist:linux
cp -r dist-react dist-electron
cp -r dist-react assets/icon.svg
cp -r dist-react assets/icon.png
tar -czvf dist-electron.tar.gz dist-electron

