# Aurora Visualizer

Plugin audio (VST3 / AU) qui affiche un visualiseur inspiré des aurores boréales.
L'audio passe sans modification : il se place en insert sur n'importe quelle piste ou sur le master.

- **Basses** : ondulent le reflet du lac et gonflent les rideaux
- **Spectre (64 bandes log, 30 Hz–16 kHz)** : la hauteur de chaque rideau suit l'énergie à sa position
- **Aigus** : font scintiller les étoiles
- Double-clic sur la fenêtre : affiche/masque les réglages (sensibilité, fluidité, vitesse, étoiles, palette)

## Compiler

Prérequis : CMake ≥ 3.22, un compilateur C++17.
Linux : `libasound2-dev libx11-dev libxrandr-dev libxinerama-dev libxcursor-dev libgl1-mesa-dev libfreetype-dev`.

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

Les binaires sont dans `build/AuroraVisualizer_artefacts/Release/` (VST3, AU sur macOS, Standalone).
Copie le `.vst3` dans :
- Windows : `C:\Program Files\Common Files\VST3`
- macOS : `~/Library/Audio/Plug-Ins/VST3` (le `.component` AU va dans `.../Components`, pour Logic)

Pour Ableton et FL Studio : VST3. Pour Logic : AU (macOS uniquement).

## Structure

- `Source/PluginProcessor.*` : paramètres, FIFO sans verrou audio → interface
- `Source/PluginEditor.*` : FFT, lissage, rendu OpenGL
- Le shader de l'aurore est dans `PluginEditor.cpp` (`fragmentSrc`)
