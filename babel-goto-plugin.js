const fs = require('fs');

var labelsToNumbers = {};
var newLabel = 1;
function labelToNumber(label) {
  var n = labelsToNumbers[label];
  if (n === undefined) {
    n = labelsToNumbers[label] = newLabel;
    newLabel++;
  }
  return n;
}

const replaceGotos = {
  CallExpression(path) {
    if (path.node.callee.name == "goto") {
      var t = this.types;
      var n = labelToNumber(path.node.arguments[0].name);
      path.replaceWithMultiple([t.expressionStatement(t.assignmentExpression("=", this.var, t.numericLiteral(n))),
                                t.continueStatement( this.label )]);
      
    }
    return;
  }
};

module.exports = function({ types: t }) {
  return {
    visitor: {
      BlockStatement(path) {
        // Split along labels
        var splitted = path.node.body.reduce(function(arr, el) {
          // FIXME: matching on the label is really bad
          if (t.isLabeledStatement(el) && ! el.label.name.match(/trampoline/)) {
            arr.push([el]);
          } else {
            arr[arr.length - 1].push(el);
          }
          return arr;
        }, [[]]);

        if (splitted.length == 1)
          return;

        var switches = splitted.map( function(s) {
          if (s.length == 0) return s;
          
          if (t.isLabeledStatement(s[0])) {
            var label = s[0].label.name;
            var n = labelToNumber(label);
              
            return t.switchCase(t.numericLiteral(n), [s[0].body].concat( s.slice(1) ) );
          } else
            return t.switchCase(t.numericLiteral(0), s );

          return s;
        });

        var trampoline = path.scope.generateUidIdentifier("trampoline");
        var trampolineLabel = path.scope.generateUidIdentifier("trampolineLabel");        
        var declareTrampoline =
            t.variableDeclaration("var", [t.variableDeclarator(trampoline, t.numericLiteral(0))]);

        var whileStatement = t.whileStatement(t.booleanLiteral(true),
                                              t.blockStatement([t.switchStatement(trampoline, switches),
                                                                t.breakStatement( trampolineLabel )
                                                               ]));
        var loop = t.labeledStatement( trampolineLabel, whileStatement );
        loop.trampoline = true;

        path.replaceWith( t.blockStatement([declareTrampoline, loop ]) );
        path.traverse(replaceGotos, { types: t, var: trampoline, label: trampolineLabel });
      },
    }
  };
};
