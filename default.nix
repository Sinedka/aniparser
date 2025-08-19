{ stdenv, fetchFromGitHub, nodejs, electron, lib }:

stdenv.mkDerivation rec {
  pname = "aniparser";
  version = "0.2.8";

  src = fetchFromGitHub {
    owner = "Sinedka";
    repo = "aniparser";
    rev = version;
    sha256 = lib.fakeSha256; # заменить на настоящий sha256 после первой сборки
  };

  nativeBuildInputs = [ nodejs electron ];

  buildPhase = ''
    npm install
    npm run transpile:electron
    npm run build
  '';

  installPhase = ''
    mkdir -p $out/usr/lib/$pname
    mkdir -p $out/usr/bin
    mkdir -p $out/usr/share/applications
    mkdir -p $out/usr/share/icons/hicolor/512x512/apps

    cp -r dist-electron/* $out/usr/lib/$pname/
    cp -r dist-react/* $out/usr/lib/$pname/dist-electron

    if [ -f dist-react/icon.png ]; then
      cp dist-react/icon.png $out/usr/share/icons/hicolor/512x512/apps/$pname.png
    fi

    cat > $out/usr/share/applications/$pname.desktop <<EOF
[Desktop Entry]
Name=AniParser
Comment=AniParser Electron application
Exec=$pname
Icon=$pname
Terminal=false
Type=Application
Categories=Utility;
EOF

    cat > $out/usr/bin/$pname <<EOF
#!/bin/sh
exec ${electron}/bin/electron $out/usr/lib/$pname/main.js "\$@"
EOF
    chmod +x $out/usr/bin/$pname
  '';

  meta = with lib; {
    description = "AniParser Electron application";
    homepage = "https://github.com/Sinedka/aniparser";
    license = licenses.mit;
    maintainers = [];
    platforms = platforms.linux;
  };
}
