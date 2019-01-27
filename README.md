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

## Credits

Inspired by [Alex Sexton's Summer of Goto](https://alexsexton.com/blog/2009/07/goto-dot-js/).
