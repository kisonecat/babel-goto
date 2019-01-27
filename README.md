# Goto in JavaScript

A [Babel](https://babeljs.io/) transformer which implements goto (within function scope) for JavaScript.

## Example

```
function loop() {
  var i = 0;
  
  start:
    i = i + 1;
    console.log(i);
    if (i == 10) goto(end);
    goto(start);
    
  end:
    console.log("all done");
}

loop();
```

Run this with:
```
babel-node --plugins ./babel-goto-plugin index.js
```

## How does this work?

Blocks that include labels are rewritten as labeled infinite loops
containing a switch statement; labels become cases, and `goto` sets
the appropriate case of the switch statement and then jumps using a
labeled continue.  Such a technique might be termed a
[trampoline](https://en.wikipedia.org/wiki/Trampoline_(computing))
since control jumps back to the beginning (via the labeled continue)
and then to the appropriate labeled position (via the switch
statement).

There are limitations: it isn't possible to `goto` a label in a deeper
block.  On the other hand, it *is* possible to jump both forward and
backward.

## Credits

Inspired by [Alex Sexton's Summer of Goto](https://alexsexton.com/blog/2009/07/goto-dot-js/).
