# Writeup 3

## Task 1

**Theory question:** Contrast imperative DOM updates with React's declarative model. What happens during React's render, reconciliation, and commit phases, and why should code outside React not modify DOM nodes owned by the React root? If you chose not to use React, answer the same questions in the context of your chosen framework.

### Imperative vs declarative

Imperetive tells the browser how to change the page (remove,add nodes) while in react you describe wha the UI should look like.

The imperative version gets harder as the number of possible states grows, because every pair of states needs a correct transition.

### React phases

#### Render

When state or props change, React calls the component functions to produce a new tree of react elements, describing what the UI should be.
Nothing touches the DOM.
Rendering should be pure, thats why React can call components more than once, pause partway through or throw away the work.

#### Reconciliation

React compares the new element tree against the old one.
It finds elements by heuristic rather than a general diff.
So components of different types at the same position are torn down and rebuild.
Elements of the same type are updated in place with only the changed props.

The output is a list of pending mutations.
This phase is usually done with the render phase.

#### Commit

React applies those mutations to the real DOM in one pass.
It first runs useLayoutEffect callbacks and then useEffect callbacks.
This phase can never be interrupted so the user never sees half UI update.

### Why outside code should not modify React-owned DOM?

React doesnt read the DOM
It just compares the new tree against its own record of what is last rendered.
Changing the DOM without react breaks the UI:

- Changes can be silently overwritten or not overwritten at all
- Crash react
- Events can refs can also break

## Task 2

### Component Boundaries

Component boundaries seperate the parent who supplies the props and the child who renders from them.
Props type is an aggreement between them.
What the child requires, whats optional and what shape each value takes.

Typescript checks this at the compile time.

If the parent passes a child which misses a property or has the wrong type the build fails.
The child guarantees not to depend on anything outside these props (reaching into the parents state)

This also means parent or child can change aslong as the contract holds.
Without typescript violations only show up at runtime.

### Stable Keys

Keys are needed at reconciliation.
React compares the new list of children to the old one and decides which elements to update.
Without keys it can only compare children by posiition which does not work for removing, added or reorder.

The key gives each kid an identity that survives accross rerender.

Good key properties:

- unique among siblings
- stabel accross rerender (so it gets the same key every time)
- tied to the item not position

Array indexs is not suitable since it tracks the position not the item itself.
So if the position is changed (reorder) the data moves and react attaches the wrong identity.

## Task 3

### Props

Inputs a component receives from the parent
Component only reads them, but never change
They only flow one way

### stored state

Data owned by component and changes over time
hold it via useState and change it via setter tells React to rerender

### Derived values

Anything that is computed from state or props during render.
Should never be stored

### Direct mutation

React decides if something changed by comparing references not inspecting content.
If you use direct mututaion React does not know that something changed and not rerender.
It can also corrupt history -> if you change a snapshot it will contain new data and that breaks the comparison of old and new.

States shoudl be immutable.

### Lifting state vs introducing context

When two components need the same state the state should live in their closest common ancestor which passes it down as a prop -> Lifting state
Preferably when close in the tree.

Context removes props from the path and a provider makes the value available to ANY descendant that calls useContext.
Dependency becomes implicit -> harder to reuse and test.
You cant tell what a component needs from its signature and fails when rendered outside the expected provider.

Every consumer rerenders when the context changes.

## Task 4

Rendering is only pure calculation -> The same props and state return the same output.
With no side effect.

Fetch breaks that.
Has Side efffect with sending and receiving (server may change data)
Is not deterministic -> Response depends on the server, nbetwork, timing
Is Asynchronous so results arrive after render has returned and can't be part of the output.

If you started a fetch in the component body, every extra or discarded render would fire another request, and you'd have no place to put the response except by setting state, which triggers another render, which fires another request.

So you want to keep the localized state synchronized with the server -> useEffect
Code that runs after commit in response to component beeing on screen with particular values and can be undone when values change or the component leaves.

### Race condition

If two request are done for the same component you dont know which will arrive first.
Request -> Prop changes -> Request :- Now there are two unfinsihsed requests

Either one will overwrite the other
Or if the component unmounts the request is still resolved.

#### Fix via cleanup

React runs the effects cleanup function before rerunning the effect and when the component unmounts.
This is where you mark a request as irrelevant (ignore flag)
Prop chnage -> set ignore to true -> old request gets discarded

AbortController cancels the request instead of ignoring

## Task 5

### Client side rendering

Server sends empoty html and js
Browser builds the dom

### SSR

Server sends HTML with page content

### SPA

How many document the browser loads.
Browser loads one HTML document and every later screen is produced by JS updating the HTML
JS state, connections, in memory caches survive as the user moves around

Ususally CSR but also SSR where server renders first view and then browser takes over (hydration)

### Client side routing

How URLs map to screen without document reloading
Router libaray uses History API ot change address bar and intercept link clicks and renders component matching the new URL.
Lets SPA use real URLs, back button and bookmarks.

### Route param vs query param

Route params -> Part of url path (usually what item)
Query params -> Comes after the path (usually filtering)

Neither is typed (only string)

Route params:

- Required
- positional

Query params:

- optional
- named
- unordered

Benefit: fast, stateful navigation after the first load. (does not reload page)
Shared layout stays mounted
Makes app feel more reponsive

Cost: a slower and more fragile first load.
Initial HTML is empty and browser need JS to make UI.
On slow networks -> longer blank screen
Also worse for SEO since it relies on HTML
If bundle fails -> User sees nothing
