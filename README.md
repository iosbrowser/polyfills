# Polyfills

This project provides JavaScript polyfills (and fixes) for Mobile Safari and WebKit-based views on iOS.

## Description

The `Polyfills` tweak injects JavaScript polyfills to enhance web compatibility for older iOS versions. It targets Mobile Safari, Safari View Services, and general WebKit views.
The JavaScript polyfills can be found in `/scripts` and `/scripts-post` folders.

## Requirements

- iOS 8.0 or later

## Installation

1. Build the project using Theos.
2. Install the resulting `.deb` package on your jailbroken iOS device.

# Building

```sh
npm install
make
```

# Additional Notes

Check out the [WKExperimentalFeatures.md](WKExperimentalFeatures.md) file for recommended WebKit experimental features to enable to enhance web compatibility further.
