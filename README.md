# The Boring Blocker

![The Boring Blocker Logo](public/icon-128.png)

A Chrome extension that makes your web browsing experience more enjoyable by redacting mentions of Elon.

## Features

- Automatically detects and replaces text mentions on any webpage
- Replaces images 
- Customisable replacement text

## Installation Instructions

### From GitHub Release (Easier)

Download the ZIP file from the latest [GitHub Release](https://github.com/Rusty-Pea/the-boring-blocker/releases) and follow the instructions in it


### From Source Code

1. Clone this repository:
   ```
   git clone https://github.com/Rusty-Pea/the-boring-blocker.git
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Build the extension:
   ```
   npm run build
   ```
4. Follow steps 3-6 from the GitHub Release instructions, but select the `dist` folder

## Usage

1. Click the extension icon in your browser toolbar to open the popup
2. Toggle the extension on/off
3. Customise the replacement text
4. Select which specific mentions to filter
5. Enable/disable image blocking

## Known Issues
- Some dynamic content may not be replaced immediately
- Image replacements rely on the alt text having mentions of the person and so won't work if they aren't there

## Future improvements
- Mode where it actually removes the mentions instead of redacting them (via HTML tag blocking known for the big sites)
- Add notification badges for when the above is ocurring
- "Ignore on this site"

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Privacy

This extension does not collect any user data. All processing happens locally in your browser.