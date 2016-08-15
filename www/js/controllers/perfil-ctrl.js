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
    vm.openChat = openChat;

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

    function openChat(){
      $state.go('main.chatJogador-' + Object.keys($state.current.views)[0], { id: vm.jogador.$id });
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
        'addDestructiveButtonWithLabel': 'Deixar de seguir',
        'addCancelButtonWithLabel': 'Cancelar'
      };
      window.plugins.actionsheet.show(options, function (_btnIndex) {
        UserService.removerAmigo(jogador.$id);
      });
    }

  })


  .controller('ChatJogadorCtrl', function ($scope, ChatService, UserService, $rootScope, $state, $stateParams, $ionicActionSheet, $ionicHistory, $ionicPopup, $ionicScrollDelegate, $timeout, $interval) {
    var vm = this;
    vm.jogador = UserService.jogadorSelecionado;
    vm.currentUser = UserService.getUserProfile(firebase.auth().currentUser.uid);

    vm.enviarMensagem = enviarMensagem;
    vm.onMessageHold = onMessageHold;
    vm.goBack = goBack;

    activate();

    function activate() {
      getChat();
      vm.input = {
        message: localStorage['userMessage-' + vm.jogador.$id] || ''
      };
    }

    var messageCheckTimer;
    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar; // gets set in $ionicView.enter
    var scroller;
    var txtInput; // ^^^

    function getChat() {
      // the service is mock but you would probably pass the toUser's GUID here
      ChatService.getChat(vm.jogador.$id).then(function () {
        ChatService.chatSelecionado.$loaded().then(function (data) {
          $scope.doneLoading = true;
          vm.mensagens = data;

          $timeout(function () {
            viewScroll.scrollBottom();
          }, 0);
        });
      });
    }

    function enviarMensagem() {
      var message = {
        toId: vm.jogador.$id,
        text: vm.input.message
      };

      keepKeyboardOpen();

      vm.input.message = '';

      message.date = new Date().getTime();
      message.userId = vm.currentUser.$id;

      vm.mensagens.$add(message).then(function () {
        UserService.sendPushNotification(vm.jogador.$id, firebase.auth().currentUser.displayName + ': ' + message.text );
      });

      $timeout(function () {
        keepKeyboardOpen();
        viewScroll.scrollBottom(true);
      }, 0);
    }

    function keepKeyboardOpen() {
      console.log('keepKeyboardOpen');
      txtInput.one('blur', function () {
        console.log('textarea blur, focus back on it');
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

    $scope.$on('$ionicView.enter', function () {
      $timeout(function () {
        footerBar = document.body.querySelector('#chat-view .bar-footer');
        scroller = document.body.querySelector('#chat-view .scroll-content');
        txtInput = angular.element(footerBar.querySelector('textarea'));
      }, 0);

      messageCheckTimer = $interval(function () {
        // here you could check for new messages if your app doesn't use push notifications or user disabled them
      }, 20000);
    });

    $scope.$on('$ionicView.leave', function () {
      console.log('leaving UserMessages view, destroying interval');
      // Make sure that the interval is destroyed
      if (angular.isDefined(messageCheckTimer)) {
        $interval.cancel(messageCheckTimer);
        messageCheckTimer = undefined;
      }
    });

    // I emit this event from the monospaced.elastic directive, read line 480
    $scope.$on('taResize', function (e, ta) {
      console.log('taResize');
      if (!ta) return;

      var taHeight = ta[0].offsetHeight;
      console.log('taHeight: ' + taHeight);

      if (!footerBar) return;

      var newFooterHeight = taHeight + 10;
      newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;

      footerBar.style.height = newFooterHeight + 'px';
      scroller.style.bottom = newFooterHeight + 'px';
    });

  })

  // fitlers
  .filter('nl2br', ['$filter',
    function ($filter) {
      return function (data) {
        if (!data) return data;
        return data.replace(/\n\r?/g, '<br />');
      };
    }
  ])

  // directives
  .directive('autolinker', ['$timeout',
    function ($timeout) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          $timeout(function () {
            var eleHtml = element.html();

            if (eleHtml === '') {
              return false;
            }

            var text = Autolinker.link(eleHtml, {
              className: 'autolinker',
              newWindow: false
            });

            element.html(text);

            var autolinks = element[0].getElementsByClassName('autolinker');

            for (var i = 0; i < autolinks.length; i++) {
              angular.element(autolinks[i]).bind('click', function (e) {
                var href = e.target.href;
                console.log('autolinkClick, href: ' + href);

                if (href) {
                  //window.open(href, '_system');
                  window.open(href, '_blank');
                }

                e.preventDefault();
                return false;
              });
            }
          }, 0);
        }
      }
    }
  ])