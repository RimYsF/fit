# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Telegram Web App (Mini App) example demonstrating how to integrate web applications with Telegram Bots using the Telegram Web Apps API. It's a single-page HTML application that showcases all available features and APIs.

## Architecture

- **Single HTML file**: The entire application is contained in `index.html`
- **Vanilla JavaScript**: Uses plain JavaScript without external frameworks
- **Telegram WebApp API**: Integrates with `telegram.org/js/telegram-web-app.js`
- **Inline CSS**: All styles are embedded in the HTML `<style>` tag
- **Self-contained**: No build process, package.json, or external dependencies

## Key Components

### DemoApp Object
Main application object (`window.DemoApp`) that handles:
- Telegram WebApp initialization and configuration
- UI interactions (buttons, popups, alerts)
- API calls to Telegram features
- Permission management (location, biometrics, contacts)
- Cloud storage operations
- Sensor data (accelerometer, gyroscope, device orientation)

### UI Sections
- **Top Section**: Main action buttons and color customization controls
- **Test Links Section**: Demonstrates various link opening methods
- **Permissions Section**: Location, video, audio, clipboard, write access, phone number
- **Sensors Section**: Accelerometer, device orientation, gyroscope controls
- **Alerts Section**: Different alert methods (alert, confirm, popup, QR scanner)
- **Cloud Storage Section**: Key-value storage interface
- **Biometrics Section**: Biometric authentication management
- **Data Display**: Shows init data, theme parameters, and version info

## Development Guidelines

### Testing the App
1. Host the HTML file on a web server (GitHub Pages, Vercel, Netlify, etc.)
2. Create a bot via @BotFather
3. Set up the Web App URL in bot settings:
   - Bot Settings → Configure Mini App
   - Bot Settings → Menu Button
4. Or send an inline keyboard button with `web_app` parameter

### Making Changes
- Edit `index.html` directly
- No build process required - just refresh the page
- Test changes in Telegram client, not regular browser
- Use browser developer tools for debugging

### Backend Integration
- The `apiRequest` function in DemoApp is disabled for demo purposes
- Replace it with actual backend calls to enable bot communication
- Backend should verify initData hash for security

### Common Development Tasks
- **Add new Telegram WebApp features**: Follow existing button patterns in HTML and add corresponding methods to DemoApp
- **Customize styling**: Modify CSS variables that use `--tg-theme-*` properties to maintain theme consistency
- **Debug init data**: Check the `webview_data` pre element for initialization parameters
- **Test theme changes**: Use color pickers in the UI to test different theme combinations

## Important Notes
- This is a frontend-only demo - backend features are disabled
- Some features require specific Telegram client versions
- Always test in Telegram app, not standalone browser
- The app uses `Telegram.WebApp.ready()` to signal readiness
- Theme changes automatically propagate through CSS custom properties