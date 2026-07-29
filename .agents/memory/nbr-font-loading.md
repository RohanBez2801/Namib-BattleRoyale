---
name: NBR font loading
description: Why Google Fonts are banned in the NBR mobile app and what to use instead.
---

# NBR font loading — no @expo-google-fonts

## Rule
Never import from `@expo-google-fonts/*` or call `useFonts()` with remote font assets in the NBR mobile app. Use system fonts only (React Native's default sans-serif is fine).

## Why
`fontfaceobserver` (used internally by expo-font for web) times out after 6000ms when the device cannot reach the Google Fonts CDN (common on Namibian networks and in the Expo Go web preview). This throws an uncaught error that crashes the entire app before the root layout mounts — the user sees the Expo error overlay, not the game.

## How to apply
- `app/_layout.tsx` must NOT import `useFonts` or any `@expo-google-fonts` package.
- Call `SplashScreen.hideAsync()` inside a plain `useEffect(()=>{...},[])` with no font-load gate.
- If custom fonts are later needed, bundle them locally inside `assets/fonts/` and load with `expo-font`'s `Font.loadAsync` — never point at a remote CDN URL.
