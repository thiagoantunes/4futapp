'use strict';
angular.module('main')
  .factory('ChatService', function (Ref, $firebaseObject, $firebaseArray, $q, $timeout) {
    var service = {
      chatSelecionado: {},
      ref: Ref.child('usersChats'),
      refUsers: Ref.child('users'),

      getChatJogador: getChatJogador,
      getChatPartida: getChatPartida
    };

    return service;

    function getChatPartida(partidaId) {
      service.chatSelecionado = $firebaseArray(service.ref.child(partidaId));
    }

    function getChatJogador(userId) {
      var deferred = $q.defer();
      service.refUsers.child(firebase.auth().currentUser.uid + '/chats/' + userId).once('value', function (snap) {
        if (snap.val()) {
          service.chatSelecionado = $firebaseArray(service.ref.child(snap.val()));
          deferred.resolve();
        }
        else {
          var chatId = service.ref.push().key;
          var chatData = {};
          chatData['users/' + firebase.auth().currentUser.uid + '/chats/' + userId] = chatId;
          chatData['users/' + userId + '/chats/' + firebase.auth().currentUser.uid] = chatId;
          Ref.update(chatData).then(function () {
            service.chatSelecionado = $firebaseArray(service.ref.child(chatId));
            deferred.resolve();
          });
        }
      });
      return deferred.promise;
    }

  });