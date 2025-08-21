{ stdenv, fetchurl, lib, electron }:

stdenv.mkDerivation rec {
  pname = "aniparser";
  version = "0.2.9";

  src = fetchurl {
    url = "https://github.com/Sinedka/aniparser/releases/download/0.2.9/dist-electron.tar.gz";
    sha256 = "sha256-CLzW59Il9qyIGFGyMqqC9dS13lSgJ9MlejJf6I1Mwqg=";
  };

  nativeBuildInputs = [ electron ];

  installPhase = ''
    mkdir -p $out/usr/lib/$pname
    mkdir -p $out/usr/bin
    mkdir -p $out/usr/share/applications
    mkdir -p $out/usr/share/icons/hicolor/512x512/apps

    # Распаковываем архив
    tar -xzf $src -C $out/usr/lib/$pname

    # Проверяем наличие иконки и копируем её
    if [ -f $out/usr/lib/$pname/dist-react/icon.png ]; then
      cp $out/usr/lib/$pname/dist-react/icon.png $out/usr/share/icons/hicolor/512x512/apps/$pname.png
    fi

    # Создаём desktop entry
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

    # Скрипт запуска
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
