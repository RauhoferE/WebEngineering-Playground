# Writeup for playground 1

## Task 1

**Theory question:** How does an ES module differ from a classic script with respect to scope, strict mode, loading, and bindings? Explain why the module boundaries you chose make the application easier to maintain.

**Answer:** An ES module differs from a classic script by the following

### Scope 

Script -> Top level variables and functions are added directly to the global scope (window)
Module -> Top level variables and functions are only accessible in the module except when they are exported or imported from other modules

### Strict mode

Helps make the code safer and less error prone.
Like undeclared variables throw an Error
Doesnt allow duplicate Parameter names in functions.

Script -> Runs in no strict mode
Module -> Run in strict mode by default (usage of "use strict not necessary")

### Loading

Script -> Parsed and executed synchronously as soon as browser encounters the script (except defer and async )
Modules -> Are fetched in parallel and only executed when the html has been loaded, Defered by default, can also be loaded asynchronously (subject to cors checks)

### Bindings

Script -> Copy by value (Changing the original variable does not change the copy)
Module -> Live binding -> When importing variable or function you import a reference (Changing original changes the reference)
Imports are readonly

## Task 2 Event propogation

**Theory question:** Describe event propagation (capturing, target, and bubbling). Where could event delegation be useful in this application, and what trade-off would it introduce?

Defines the order in which event handlers are executed when an event occurs inside a nested element in the DOM.
Events travel through the DOM in three phases.

You can alter the event propagation behaviour.

event.stopPropogation() -> Prevents from traveling up (bubbling) or down (capturing)

event.stopImmediatePropagation() -> Stops propagation to parent/child elements and prevents other listeners from the same element from executing

event.preventDefault() -> Does not stop propagatin but default browser behaviour like submitting a form

### Capturing

Direction Top(window,document)->Down to targets immediate parent

Used by addEventListener when capture set to true

Needed when parent needs to intercept childs element

### Target phase

When event reaches the Dom element where the event originated

All event listeners of the target are executed, regardless when they were registered

### Bubbling

Direction: Bottom(target element)->Top(document, window)

Used by most standard DOM events(click, keydown)
Allows ancestors to react to events triggered on their descendants

Focus, blur, mouseenter do not bubble

## Task 4

**Theory question:** Explain the relationship between `async`/`await`, promises, the microtask queue, and the browser event loop. Also explain why an arrow function is not always an interchangeable replacement for a regular function, particularly regarding `this`.

Javscript executes on a single thread.
To do asynchronous operations it relies on Event Loops, Promises, Microtask queue.

### Promises

Promise represents an eventual completion/failure of a an asynchronous operation.
It allows you to attach handlers(then/catch) that will be executed when the task completes.

### Async/await

Is syntactic sugar for Promises
An async function will always return a promise.
await stops the execution of the async function until the awaited function returns.
It yields control back to the main thread -> Allows other code to run

### Microtask queue

While an asynchronous operation completes the callback is placed into the microtask queue to await the main thread.
It basically holds callbacks from resolved promises. (then/catch/finally)

Macrotask is responsible for setTimeout/Dom event listeners/network callbacks

### Event loop

Checks continuesly if Call stack is empty and orchestrates the execution:

1. Execute one task from the call stack. (Can be synchronous or macrotasks)
2. Once the call stack is empty execute all tasks in the microqueue
3. When empty, the browser renders UI updates
4. Take next task from the macrotask queue and push onto the call stack.


### Arrow function vs Regular function

They are not just shorter syntax for regular functions they have completly different behaviour(Execution context, binding and object creation)

### This

In regular function this is dynamically bound to the object calling the function.

obj.funct() -> this is the object
func() -> this is the window or document
el.addeventlistener('click', func) -> this is the target element

In arrow functions this is resolved lexically from the enclosing scope.

```
const user = {
  name: 'Alex',
  
  // Regular Function
  greetRegular: function() {
    console.log(this.name); // 'Alex' (this -> user)
  },

  // Arrow Function
  greetArrow: () => {
    console.log(this.name); // undefined (this -> window / global scope)
  },

  // Practical Difference: Callbacks
  delayedGreet: function() {
    // Regular function inside setTimeout loses `this` reference unless bound
    setTimeout(function() {
      console.log('Regular Timeout:', this.name); // undefined
    }, 100);

    // Arrow function preserves lexical `this` from delayedGreet
    setTimeout(() => {
      console.log('Arrow Timeout:', this.name); // 'Alex'
    }, 100);
  }
};

user.greetRegular();
user.greetArrow();
user.delayedGreet();
```

Regular functions care how they are called, anonymous functions dont.

```
user.greetREgular(); <- Here the function looks whats behind the dot
user.greetArrow(); <- The function does not care about the dot and goes to the calling scope which is global.
```

#### Scopes

Scopes in Js are created only by functions, modules, and blocks(if/for)

### Prototype

Arrow functions lack the prototype property.
So they cant be used as constructors.

### Arguments

Regular function have impicit arguments
Arrow functions inherit it from the outer scope
Can be extended with (...args)

### Call/bind/apply

Regular functions can have their this changed with call/bind/apply
Arrow functions dont

## Task 3

**Theory question:** How do synchronous exceptions and rejected promises travel through this application? Explain where errors should be caught and why catching every error at its source can make failures harder to diagnose.

### How Errors travel

#### Synchronous errors

Javscript immediatly halts execution and searches for the nearest try catch block.
Either execution resumes in catch block or
Error bubbles to the callstack, terminates stack execution and triggers a global error event.

#### Asynchronous errors

Generates a promise rejection
Then() gets bypassed and travels down until it hits a catch()

Awaited promise rejections are converted into an synchronous error.
Otherwise rejected promise travels to the global unhandled rejection handler.

### When errors should be caught

User Facing events (Forms/inputs)
Data/API (network failures, IO failures)

### Why catching errors at the source is not always a good idea

1. Context and trace loss 
If low level function catches an error and returns the overlying function has no idea that a failure occured.
This might lead to a crash further down the execution path -> Root cause analysis becomes difficult

2. Masking source of truth
Strips original Error stack trace or prevents higher boundaries from acting accordingly

3. Duplicate and noise logs
When low level function catches and throws error, the same error might be printed multiple times at each layer of the stack.

Best when low level utility functions propogate the error unless they can recover from it.