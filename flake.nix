{
  description = "AniParser Electron application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        pname = "aniparser";
        version = "0.2.7";

        aniparser = pkgs.stdenv.mkDerivation {
          inherit pname version;
          src = pkgs.fetchFromGitHub {
            owner = "Sinedka";
            repo = "aniparser";
            rev = "v${version}";
            sha256 = "sha256-aqePA22tOs7CYT2u/QbHhLAyAks6ny7IBQAf+9RF8Ro=";
          };

          nativeBuildInputs = with pkgs; [ nodejs ];
          buildInputs = [ pkgs.electron ];

          buildPhase = ''
            npm install
            npm run transpile:electron
            npm run build
          '';

          installPhase = ''
            mkdir -p $out/lib/${pname}
            cp -r dist-electron $out/lib/${pname}/
            cp -r dist-react $out/lib/${pname}/dist-electron

            mkdir -p $out/bin
            cat > $out/bin/${pname} << EOF
#!/bin/sh
exec ${pkgs.electron}/bin/electron $out/lib/${pname}/dist-electron/main.js "\$@"
EOF
            chmod +x $out/bin/${pname}
          '';

          meta = with pkgs.lib; {
            description = "AniParser Electron application";
            homepage = "https://github.com/Sinedka/aniparser";
            license = licenses.mit;
            platforms = platforms.linux;
            maintainers = with maintainers; [ ]; # добавьте при желании
          };
        };

      in {
        packages.default = aniparser;

        apps.default = flake-utils.lib.mkApp {
          drv = aniparser;
          name = "aniparser";
        };
      }
    );
}
