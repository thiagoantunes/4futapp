(function () {
  'use strict';
  angular.module('main')
    .controller('PerfilCtrl', PerfilCtrl)
    .controller('CriarPerfilCtrl', CriarPerfilCtrl)
    .controller('SeguindoSeguidoresCtrl', SeguindoSeguidoresCtrl)
    .controller('PerfilJogadorCtrl', PerfilJogadorCtrl)
    .controller('ListaJogadoresCtrl', ListaJogadoresCtrl)
    .controller('ChatCtrl', ChatCtrl)
    .controller('ChatsListCtrl', ChatsListCtrl)
    .controller('ConfigCtrl', ConfigCtrl);

  PerfilCtrl.$inhect = ['selectedUser', '$state', '$timeout', '$stateParams', 'ionicMaterialMotion', 'ionicMaterialInk', 'UserService', '$ionicPopup'];
  CriarPerfilCtrl.$inhect = ['$scope', 'UserService'];
  SeguindoSeguidoresCtrl.$inhect = ['$state', 'UserService', '$stateParams', '$ionicHistory'];
  PerfilJogadorCtrl.$inhect = ['$state', '$timeout', 'ionicMaterialMotion', 'ionicMaterialInk', 'UserService', 'ChatService', '$ionicPopup', '$ionicModal', '$ionicHistory'];
  ListaJogadoresCtrl.$inhect = ['$state', 'UserService', '$stateParams', '$ionicHistory'];
  ChatCtrl.$inhect = ['$scope', 'ChatService', 'JogosService', 'UserService', '$rootScope', '$state', '$stateParams', '$ionicActionSheet', '$ionicHistory', '$ionicScrollDelegate', '$timeout', '$interval', '$ionicLoading'];
  ChatsListCtrl.$inhect = ['$scope', '$state', 'ChatService', 'UserService', '$ionicLoading'];
  ConfigCtrl.$inhect = ['$scope', 'UserService'];

  function PerfilCtrl(selectedUser, $state, $timeout, $stateParams, ionicMaterialMotion, ionicMaterialInk, UserService, $ionicPopup) {
    var vm = this;
    vm.user = selectedUser;
    vm.meusAmigos = UserService.amigos;
    vm.getObjLength = getObjLength;
    vm.openSeguindoSeguidores = openSeguindoSeguidores;
    vm.isAndroid = isAndroid;
    vm.logOut = logOut;

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

    function openSeguindoSeguidores() {
      UserService.jogadorSelecionado = vm.user;
      $state.go('app.seguindoSeguidores');
    }

    function isAndroid() {
      return ionic.Platform.isAndroid();
    }

    function logOut() {
      firebase.auth().signOut().then(function () {
        $state.go('login');
      }, function (error) {
        console.log(error);
      });
    }
  }

  function CriarPerfilCtrl($scope, UserService) {
    var vm = this;
    vm.openDatePicker = openDatePicker;

    activate();

    function activate() {
      UserService.meuPerfil.$bindTo($scope, 'user');
      UserService.getConfiguracao().$bindTo($scope, 'config');
    }

    $scope.$watch('user.dataNascimento', function () {
      vm.dataNascimentoFormatada = moment($scope.user.dataNascimento).format('DD/MM/YYYY');
    });

    function openDatePicker() {
      var options = {
        date: new Date(),
        mode: 'date',
        locale: 'pt_br',
        doneButtonLabel: 'Ok',
        cancelButtonLabel: 'Cancelar',
        allowOldDates: true,
        androidTheme: 4,
        okText: 'Ok',
        cancelText: 'Cancelar',
      };
      datePicker.show(options, function (date) {
        $scope.$apply(function () {
          var activeElement = document.activeElement;
          if (activeElement) {
            activeElement.blur();
          }
          $scope.user.dataNascimento = moment(date)._d.getTime();
        });
      });
    }

  }

  function SeguindoSeguidoresCtrl($state, UserService, $stateParams, $ionicHistory) {
    var vm = this;
    vm.seguindo = UserService.seguindo;
    vm.seguidores = UserService.seguidores;
    vm.amigos = UserService.amigos;
    vm.checkAmizade = checkAmizade;
    vm.userService = UserService;
    vm.openPerfilJogador = openPerfilJogador;
    vm.seguirJogador = seguirJogador;
    vm.deixarDeSeguir = deixarDeSeguir;
    vm.openListaJogadores = openListaJogadores;

    activate();

    function activate() {
      vm.verSeguindo = true;
      UserService.getSeguindoSeguidores();
    }

    function openListaJogadores(tipoLista) {
      UserService.jogadorSelecionado = UserService.meuPerfil;
      $state.go('app.listaJogadores', { tipoLista: tipoLista });
    }

    function openPerfilJogador(jogador) {
      UserService.jogadorSelecionado = jogador;
      $state.go('app.detalhes-jogador', { $id: jogador.$id });
    }

    function seguirJogador(jogador) {
      UserService.adicionarAmigo(jogador.$id);
    }

    function deixarDeSeguir(jogador) {
      var options = {
        'title': 'Deixar de seguir ' + jogador.nome + '?',
        'androidEnableCancelButton': true,
        'addDestructiveButtonWithLabel': 'Deixar de seguir',
        'addCancelButtonWithLabel': 'Cancelar'
      };
      window.plugins.actionsheet.show(options, function (_btnIndex) {
        if (_btnIndex === 1) {
          UserService.removerAmigo(jogador.$id);
        }
      });
    }


    function checkAmizade(usuario) {
      if (usuario.$id == firebase.auth().currentUser.uid) {
        return true;
      }
      return _.some(vm.amigos, function (val) {
        return val.$id == usuario.$id;
      });
    }

  }

  function PerfilJogadorCtrl($state, $timeout, ionicMaterialMotion, ionicMaterialInk, UserService, ChatService, $ionicPopup, $ionicModal, $ionicHistory) {
    var vm = this;
    vm.jogador = UserService.jogadorSelecionado;
    vm.meusAmigos = UserService.amigos;
    vm.checkAmizade = checkAmizade;
    vm.addAmigo = addAmigo;
    vm.removerAmigo = removerAmigo;
    vm.goBack = goBack;
    vm.getObjLength = getObjLength;
    vm.openListaJogadores = openListaJogadores;
    vm.openChat = openChat;
    vm.calculateAge = calculateAge;

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
      $state.go('app.listaJogadores', { tipoLista: tipoLista });
    }

    function openChat() {
      ChatService.destinatario = vm.jogador;
      $state.go('app.chat', { id: vm.jogador.$id, tipoChat: 'jogador' });
    }

    function calculateAge(birthday) { // birthday is a date
      if (birthday) {
        return moment().diff(moment(birthday), 'years') + ' anos';
      }
    }

    // Set Motion
    $timeout(function () {
      ionicMaterialMotion.slideUp({
        selector: '.slide-up'
      });
    }, 300);

    // Set Ink
    ionicMaterialInk.displayEffect();
  }

  function ListaJogadoresCtrl($state, UserService, $stateParams, $ionicHistory) {
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
      if (UserService.jogadorSelecionado.seguidores) {
        var ids = Object.keys(UserService.jogadorSelecionado.seguidores).map(function (key) {
          return UserService.jogadorSelecionado.seguidores[key];
        });
        UserService.getListaJogadores(ids).then(function (list) {
          vm.jogadores = list;
        });
      }
    }

    function getSeguindo() {
      vm.viewTitle = 'SEGUINDO';
      if (UserService.jogadorSelecionado.seguindo) {
        var ids = Object.keys(UserService.jogadorSelecionado.seguindo).map(function (key) {
          return UserService.jogadorSelecionado.seguindo[key];
        });
        UserService.getListaJogadores(ids).then(function (list) {
          vm.jogadores = list;
        });
      }
    }

    function getJogadoresRegiao() {
      vm.viewTitle = 'BUSCAR JOGADORES';
      vm.jogadores = UserService.getJogadoresRegiao();
    }

    function openPerfilJogador(jogador) {
      UserService.jogadorSelecionado = jogador;
      $state.go('app.detalhes-jogador', { $id: jogador.$id });
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
        'addDestructiveButtonWithLabel': 'Deixar de seguir',
        'addCancelButtonWithLabel': 'Cancelar'
      };
      window.plugins.actionsheet.show(options, function (_btnIndex) {
        UserService.removerAmigo(jogador.$id);
      });
    }

  }

  function ChatCtrl($scope, ChatService, JogosService, UserService, $rootScope, $state, $stateParams, $ionicActionSheet, $ionicHistory, $ionicScrollDelegate, $timeout, $interval, $ionicLoading) {
    var vm = this;
    var messageCheckTimer;
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar;
    var scroller;
    var txtInput;
    vm.currentUser = UserService.getUserProfile(firebase.auth().currentUser.uid);
    vm.jogadores = [];
    vm.enviarMensagem = enviarMensagem;
    vm.onMessageHold = onMessageHold;
    vm.getUserData = getUserData;
    vm.goBack = goBack;

    activate();

    function activate() {
      switch ($stateParams.tipoChat) {
        case 'jogador':
          getChatJogador();
          break;
        case 'partida':
          getChatPartida();
          break;
      }

    }

    function getChatPartida() {
      vm.jogadores = JogosService.jogoSelecionado.jogadores;

      ChatService.getChatPartida(JogosService.jogoSelecionado.$id);
      $ionicLoading.show({ template: 'Carregando...' });
      ChatService.mensagensChatSelecionado.$loaded().then(function (data) {
        $ionicLoading.hide();
        vm.mensagens = data;
        vm.mensagens.$watch(function (event) {
          $timeout(function () {
            viewScroll.scrollBottom(true);
          }, 0);
        });

        $timeout(function () {
          viewScroll.scrollBottom();
        }, 0);
      }, function (err) {
        console.log(err);
        $ionicLoading.hide();
      });
    }

    function getChatJogador() {
      vm.jogadores.push(ChatService.destinatario);
      $ionicLoading.show({ template: 'Carregando...' });
      ChatService.getChatJogador(vm.jogadores[0].$id).then(function () {
        ChatService.mensagensChatSelecionado.$loaded().then(function (data) {
          $ionicLoading.hide();
          vm.mensagens = data;
          vm.mensagens.$watch(function (event) {
            $timeout(function () {
              viewScroll.scrollBottom(true);
            }, 0);
          });

          $timeout(function () {
            viewScroll.scrollBottom();
          }, 0);
        }, function (err) {
          console.log(err);
          $ionicLoading.hide();
        });
      }, function (err) {
        console.log(err);
        $ionicLoading.hide();
      });
    }

    function enviarMensagem() {
      var message = {
        text: vm.input.message,
        date: new Date().getTime(),
        userId: vm.currentUser.$id
      };

      keepKeyboardOpen();
      vm.input.message = '';

      switch ($stateParams.tipoChat) {
        case 'jogador':
          ChatService.enviaMensagemJogador(vm.jogadores[0], message);
          break;
        case 'partida':
          ChatService.enviaMensagemPartida(JogosService.jogoSelecionado, message);
          break;
      }

      $timeout(function () {
        keepKeyboardOpen();
        viewScroll.scrollBottom(true);
      }, 0);
    }

    function keepKeyboardOpen() {
      console.log('keepKeyboardOpen');
      txtInput.on('blur', function () {
        console.log('textarea blur, focus back on it');
        cordova.plugins.Keyboard.show();
        txtInput[0].focus();
      });
    }

    function onMessageHold(e, itemIndex, message) {
      console.log('onMessageHold');
      console.log('message: ' + JSON.stringify(message, null, 2));
      $ionicActionSheet.show({
        buttons: [{
          text: 'Copy Text'
        }, {
            text: 'Delete Message'
          }],
        buttonClicked: function (index) {
          switch (index) {
            case 0: // Copy Text
              //cordova.plugins.clipboard.copy(message.text);

              break;
            case 1: // Delete
              // no server side secrets here :~)
              vm.mensagens.$remove(message);
              $timeout(function () {
                viewScroll.resize();
              }, 0);

              break;
          }

          return true;
        }
      });
    }

    function goBack() {
      $ionicHistory.goBack();
    }

    function getUserData(id) {
      return _.find(vm.jogadores, { id: id });
    }

    $scope.$on('$ionicView.enter', function () {
      $timeout(function () {
        footerBar = document.body.querySelector('#chat-view .bar-footer');
        scroller = document.body.querySelector('#chat-view .scroll-content');
        txtInput = angular.element(footerBar.querySelector('textarea'));
      }, 0);

      messageCheckTimer = $interval(function () {
        switch ($stateParams.tipoChat) {
          case 'jogador':
            ChatService.marcarComoLidas(vm.jogadores[0].$id);
            break;
          case 'partida':
            ChatService.marcarComoLidas(JogosService.jogoSelecionado.$id);
            break;
        }
        // here you could check for new messages if your app doesn't use push notifications or user disabled them
      }, 2000);
    });

    $scope.$on('$ionicNavView.leave', function () {
      console.log('leaving UserMessages view, destroying interval');
      // Make sure that the interval is destroyed
      if (angular.isDefined(messageCheckTimer)) {
        $interval.cancel(messageCheckTimer);
        messageCheckTimer = undefined;
      }
    });



  }

  function ChatsListCtrl($scope, $state, ChatService, UserService, JogosService, $ionicLoading) {
    var vm = this;
    vm.chats = [];

    vm.openChat = openChat;

    activate();

    function activate() {
      $ionicLoading.show({ template: 'Carregando...' });
      ChatService.getListaChats().$loaded().then(function (val) {
        vm.chats = val;
        $ionicLoading.hide();
      }, function (err) {
        console.log(err);
        $ionicLoading.hide();
      });
    }

    function openChat(chat) {
      if (chat.tipoChat === 'jogador') {
        var jogador = chat.destinatario;
        jogador.$id = jogador.id;
        ChatService.destinatario = jogador;
        $state.go('app.chat', { id: jogador.id, tipoChat: 'jogador' });
      }
      else if (chat.tipoChat === 'partida') {
        JogosService.jogoSelecionado = _.find(UserService.jogos, { '$id': chat.chat });
        $state.go('app.chat', { id: chat.chat, tipoChat: 'partida' });
      }
    }

  }

  function ConfigCtrl($scope, UserService) {

    activate();

    function activate() {
      UserService.getConfiguracao().$bindTo($scope, 'config');
    }

  }

} ());