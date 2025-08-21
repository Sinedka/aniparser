{ stdenv, fetchurl, lib, electron }:

stdenv.mkDerivation rec {
  pname = "aniparser";
  version = "0.2.9";

  src = fetchurl {
    url = "https://github.com/Sinedka/aniparser/releases/download/0.2.9/dist-electron.tar.gz";
    sha256 = "sha256-tphy5i4/6bj7qESFOZaq/d40ghEe6QzH9AqQW/mAXYY=";
  };

  nativeBuildInputs = [ electron ];

  installPhase = ''
    mkdir -p $out/lib/$pname
    mkdir -p $out/bin
    mkdir -p $out/share/applications
    mkdir -p $out/share/icons/hicolor/512x512/apps

    # Распаковываем архив
    tar -xzf $src -C $out/lib/$pname

    # Проверяем наличие иконки и копируем её
    if [ -f $out/lib/$pname/dist-react/icon.png ]; then
      cp $out/lib/$pname/dist-react/icon.png $out/share/icons/hicolor/512x512/apps/$pname.png
    fi

    # Создаём desktop entry
    cat > $out/share/applications/$pname.desktop <<EOF
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
    cat > $out/bin/$pname <<EOF
#!/bin/sh
exec ${electron}/bin/electron $out/lib/$pname/dist-electron/main.js "\$@"
EOF
    chmod +x $out/bin/$pname
  '';

  meta = with lib; {
    description = "AniParser Electron application";
    homepage = "https://github.com/Sinedka/aniparser";
    license = licenses.mit;
    maintainers = [];
    platforms = platforms.linux;
  };
}
