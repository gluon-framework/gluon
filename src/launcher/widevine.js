// massive shoutouts to https://github.com/proprietary/chromium-widevine/

import { resolve } from "path";
import { existsSync, createReadStream } from "fs";
import { rm, mkdir, writeFile, cp } from "fs/promises";
import { platform, arch, tmpdir } from "os";
import { Extract } from "unzipper";

const tempDirectory = resolve(tmpdir(), "gluon-widevine");

const checkWidevine = (dataFolder) =>
  existsSync(resolve(dataFolder, "WidevineCdm"));

async function installWidevine(dataFolder) {
  await rm(tempDirectory, { recursive: true, force: true });
  await mkdir(tempDirectory);

  const cpuArch = arch();

  if (["x64", "ia32", "arm64"].indexOf(cpuArch) === -1) return;

  const plat =
    {
      win32: "win",
      darwin: "mac",
    }[platform()] ?? "linux";

  const versions = (
    await (
      await fetch("https://dl.google.com/widevine-cdm/versions.txt")
    ).text()
  ).split("\n");
  const latest = versions[versions.length - 2];

  const release = await (
    await fetch(
      `https://dl.google.com/widevine-cdm/${latest}-${plat}-${cpuArch}.zip`
    )
  ).arrayBuffer();

  const wvZipPath = resolve(tempDirectory, "widevine.zip");
  const wvUnzippedPath = resolve(tempDirectory, "widevine");
  const wvFixedPath = resolve(tempDirectory, "widevine_fixed");

  await writeFile(wvZipPath, new Uint8Array(release));

  await new Promise((res) =>
    createReadStream(wvZipPath).pipe(
      Extract({ path: wvUnzippedPath }).on("close", res)
    )
  );

  await mkdir(wvFixedPath);

  const files = [["LICENSE.txt", "LICENSE"], ["manifest.json"]];

  switch (plat) {
    case "linux":
      files.push([
        "libwidevinecdm.so",
        `_platform_specific/linux_${cpuArch}/libwidevinecdm.so`,
      ]);
      break;
    case "mac":
      files.push(
        [
          "libwidevinecdm.dylib",
          `_platform_specific/mac_${cpuArch}/libwidevinecdm.dylib`,
        ],
        [
          "libwidevinecdm.dylib.sig",
          `_platform_specific/mac_${cpuArch}/libwidevinecdm.dylib.sig`,
        ]
      );
      break;
    case "win":
      files.push(
        [
          "libwidevinecdm.dll",
          `_platform_specific/win_${cpuArch}/libwidevinecdm.dll`,
        ],
        [
          "libwidevinecdm.dll.lib",
          `_platform_specific/win_${cpuArch}/libwidevinecdm.dll.lib`,
        ],
        [
          "libwidevinecdm.dll.sig",
          `_platform_specific/win_${cpuArch}/libwidevinecdm.dll.sig`,
        ]
      );
      break;
  }

  for (const [from, to] of files)
    await cp(resolve(wvUnzippedPath, from), resolve(wvFixedPath, to ?? from), {
      recursive: true,
    });

  const wvChromeLocation = resolve(dataFolder, `WidevineCdm/${latest}`);
  await cp(resolve(wvFixedPath), wvChromeLocation, { recursive: true });

  await writeFile(
    resolve(dataFolder, "WidevineCdm/latest-component-updated-widevine-cdm"),
    JSON.stringify({
      Path: wvChromeLocation,
    })
  );

  log("Widevine installed successfully!");
}

async function ensureWidevineUnmutexed(dataFolder) {
  try {
    if (checkWidevine(dataFolder)) return;

    await installWidevine(dataFolder);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

// we only really want to run one widevine install at once
// no matter how many browser windows you open
let currentlyInstallingPromise;

export async function ensureWidevine(dataFolder) {
  try {
    currentlyInstallingPromise ??= ensureWidevineUnmutexed(dataFolder);
    await currentlyInstallingPromise;
  } finally {
    currentlyInstallingPromise = undefined;
  }
}
