/*global firebase*/
'use strict';
angular.module('main')
  .controller('PerfilCtrl', function (selectedUser, $state, $timeout, $stateParams, ionicMaterialMotion, ionicMaterialInk, UserService, $ionicPopup) {
    var vm = this;
    vm.user = selectedUser;
    vm.meusAmigos = UserService.amigos;
    vm.getObjLength = getObjLength;
    vm.openListaJogadores = openListaJogadores;

    activate();

    function activate() {
    }

    function getObjLength(obj) {
      if (obj) {
        return Object.keys(obj).length;
      }
      else {
        return 0;
      }
    }

    function openListaJogadores(tipoLista) {
      UserService.jogadorSelecionado = vm.user;
      $state.go('main.listaJogadores-' + Object.keys($state.current.views)[0], { tipoLista: tipoLista });
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
  })

  .controller('PerfilJogadorCtrl', function ($state, $timeout, ionicMaterialMotion, ionicMaterialInk, UserService, $ionicPopup, $ionicModal, $ionicHistory) {
    var vm = this;
    vm.jogador = UserService.jogadorSelecionado;
    vm.meusAmigos = UserService.amigos;
    vm.checkAmizade = checkAmizade;
    vm.addAmigo = addAmigo;
    vm.removerAmigo = removerAmigo;
    vm.goBack = goBack;
    vm.getObjLength = getObjLength;
    vm.openListaJogadores = openListaJogadores;

    activate();

    function activate() {
    }

    function checkAmizade() {
      return _.some(vm.meusAmigos, function (val) {
        return val.$id == vm.jogador.$id;
      });
    }

    function addAmigo() {
      UserService.adicionarAmigo(vm.jogador.$id);
    }

    function goBack() {
      $ionicHistory.goBack();
    }

    function removerAmigo() {
      UserService.removerAmigo(vm.jogador.$id);
      // var popup = $ionicPopup.confirm({
      //   template: 'Solicitação de amizade enviada!',
      //   buttons: [{
      //     text: 'OK',
      //     type: 'button-positive',
      //     onTap: function (e) {
      //       popup.close();
      //     }
      //   }]
      // });
    }

    function getObjLength(obj) {
      if (obj) {
        return Object.keys(obj).length;
      }
      else {
        return 0;
      }
    }

    function openListaJogadores(tipoLista) {
      $state.go('main.listaJogadores-' + Object.keys($state.current.views)[0], { tipoLista: tipoLista });
    }

    // Set Motion
    $timeout(function () {
      ionicMaterialMotion.slideUp({
        selector: '.slide-up'
      });
    }, 300);

    // Set Ink
    ionicMaterialInk.displayEffect();
  })

  .controller('ListaJogadoresCtrl', function ($state, UserService, $stateParams, $ionicHistory) {
    var vm = this;
    //TODO !!!!!!!!!!!!!
    vm.jogadores = [];
    vm.amigos = UserService.amigos;
    vm.checkAmizade = checkAmizade;
    vm.userService = UserService;
    vm.openPerfilJogador = openPerfilJogador;
    vm.seguirJogador = seguirJogador;
    vm.deixarDeSeguir = deixarDeSeguir;

    activate();
    
    function activate() {
      switch ($stateParams.tipoLista) {
        case 'seguidores':
          getSeguidores();
          break;
        case 'seguindo':
          getSeguindo();
          break;
        case 'regiao':
          getJogadoresRegiao();
      }
    }

    function getSeguidores() {
      vm.viewTitle = 'SEGUIDORES';
      var ids = Object.keys(UserService.jogadorSelecionado.seguidores).map(function (key) {
        return UserService.jogadorSelecionado.seguidores[key];
      });
      UserService.getListaJogadores(ids).then(function (list) {
        vm.jogadores = list;
      });
    }

    function getSeguindo() {
      vm.viewTitle = 'SEGUINDO';
      var ids = Object.keys(UserService.jogadorSelecionado.seguindo).map(function (key) {
        return UserService.jogadorSelecionado.seguindo[key];
      });
      UserService.getListaJogadores(ids).then(function (list) {
        vm.jogadores = list;
      });
    }

    function getJogadoresRegiao() {
      vm.viewTitle = 'BUSCAR JOGADORES';
      vm.jogadores = UserService.getJogadoresRegiao();
    }

    function openPerfilJogador(jogador) {
      UserService.jogadorSelecionado = jogador;
      $state.go('main.perfilJogador-' + Object.keys($state.current.views)[0], { $id: jogador.$id });
    }

    function checkAmizade(usuario) {
      if (usuario.$id == firebase.auth().currentUser.uid) {
        return true;
      }
      return _.some(vm.amigos, function (val) {
        return val.$id == usuario.$id;
      });
    }

    function seguirJogador(jogador) {
      UserService.adicionarAmigo(jogador.$id);
    }

    function deixarDeSeguir(jogador) {
      var options = {
        'title': 'Deixar de seguir ' + jogador.nome + '?',
        'addDestructiveButtonWithLabel' : 'Deixar de seguir',
        'addCancelButtonWithLabel': 'Cancelar'
      };
      window.plugins.actionsheet.show(options, function (_btnIndex) {
        UserService.removerAmigo(jogador.$id);
      });
    }

  });

