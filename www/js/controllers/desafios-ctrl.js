/*global firebase*/
'use strict';
angular.module('main')
  .controller('DesafiosCtrl', function (TimesService, $timeout, $ionicModal) {
    var vm = this;
    vm.timesService = TimesService;
    vm.times = TimesService.timesRegiao;

    activate();

    function activate() {
    }

  });
