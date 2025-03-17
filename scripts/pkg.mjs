import { need } from "@yao-pkg/pkg-fetch";
import * as ResEdit from "resedit";
import * as PELibrary from "pe-library";
import { promises as fs } from "fs";
import PkgMeta from "./pkg-meta.json" with { type: "json" };
import NpmPkg from "../package.json" with { type: "json" };
import { spawnAsync } from "./util.mjs";

// Language code for en-us and encoding codepage for UTF-16
const language = {
    lang: 1033, // en-us
    codepage: 1200, // UTF-16
};

async function addIcon(res) {
    const iconFile = ResEdit.Data.IconFile.from(await fs.readFile(PkgMeta.icon));
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
        res.entries,
        1,
        language.lang,
        iconFile.icons.map((item) => item.data)
    );
}

async function processStrings(res) {
    let viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
    console.log(viList[0].data.strings);
    let vi = viList[0];
    const theversion = `${NpmPkg.version}.0`.split(".");
    console.log("Removing OriginalFilename");
    vi.removeStringValue(language, "OriginalFilename");
    console.log("Removing InternalName");
    vi.removeStringValue(language, "InternalName");
    console.log("Setting Product Version");
    vi.setProductVersion(theversion[0], theversion[1], theversion[2], theversion[3], 1033);
    console.log("Setting File Version");
    vi.setFileVersion(theversion[0], theversion[1], theversion[2], theversion[3], 1033);
    console.log("Setting File Info");
    vi.setStringValues(
        { lang: 1033, codepage: 1200 },
        {
            FileDescription: PkgMeta.name,
            ProductName: PkgMeta.name,
            CompanyName: PkgMeta.company,
            LegalCopyright: PkgMeta.copyright,
        }
    );
    console.log(vi.data.strings);
    vi.outputToResourceEntries(res.entries);
}

async function addPkgMeta(exePath) {
    const exe = PELibrary.NtExecutable.from(await fs.readFile(exePath));
    const res = PELibrary.NtExecutableResource.from(exe);
    await addIcon(res);
    await processStrings(res);
    res.outputResource(exe);
    await fs.writeFile(exePath, Buffer.from(exe.generate()));
}

const NODE_RANGE = "node22";
const PLATFORM = "win32";
const ARCH = "x64";

async function fetchPkg() {
    return await need({
        output: "./.pkg-cache",
        nodeRange: NODE_RANGE,
        platform: PLATFORM,
        arch: ARCH,
    });
}


async function runPkg(pkgPath) {
    const env = {
        ...process.env,
        PKG_NODE_PATH: pkgPath,
    };
    const command = 'npx';
    const args = ['pkg', '.', '--compress', 'GZip'];
    await spawnAsync(command, args, {env});
}

async function main() {
    try {
        console.log("Fetching Pkg...");
        const pkgPath = await fetchPkg();
        console.log("Adding Pkg metadata...");
        await addPkgMeta(pkgPath);
        console.log("Running Pkg...");
        await runPkg(pkgPath);
        console.log("Finished building executable.");
    } catch (error) {
        console.error('Error during build:', error);
        process.exit(1);
    }
}

main().then();
