(function () {
  'use strict';
  angular.module('main')
    .directive('autolinker', ['$timeout',
      function ($timeout) {
        return {
          restrict: 'A',
          link: function (scope, element, attrs) {
            $timeout(function () {
              var eleHtml = element.html();

              if (eleHtml === '') {
                return false;
              }

              var text = Autolinker.link(eleHtml, {
                className: 'autolinker',
                newWindow: false
              });

              element.html(text);

              var autolinks = element[0].getElementsByClassName('autolinker');

              for (var i = 0; i < autolinks.length; i++) {
                angular.element(autolinks[i]).bind('click', autolinkClick);
              }

              function autolinkClick(e) {
                var href = e.target.href;
                console.log('autolinkClick, href: ' + href);

                if (href) {
                  //window.open(href, '_system');
                  window.open(href, '_blank');
                }

                e.preventDefault();
                return false;
              }
            }, 0);
          }
        };
      }
    ])
    .filter('nl2br', ['$filter',
      function ($filter) {
        return function (data) {
          if (!data) return data;
          return data.replace(/\n\r?/g, '<br />');
        };
      }
    ]);

} ());