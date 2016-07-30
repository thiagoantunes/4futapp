/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('NotificacoesCtrl', function (UserService) {
    var vm = this;
    vm.notificacoes = UserService.notificacoes;

    activate();

    function activate() {

    }

  });