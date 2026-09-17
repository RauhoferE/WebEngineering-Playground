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

## Task 2

**Theory question:** TypeScript uses structural typing and erases types during compilation. Explain both concepts and why a compile-time type alone cannot guarantee the shape of a Wikipedia API response at runtime.

### Answer

Structural typing

Typescript determines type compataibility based in an objects structure. (It does not have any explicit class inheritance or interface implementation)

If an object has all required properties of a type it treats it as this type regardless on how it was created.

Type erasure: During compilation typescript strips away type annotation, interface, custom type alias and generic constraints since the javascript file has no type information. It only exists when statically checking not during runtime.

Why type fails from API:
Type assertions just tells typescript that you now that the API response matches your type it is not a parser.

Through the type erasure the js will assume that the properties exist.

If wikipedia changes their markup or missing fields the code will proceed as if the properties of the type still exist.
And when calling them it might crash the application.

## Task 3

**Theory question:** What different problems do a linter, a formatter, and the TypeScript compiler detect? Give one concrete example for each from this project.

### Formatter(Prettier)

Code presentation and Code style

Indentation, quote types, trailing commas, whitespaces

```
const data : unknown = await res.json();
const data: unknown = await res.json();
```

### Linter (EsLint)

Code quality, Performs static analysis

Unused variable, unreachable code, Loose equality, etc

```
   3:7   error  Unexpected string value in conditional. An explicit empty string check is required                 @typescript-eslint/strict-boolean-expressions
const observer = new MutationObserver(() => {
  if (lastQuery) {
    clearHighlights();
    highlightText(lastQuery);
  }
});
```

### Typescript compiler

Type safety and syntax

Type mismatches, missing interfaces, incorrect argument counts, null/undefined errors

```
const form = document.querySelector(".comment-form");
const form = document.querySelector<HTMLFormElement>(".comment-form");
```
## Task 4

**Theory question:** Why are stable, composable commands such as these useful as an interface for developers and CI? Explain idempotence and identify which of your scripts should be idempotent.

They decouple project specific commands from the implementation details like a make file.

It allows for developers and CI to run identical workflows accross repositories.

Its also easier to swap out toolchains while the commands stay the same.

Non Zero exit code also allow the CI to fail early and block broken code from merging.

**Idempotent** -> Something that runs the exact same way every time.
For the same input you get the same output.

build -> Given the same source code builds the same app on every machine
lint/format -> Inspection which is read only

dev->Is not idempotent since it spawns a second server or cant run on the same port