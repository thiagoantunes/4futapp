/*global firebase*/
'use strict';
angular.module('main')
  .controller('AmigosCtrl', function ($scope, UserService, $ionicModal) {
    var vm = this;
    vm.amigos = UserService.amigos;
    //TODO !!!!!!!!!!!!!
    vm.usuarios = UserService.getUsers();
    vm.addAmigo = addAmigo;
    vm.openModalCriarGrupo = openModalCriarGrupo;
    vm.openModalAddAmigo = openModalAddAmigo;

    activate();

    function activate() {
      UserService.getAmigos();
    }

    function addAmigo(usuario) {
      UserService.adicionarAmigo(usuario.$id);
    }

    function openModalCriarGrupo() {
      $ionicModal.fromTemplateUrl('templates/modal/criar-grupo.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        vm.modalCriarGrupo = modal;
        modal.show();
      });
    }

    function openModalAddAmigo() {
      $ionicModal.fromTemplateUrl('templates/modal/adicionar-amigos.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        vm.modalAddAmigos = modal;
        modal.show();
      });
    }

  });

