# HuertoConnect – Build & APK Notes

## Local workbench
- `npm install` (already run) keeps dependencies aligned with Expo SDK 54 (`react-native-reanimated@4.1.1`, `react-native-worklets@0.5.1`, `expo-font` added).
- `npx expo start -c` launches locally; use it to smoke-test UI before any release.
- Keep `.expo`, `.expo-export-validation`, `.easignore`, `.gitignore` in sync with tools that ignore caches.

## APK generation (current flow)
1. Confirm `app.json` has `expo.owner`, `android.package` and the same `projectId` added by `eas init`.
2. Maintain `credentials.json` + `android-upload-keystore.jks` outside Git; `eas.json` uses `credentialsSource: "local"` for the `preview` profile we built previously.
3. Create a clean staging copy outside OneDrive (e.g., via `robocopy` or copying to `C:\Users\herre\AppData\Local\Temp\huertoconnect-easbuild`) to avoid Windows permission errors when EAS compresses the project.
4. Remove read-only bits with `attrib -R "<staging>"\* /S /D` before running `npx eas build --platform android --profile preview --non-interactive`. Set `EAS_NO_VCS=1` and `EAS_PROJECT_ROOT` to the staging path if you run inside the temp folder.
5. Monitor the build with `npx eas build:list` / `build:view`; once it finishes, download the `.apk` from the `artifacts` URL. (Last successful APK is `nFdRUggCZBGeLeUeTp7gBe.apk`, saved locally as `HuertoConnect-preview.apk`.)

## Issues we hit & how we solved them
- **Worklets mismatch**: Expo Go ships `react-native-worklets 0.5.1`. We pinned `react-native-reanimated` to `4.1.1` and explicitly installed `react-native-worklets@0.5.1`, adding `expo-font`.
- **EAS upload failure**: Windows OneDrive prevented tarball cleanup. Workaround: stage the project outside OneDrive, add `.easignore`, run `EAS_NO_VCS=1`, and patch the local `eas-cli` to ignore cleanup errors while ensuring read-only flags are removed.
- **Server tar unpack errors**: Past builds failed because uploaded files had `ReadOnly` attributes (assets, `src`). Clearing attributes in the staging folder before uploading fixed the issue.

## Future builds via Cloud 4.6
1. Repeat the staging + permissions cleanup workflow before every build to avoid tarball errors.
2. Use Cloud 4.6’s `eas-cli` (or similar `eas build` workflow) with the same `preview` profile; expect `EAS_NO_VCS=1` and pointing `EAS_PROJECT_ROOT` to your clean copy.
3. Keep `credentials.json` and the keystore current; if you need a new signing key, generate it with `keytool` (same passphrase for PKCS12) and update the JSON.
4. Document every build attempt (ID, issues, log URLs) inside this README for easy reference before asking Cloud 4.6 again.

Whenever you return to this repo, follow these steps sequentially so the APK build is repeatable without re-triggering old blockers.
