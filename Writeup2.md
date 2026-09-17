# Writeup

## Task 1

**Theory question:** Distinguish source, build, distribution, and deployment. What does your build tool do in development and in a production build, and why is the lockfile important for reproducibility?

### Source

The raw source file and what gets commited to git.

- index.html
- js folder
- style.css
- public folder 
- package.json

Not commited:

- Node modules

### Build

Process of transforming the raw source files into something able to be run (vite build).
It resolves imports, transpiling bundleing and hashing filenames.

Also makes files smaller (minifying) and removes comments.
Can also be used for obfuscation.

### Distribution

The artifacts from the build process.
Can be found in the dist folder.
Self contained HTML/CSS/JS and assets.
Everything needed to serve the website.

No node modules or source code.

### Deployment

Making the website reachable by puting it on a server.

### dev vs prod

In **dev** it starts a local server and serves the source files close to native es modules (no bundeling or minification)

Transforms files on demand instead of everting upfront

Pre bundles node_modules to stop browser from making requests for dependencies.

Hot module reload: Reload single modules like JS or css without while running without reloading the whole site.

In **prod** it bundles all modules into small chunks and also minifies the js files for performance reasons.

Performs tree shaking - removing unused code paths.

Hashes output filenames for cache busting (Browsers cache files and when a new release comes the old files might still be serverd)

Produces the dist folder.

Moves everything into the public folder - thats why i moved media there otherwise Vite cannot find them.

### Why lockfiles matter

package.json declares version ranges not exact versions.
Another install could result in a different version.

package-lock.json contains the exact resolved versions of packages.
Helps to keep installs identical