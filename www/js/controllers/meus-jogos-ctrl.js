/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('JogosCtrl', function ($scope, UserService) {
    var vm = this;
    vm.jogos = UserService.jogos;
    activate();

    function activate() {
    }

  });
