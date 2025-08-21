npm run dist:win
npm run dist:linux
cp -r dist-react dist-electron
tar -czvf dist-electron.tar.gz dist-electron

