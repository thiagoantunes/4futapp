'use strict';
angular.module('main')
  .factory('UserService', function (Ref, $firebaseObject, $state, Enum, PushNotification, $firebaseArray, $q, $timeout, $http, $ionicModal, $resource) {
    var service = {
      jogos: [],
      amigos: [],
      times: [],
      reservas: [],
      notificacoes: [],
      jogadorSelecionado: {},
      ref: Ref.child('users'),
      refNotificacoes: Ref.child('usersNotificacoes'),

      getUserProfile: getUserProfile,
      getCurrentUser: getCurrentUser,
      getMeusAmigos: getMeusAmigos,
      getJogadoresRegiao: getJogadoresRegiao,
      getListaJogadores: getListaJogadores,
      getNotificacoes: getNotificacoes,
      verificaAmizade: verificaAmizade,
      verificaAmizadeDeAmizades: verificaAmizadeDeAmizades,

      adicionarAmigo: adicionarAmigo,
      removerAmigo: removerAmigo,
      enviaNotificacao: enviaNotificacao,
      salvarDeviceToken: salvarDeviceToken
    };

    return service;

    function getCurrentUser() {
      var deferred = $q.defer();
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          deferred.resolve(user);
        }
        else {
          deferred.reject();
        }
      });

      return deferred.promise;
    }

    function getNotificacoes() {
      service.notificacoesNaoLidas = $firebaseArray(service.refNotificacoes.child(firebase.auth().currentUser.uid).orderByChild('lida').startAt(false).endAt(false));
      service.notificacoes = $firebaseArray(service.refNotificacoes.child(firebase.auth().currentUser.uid).orderByChild('dateTime').limitToLast(20));
    }

    function getUserProfile(id) {
      return $firebaseObject(service.ref.child(id));
    }

    function adicionarAmigo(id) {
      var amigoData = {};
      amigoData['users/' + firebase.auth().currentUser.uid + '/seguindo/' + id] = id;
      amigoData['users/' + id + '/seguidores/' + firebase.auth().currentUser.uid] = firebase.auth().currentUser.uid;

      Ref.update(amigoData, function () {
        enviaNotificacao({
          msg: firebase.auth().currentUser.displayName + ' começou a te seguir',
          img: firebase.auth().currentUser.photoURL,
          userId: firebase.auth().currentUser.uid,
          tipo: Enum.TipoNotificacao.solicitacaoAmizade,
          lida: false,
          dateTime: new Date().getTime()
        }, id);
      });
    }

    function enviaNotificacao(data, userId) {
      var notificacaoId = service.refNotificacoes.push().key;
      var notificacaoData = {};
      notificacaoData['usersNotificacoes/' + userId + '/' + notificacaoId] = data;

      Ref.update(notificacaoData).then(function () {
        sendPushNotification(userId, data.msg);
      });
    }

    function sendPushNotification(id, msg) {
      service.ref.child(id + '/token').once('value', function (snap) {
        if (snap.val()) {
          var jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJjMjYyYjY0Mi01NzEzLTQ5MjctOGMxZC0zMzJlM2EwMzg0ZDQifQ.c1vHBOiHZe8w1Nvf1nUsgtLdrwniRkr8xpYUhjD2f2o';
          var req = {
            method: 'POST',
            url: 'https://api.ionic.io/push/notifications',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + jwt
            },
            data: {
              'tokens': [snap.val()],
              'profile': 'dev',
              'notification': {
                'title': 'Rei da Quadra',
                'message': msg,
              }
            }
          };
          $http(req);
        }
      });
    }

    function removerAmigo(id) {
      var amigoData = {};
      amigoData['users/' + firebase.auth().currentUser.uid + '/seguindo/' + id] = null;

      Ref.update(amigoData);
    }

    function getMeusAmigos() {
      service.ref.child(firebase.auth().currentUser.uid + '/seguindo').on('child_added', function (snap) {
        service.ref.child(snap.key).on('value', function (snapUser) {
          var data = snapUser.val();
          data.$id = snap.key;
          $timeout(function () {
            _.remove(service.amigos, { '$id': snap.key });
            service.amigos.push(data);
          });
        });
      });

      service.ref.child(firebase.auth().currentUser.uid + '/seguindo').on('child_removed', function (oldChild) {
        $timeout(function () {
          _.remove(service.amigos, { '$id': oldChild.key });
        });
      });
    }

    function getJogadoresRegiao() {
      return $firebaseArray(service.ref.orderByChild('usuarioComum').startAt(true).endAt(true));
    }

    function getListaJogadores(ids) {
      var listaJogadores = [];
      var deferred = $q.defer();
      var promises = [];
      _.forEach(ids, function (id) {
        var promise = service.ref.child(id).once('value');
        promises.push(promise);
      });
      $q.all(promises).then(function (requests) {
        _.forEach(requests, function (snapUser) {
          var data = snapUser.val();
          data.$id = snapUser.key;
          listaJogadores.push(data);
        });
        deferred.resolve(listaJogadores);
      });
      return deferred.promise;
    }

    function verificaAmizadeDeAmizades(user) {
      var deferred = $q.defer();
      service.ref.child(user + '/seguindo/').once('value').then(function (snapshot) {
        var amigos = Object.keys(snapshot.val()).map(function (key) {
          return snapshot.val()[key];
        });
        var promises = [];
        _.forEach(amigos, function (amigo) {
          var promise = service.ref.child(amigo + '/seguindo/' + firebase.auth().currentUser.uid).once('value');
          promises.push(promise);
        });
        $q.all(promises).then(function (requests) {
          var result = false;
          _.forEach(requests, function (snap) {
            if (snap.val()) {
              result = true;
            }
          });
          deferred.resolve(result);
        });
      });

      return deferred.promise;
    }

    function verificaAmizade(userId) {
      var deferred = $q.defer();
      service.ref.child(userId + '/seguindo/' + firebase.auth().currentUser.uid).once('value').then(function (snapshot) {
        deferred.resolve(snapshot.val());
      });
      return deferred.promise;
    }

    function salvarDeviceToken(token) {
      console.log(token);
      var update = {};
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          update['users/' + user.uid + '/token/'] = token;
          Ref.update(update);
        }
      });
    }

  })

  .factory('PushNotification', function ($resource) {

    var serviceBase = 'http://rdqapi.azurewebsites.net/api/';

    return $resource(serviceBase + 'notifications/', {}, {
      query: { method: 'POST' },
      sendNotification: {
        url: serviceBase + 'notifications/SendNotification',
        method: 'POST',
      }
    });
  })