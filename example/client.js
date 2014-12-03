(function (d) {
  "use strict";

  var src = '{{serverPath}}?id='+ {{requestId}} +
   '&width=' + d.documentElement.clientWidth +
   '&height=' + d.documentElement.clientHeight;

  d.write('<script src="' + src + '"></'+'script>');
}(document));
