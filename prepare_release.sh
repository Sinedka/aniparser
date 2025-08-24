npm run dist:win
npm run dist:linux
cp -r dist-react dist-electron
cp -r assets/icon.png dist-electron
tar -czvf dist-electron.tar.gz dist-electron
