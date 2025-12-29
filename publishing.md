# Publishing the extension

## Prerequisites
- DevOps (https://dev.azure.com/mspsystemsSmart) or GitHub account

- Node.js and npm installed
- A Publisher in the Visual Studio Marketplace (see https://marketplace.visualstudio.com/manage)
- A Personal Access Token (PAT) for publishing (you can pass it with `--pat <token>` or set it to `VSCE_PAT`/`$env:VSCE_PAT`)

## Install tooling

- Install `vsce` globally (optional):

```powershell
npm install -g vsce
```

- Or use `npx` to avoid a global install:

```powershell
npx vsce --version
```

## Build, package and publish

- Build the extension (compile and production build):

```powershell
npm run compile
npm run package
```

- Create a .vsix package:

```powershell
npx vsce package
# or, if you installed vsce globally
vsce package
```

- Publish to the Marketplace (bump level: patch/minor/major):

```powershell
# publish a patch release using an inline PAT
npx vsce publish patch --pat <YOUR_VSCE_PAT>

# or set the PAT in the environment (PowerShell example) and publish
$env:VSCE_PAT = "<YOUR_VSCE_PAT>"
npx vsce publish
```

- You can also publish the generated .vsix file directly through the Marketplace web UI if you prefer a manual publish.

> Note: `npx vsce publish` will increment the version in `package.json` when you pass 'patch', 'minor', or 'major'. If you want to control the version manually, update `package.json` first and then run `npx vsce publish --packagePath <file>.vsix --pat <token>`.

---

## Debugging

To debug your extension, press `F5` to open a new Extension Development Host window. This will launch a new instance of VS Code with your extension loaded. You can set breakpoints and step through your code as needed.

```powershell
code --extensionDevelopmentPath="c:\Users\MPhil\source\repos\MSP_VSCode_Extension\voiceitems\voiceitems" "c:\Users\MPhil\source\repos\MSP_VSCode_Extension\voiceitems\voiceitems\sample.tasks"
```

---

If you'd like, I can also add a simple GitHub Actions workflow to automate building and publishing on releases or tags — want me to add that next?