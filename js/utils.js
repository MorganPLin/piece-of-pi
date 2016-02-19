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

// export function debounce(func, wait, immediate) {
//   var timeout;
//   return function() {
//     var context = this, args = arguments;
//     var later = function() {
//       timeout = null;
//       if (!immediate) {
//         func.apply(context, args);
//       }
//     };
//     var callNow = immediate && !timeout;
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//     if (callNow) {
//       func.apply(context, args);
//     }
//   };
// }

// export var getTween = function (prop, to, time) {
//   time = time || 500;
//   var node = this;
//   var curr = node[prop];
//   var interpol = d3.interpolateObject(curr, to);
//   return function (t) {
//     node[prop].copy(interpol(t / time));
//     if (t >= time) {
//       return true;
//     }
//   };
// };
