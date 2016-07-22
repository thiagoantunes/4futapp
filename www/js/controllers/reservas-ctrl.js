/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('ReservasCtrl', function ($scope, UserService) {
    var vm = this;
    vm.minhasReservas = UserService.reservas;
    //vm.minhasReservas = [];
    vm.mostrarHistorico = false;

    vm.filtroReservas = filtroReservas;

    activate();

    function activate() {
    }

    function filtroReservas() {
      return function (item) {
        var diff =  moment().diff(item['start'], 'days');
        if(vm.mostrarHistorico){
          return diff > 0;
        }
        else{
          return diff <= 0;
        }
      }
    }

  });
