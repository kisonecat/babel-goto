const replaceGotos = {
  CallExpression(path) {
    if (path.node.callee.name == "goto") {
      var t = this.types;
      var label = path.node.arguments[0].name;
      if (this.labels.indexOf(label) >= 0) {
        var n = this.labels.indexOf(label) + 1;
        path.replaceWithMultiple([t.expressionStatement(t.assignmentExpression("=", this.var, t.numericLiteral(n))),
                                  t.continueStatement( this.var )]);
      }
    }
    return;
  }
};

module.exports = function({ types: t }) {
  return {
    visitor: {
      BlockStatement(path) {
        var labels = [];
        
        var splitted = path.node.body.reduce(function(arr, el) {
          if (t.isLabeledStatement(el) && ! el.trampoline) {
            arr.push([el]);
            labels.push( el.label.name );
          } else {
            arr[arr.length - 1].push(el);
          }
          return arr;
        }, [[]]);

        if (splitted.length == 1)
          return;

        var switches = splitted
            .filter( function(s) { return s.length > 0; } )
            .map( function(s) {
              if (s.length == 0) return s;
              
              if (t.isLabeledStatement(s[0])) {
                var label = s[0].label.name;
                var n = labels.indexOf(label) + 1;
                
                return t.switchCase(t.numericLiteral(n), [s[0].body].concat( s.slice(1) ) );
              } else
                return t.switchCase(t.numericLiteral(0), s );
              
              return t.switchCase(t.numericLiteral(17), s );
            });

        switches.unshift( t.switchCase(t.numericLiteral(0), [] ) );
        
        var trampoline = path.scope.generateUidIdentifier("trampoline");
        
        var declareTrampoline =
            t.variableDeclaration("var", [t.variableDeclarator(trampoline, t.numericLiteral(0))]);

        var whileStatement = t.whileStatement(t.booleanLiteral(true),
                                              t.blockStatement([t.switchStatement(trampoline, switches),
                                                                t.breakStatement( trampoline )
                                                               ]));
        var loop = t.labeledStatement( trampoline, whileStatement );
        loop.trampoline = true;

        path.replaceWith( t.blockStatement([declareTrampoline, loop ]) );
        path.traverse(replaceGotos, { types: t, var: trampoline, labels: labels });
      },
    }
  };
};
