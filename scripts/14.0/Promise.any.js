// https://www.npmjs.com/package/promise-any-polyfill
(function () {
    Promise.any=o=>new Promise(((i,l)=>{var n,t,v,d,e;let u=!1,c=[],h=0,f=[];function a(o){u||(u=!0,i(o))}function r(o){f.push(o),f.length>=h&&l(f)}for(let i of o)h++,c.push(i);for(let o of c)void 0!==(null===(n=o)||void 0===n?void 0:n.then)||void 0!==(null===(t=o)||void 0===t?void 0:t.catch)?(null===(d=null===(v=o)||void 0===v?void 0:v.then((o=>a(o))))||void 0===d||d.catch((o=>{})),null===(e=o)||void 0===e||e.catch((o=>r(o)))):a(o)}));
})();
