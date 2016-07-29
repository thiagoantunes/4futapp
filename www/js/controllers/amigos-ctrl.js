/*global firebase*/
'use strict';
angular.module('main')
  .controller('AmigosCtrl', function ($state, UserService, $timeout, $ionicActionSheet) {
    var vm = this;
    vm.userService = UserService;
    vm.amigos = UserService.amigos;
    vm.grupos = UserService.grupos;
    vm.openAddOptions = openAddOptions;

    activate();

    function activate() {
    }

    function openAddOptions() {
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text: 'Buscar Jogadores' },
          { text: 'Criar Grupo' }
        ],
        cancelText: 'Fechar',
        cancel: function () {
          // add cancel code..
        },
        buttonClicked: function (index) {
          if (index == 0) {
            $state.go('main.buscarJogadores');
            return true;
          }
          else if (index == 1) {
            $state.go('main.criarGrupo');
            return true;
          }
        }
      });

      $timeout(function () {
        hideSheet();
      }, 4000);
    }


  })

  .controller('CriarGrupoCtrl', function (UserService, $ionicHistory) {
    var vm = this;
    vm.amigos = UserService.amigos;
    vm.checkMembroGrupo = checkMembroGrupo;
    vm.toggleMembroGrupo = toggleMembroGrupo;
    vm.validForm = validForm;
    vm.criarGrupo = criarGrupo;

    activate();

    function activate() {
      vm.novoGrupo = {
        membros: []
      };
    }

    function toggleMembroGrupo(amigo) {
      if (_.some(vm.novoGrupo.membros, { 'id': amigo.id })) {
        var index = vm.novoGrupo.membros.indexOf(amigo);
        if (index > -1) {
          vm.novoGrupo.membros.splice(index, 1);
        }
      }
      else {
        vm.novoGrupo.membros.push(amigo);
      }
    }

    function checkMembroGrupo(amigo) {
      return _.some(vm.novoGrupo.membros, { 'id': amigo.id });
    }

    function validForm() {
      return !(vm.novoGrupo.nome && vm.novoGrupo.membros.length > 0);
    }

    function criarGrupo() {
      var novoGrupo = {
        nome: vm.novoGrupo.nome,
        moderador: firebase.auth().currentUser.uid,
      };
      UserService.criarGrupo(novoGrupo, vm.novoGrupo.membros).then(function () {
        $ionicHistory.goBack(-1);
      });
    }

  })

  .controller('BuscarJogadores', function (UserService, $ionicHistory) {
    var vm = this;
    //TODO !!!!!!!!!!!!!
    vm.usuarios = UserService.getUsers();
    vm.amigos = UserService.amigos;
    vm.checkAmizade = checkAmizade;

    activate();

    function activate() {
      vm.novoGrupo = {
        membros: []
      };
    }

    function checkAmizade(usuario) {
      return _.some(vm.amigos, function (val) {
        return val.id == firebase.auth().currentUser.uid
          || val.id == usuario.$id;
      });
    }

  });
