/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('NotificacoesCtrl', function ($scope, UserService) {
    var vm = this;
    vm.notificacoes = UserService.notificacoes;

    $scope.$on('$ionicView.enter', function () {
      _.forEach(vm.notificacoes, function (val) {
        val.lida = true;
        vm.notificacoes.$save(val);
      });
    })

    activate();

    function activate() {
    }

  });