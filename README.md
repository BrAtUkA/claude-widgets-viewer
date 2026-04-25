<div align="center">
  <img src="img/logo.png" alt="Claude Widgets Viewer Logo" width="120" />
  <h1>Claude Widgets Viewer</h1>
  <p><em>A pixel-perfect, private, offline viewer for your exported Claude artifacts.</em></p>
  <a href="https://bratuka.dev/claude-widgets-viewer/"><strong>Use it now →</strong></a>
</div>



## The Problem
When you download an interactive widget or visual artifact from a Claude chat, the exported HTML file is completely barebones. Without Claude's internal CSS ecosystem and theme engine, diagrams look broken, buttons lose their styling, and layouts collapse. 

Worse, relying on the original chat history isn't always safe-returning to an old conversation can frequently result in **"Visualization failed to load"** errors, locking you out of your generated tools and charts permanently.

## The Solution
**Claude Widgets Viewer** is a standalone, browser-based environment that perfectly recreates Claude's internal CSS rendering engine. It allows you to drag-and-drop your raw exported widget files and view them exactly as they appeared in the chat.

### ✨ Features
- **Pixel-Perfect Rendering:** Automatically injects the necessary structural CSS and theme tokens to make your barebone HTML widgets look flawless.
- **100% Offline & Private:** Everything runs locally in your browser. Files are stored entirely in your local IndexedDB database. No telemetry, no external servers, no tracking.
- **Responsive Layout:** Switch seamlessly between Default (720px), Wide (960px), and Full Width views to test responsive widget behavior.
- **Light & Dark Mode:** Native support for both themes, perfectly mirroring Claude's official color palettes.
- **Fast Search:** Instantly filter through your saved widgets and diagrams.

## How to Use
1. Inside a Claude chat, click the **Download** button on any visual artifact or widget you want to save.
2. Open the **Claude Widgets Viewer**.
3. Drag and drop the downloaded `.html` file(s) anywhere onto the screen.
4. Your widget will be safely stored in your browser and will render perfectly every time you need it.

---
<br/>

<p align="center">
  <a href="https://github.com/BrAtUkA">
    <img src="https://raw.githubusercontent.com/BrAtUkA/BrAtUkA/main/imgs/logo-flat-white.png" alt="BrAtUkA" height="30"/>
  </a>
</p>
