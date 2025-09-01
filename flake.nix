{
  description = "AniParser Electron application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    {
      devShells = forEachSystem (system: pkgs: rec {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            electron
            wine
          ];

          shellHook = ''
            export ELECTRON_SKIP_BINARY_DOWNLOAD=1
            export ELECTRON_OVERRIDE_DIST_PATH=${pkgs.electron}/bin/
          '';
        };
      });
    };
}
