/*global firebase*/
'use strict';
angular.module('main')
  .controller('PerfilCtrl', function (selectedUser, $state, $timeout, $stateParams, ionicMaterialMotion, ionicMaterialInk, UserService, $ionicPopup) {
    var vm = this;
    vm.user = selectedUser;
    vm.meuPerfil = selectedUser.$id == firebase.auth().currentUser.uid;
    vm.meusAmigos = UserService.amigos;
    vm.checkAmizade = checkAmizade;
    vm.addAmigo = addAmigo;
    vm.removerAmigo = removerAmigo;

    activate();

    function activate() {
      if ($stateParams.userId && vm.user.amigos) {
        UserService.getAmigosUsuario(vm.user.amigos);
      }
    }

    function checkAmizade(usuario) {
      return _.some(vm.meusAmigos, function (val) {
        return val.id == vm.user.$id;
      });
    }

    function addAmigo() {
      UserService.adicionarAmigo(vm.user.$id);
      var popup = $ionicPopup.confirm({
        template: 'Solicitação de amizade enviada!',
        buttons: [{
          text: 'OK',
          type: 'button-positive',
          onTap: function (e) {
            popup.close();
          }
        }]
      });
    }

    function removerAmigo() {
      UserService.removerAmigo(vm.user.$id);
      vm.user.amigos[vm.user.$id] = null;
    }

    vm.logOut = function () {
      firebase.auth().signOut().then(function () {
        $state.go('login');
      }, function (error) {
        console.log(error);
      });
    };

    // Set Motion
    $timeout(function () {
      ionicMaterialMotion.slideUp({
        selector: '.slide-up'
      });
    }, 300);

    // Set Ink
    ionicMaterialInk.displayEffect();
  });

