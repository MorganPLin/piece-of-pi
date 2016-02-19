import d3 from 'd3';

/*
* memoize.js
* by @philogb and @addyosmani
*/
// https://addyosmani.com/blog/faster-javascript-memoization/

// memoize is caching data from your json file, stores values to reduce expensive recursive computations
export function memoize(fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);

    var key = "",
    i = args.length,
    currentArg = null;

    while (i--) {
      currentArg = args[i];
      key += (currentArg === Object(currentArg))?
      JSON.stringify(currrentArg): currentArg;

      fn.memoize || (fn.memoize = {});
    }

    return (key in fn.memoize)? fn.memoize[key]:
    fn.memoize[key] = fn.apply(this, args);
  };
}


