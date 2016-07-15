/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('ReservasCtrl', function ($scope, UserService) {
    var vm = this;
    vm.minhasReservas = UserService.reservas;

    activate();

    function activate() {
    }

  });
