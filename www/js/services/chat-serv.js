'use strict';
angular.module('main')
  .factory('ChatService', function (Ref, $firebaseObject, $firebaseArray, $q, $timeout) {
    var service = {
      chatSelecionado: {},
      ref: Ref.child('usersChats'),
      refUsers: Ref.child('users'),

      getChat: getChat
    };

    return service;

    // function enviarMensagem(msg, chatId) {
    //   var chatId = service.ref.push().key;
    //   var chatData = {};
    //   chatData['usersChats/' + chatId] = { "_id": "54764399ab43d1d4113abfd1", "text": "Am I dreaming?", "userId": "534b8e5aaa5e7afc1b23e69b", "date": "2014-11-26T21:18:17.591Z", "read": true, "readDate": "2014-12-01T06:27:38.337Z" };

    //   Ref.update(chatData);
    // }

    function getChat(userId) {
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