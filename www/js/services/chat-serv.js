'use strict';
angular.module('main')
  .factory('ChatService', function (Ref, $firebaseObject, $firebaseArray, $q, $timeout, UserService) {
    var service = {
      mensagensChatSelecionado: {},
      chatSelecionado: {},
      destinatario: {},
      ref: Ref.child('chats'),
      refUserChats: Ref.child('usersChats'),

      getChatJogador: getChatJogador,
      getChatPartida: getChatPartida,
      getListaChats: getListaChats,
      enviaMensagemJogador: enviaMensagemJogador,
      marcarComoLidas: marcarComoLidas,
      enviaMensagemPartida: enviaMensagemPartida
    };

    return service;

    function getListaChats() {
      return $firebaseArray(service.refUserChats.child(firebase.auth().currentUser.uid));
    }

    function getChatPartida(partidaId) {
      service.mensagensChatSelecionado = $firebaseArray(service.ref.child(partidaId));
    }

    function getChatJogador(userId) {
      var deferred = $q.defer();
      service.refUserChats.child(firebase.auth().currentUser.uid + '/' + userId).once('value', function (snap) {
        if (snap.val()) {
          service.mensagensChatSelecionado = $firebaseArray(service.ref.child(snap.val().chat));
          service.chatSelecionado = snap.val().chat;
          deferred.resolve();
        }
        else {
          var chatId = service.ref.push().key;
          service.mensagensChatSelecionado = $firebaseArray(service.ref.child(chatId));
          service.chatSelecionado = chatId;
          deferred.resolve();
        }
      });
      return deferred.promise;
    }

    function enviaMensagemJogador(user, mensagem) {
      var deferred = $q.defer();
      var chatData = {};
      var msgId = service.ref.child(service.chatSelecionado).push().key;;
      chatData['chats/' + service.chatSelecionado + '/' + msgId] = mensagem;
      chatData['usersChats/' + firebase.auth().currentUser.uid + '/' + user.$id + '/ultimaMsg'] = mensagem.text;
      chatData['usersChats/' + firebase.auth().currentUser.uid + '/' + user.$id + '/date'] = mensagem.date;
      chatData['usersChats/' + firebase.auth().currentUser.uid + '/' + user.$id + '/chat'] = service.chatSelecionado;
      chatData['usersChats/' + firebase.auth().currentUser.uid + '/' + user.$id + '/tipoChat'] = 'jogador';
      chatData['usersChats/' + firebase.auth().currentUser.uid + '/' + user.$id + '/destinatario'] = {
        id: user.$id,
        nome: user.nome,
        fotoPerfil: user.fotoPerfil
      };
      chatData['usersChats/' + user.$id + '/' + firebase.auth().currentUser.uid + '/ultimaMsg'] = mensagem.text;
      chatData['usersChats/' + user.$id + '/' + firebase.auth().currentUser.uid + '/date'] = mensagem.date;
      chatData['usersChats/' + user.$id + '/' + firebase.auth().currentUser.uid + '/chat'] = service.chatSelecionado;
      chatData['usersChats/' + user.$id + '/' + firebase.auth().currentUser.uid + '/tipoChat'] = 'jogador';
      chatData['usersChats/' + user.$id + '/' + firebase.auth().currentUser.uid + '/destinatario'] = {
        id: firebase.auth().currentUser.uid,
        nome: firebase.auth().currentUser.displayName,
        fotoPerfil: firebase.auth().currentUser.photoURL
      };

      Ref.update(chatData).then(function () {
        var naoLidasRef = service.refUserChats.child(user.$id + '/' + firebase.auth().currentUser.uid + '/naoLidas');
        naoLidasRef.transaction(function (current_value) {
          return (current_value || 0) + 1;
        });
        UserService.sendPushNotification(user.$id, firebase.auth().currentUser.displayName + ': ' + mensagem.text);
        deferred.resolve();
      }, function (err) {
        deferred.reject();
      });
      return deferred.promise;
    }


    function enviaMensagemPartida(partida, mensagem) {
      var deferred = $q.defer();
      var chatData = {};
      var msgId = service.ref.child(partida.$id).push().key;;
      chatData['chats/' + partida.$id + '/' + msgId] = mensagem;

      _.forEach(partida.jogadores, function (jogador) {
        chatData['usersChats/' + jogador.$id + '/' + partida.$id + '/ultimaMsg'] = mensagem.text;
        chatData['usersChats/' + jogador.$id + '/' + partida.$id + '/date'] = mensagem.date;
        chatData['usersChats/' + jogador.$id + '/' + partida.$id + '/chat'] = partida.$id;
        chatData['usersChats/' + jogador.$id + '/' + partida.$id + '/tipoChat'] = 'partida';
        chatData['usersChats/' + jogador.$id + '/' + partida.$id + '/destinatario'] = {
          id: partida.$id,
          nome: partida.nome,
        };
      });

      Ref.update(chatData).then(function () {

        _.forEach(partida.jogadores, function (jogador) {
          if (jogador.$id !== firebase.auth().currentUser.uid) {
            var naoLidasRef = service.refUserChats.child(jogador.$id + '/' + partida.$id + '/naoLidas');
            naoLidasRef.transaction(function (current_value) {
              return (current_value || 0) + 1;
            });
            UserService.sendPushNotification(jogador.$id, firebase.auth().currentUser.displayName + ': ' + mensagem.text);
          }
        });

        deferred.resolve();
      }, function (err) {
        deferred.reject();
      });
      return deferred.promise;
    }


    function marcarComoLidas(dest) {
      service.refUserChats.child(firebase.auth().currentUser.uid + '/' + dest + '/naoLidas').set(null);
    }

  });