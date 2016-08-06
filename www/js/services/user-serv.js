'use strict';
angular.module('main')
  .factory('UserService', function (Ref, $firebaseObject, $firebaseArray, $q, $timeout, $http, $ionicModal) {
    var service = {
      jogos: [],
      amigos: [],
      times: [],
      reservas: [],
      notificacoes: [],
      jogadorSelecionado: {},
      ref: Ref.child('users'),
      refTimes: Ref.child('times'),
      refNotificacoes: Ref.child('usersNotificacoes'),

      getUserProfile: getUserProfile,
      getCurrentUser: getCurrentUser,
      getMeusAmigos: getMeusAmigos,
      getAmigosUsuarioLight: getAmigosUsuarioLight,
      getUsers: getUsers,
      getTimes: getTimes,
      getNotificacoes: getNotificacoes,
      verificaAmizade: verificaAmizade,
      verificaAmizadeDeAmizades: verificaAmizadeDeAmizades,

      adicionarAmigo: adicionarAmigo,
      removerAmigo: removerAmigo,
      enviaNotificacao: enviaNotificacao,
      openPerfilJogador: openPerfilJogador
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
      amigoData['users/' + firebase.auth().currentUser.uid + '/amigos/' + id] = true;
      amigoData['users/' + id + '/amigos/' + firebase.auth().currentUser.uid] = false;

      Ref.update(amigoData, function () {
        enviaNotificacao({
          msg: '<b>' + firebase.auth().currentUser.displayName + '</b> começou a te seguir',
          img: firebase.auth().currentUser.photoURL,
          tipo: 'solicitacaoAmizade',
          lida: false,
          dateTime: new Date().getTime()
        }, id);
      });
    }

    function enviaNotificacao(data, userId) {
      var notificacaoId = service.refNotificacoes.push().key;
      var notificacaoData = {};
      notificacaoData['usersNotificacoes/' + userId + '/' + notificacaoId] = data;

      Ref.update(notificacaoData);
    }

    function removerAmigo(id) {
      var amigoData = {};
      amigoData['users/' + firebase.auth().currentUser.uid + '/amigos/' + id] = null;

      Ref.update(amigoData);
    }

    function getMeusAmigos() {
      service.ref.child(firebase.auth().currentUser.uid + '/amigos').on('child_added', function (snap) {
        service.ref.child(snap.key).on('value', function (snapUser) {
          var data = snapUser.val();
          data.id = snap.key;
          $timeout(function () {
            _.remove(service.amigos, { 'id': snap.key });
            service.amigos.push(data);
          });
        });
      });

      service.ref.child(firebase.auth().currentUser.uid + '/amigos').on('child_removed', function (oldChild) {
        $timeout(function () {
          _.remove(service.amigos, { 'id': oldChild.key });
        });
      });
    }

    function getAmigosUsuarioLight(amigos) {
      amigos.list = [];
      $timeout(function () {
        for (var i in amigos) {
          var key = i;
          if (amigos[i]) {
            service.ref.child(key + '/fotoPerfil').on('value', function (snapUser) {
              if (snapUser.val()) {
                amigos.list.push({
                  fotoPerfil: snapUser.val(),
                  id: key
                });
              }
            });
          }
        }
      });
    }

    function getTimes() {
      service.ref.child(firebase.auth().currentUser.uid + '/times').on('child_added', function (snap) {
        service.refTimes.child(snap.key).on('value', function (snapUser) {
          var data = snapUser.val();
          $timeout(function () {
            _.remove(service.times, { 'id': snap.key });
            service.times.push(data);
          });
        });
      });
    }

    function getUsers() {
      return $firebaseArray(service.ref.orderByChild('usuarioComum').startAt(true).endAt(true));
    }

    function openPerfilJogador(jogador) {
      service.jogadorSelecionado.data = jogador;
      $ionicModal.fromTemplateUrl('templates/modal/perfil-jogador.html', {
        animation: 'slide-in-up'
      }).then(function (modal) {
        service.jogadorSelecionado.modal = modal;
        modal.show();
      });
    }

    function verificaAmizadeDeAmizades(user) {
      var deferred = $q.defer();
      service.ref.child(user + '/amigos/').once('value').then(function (snapshot) {
        var amigos = Object.keys(snapshot.val()).map(function (key) {
          if(snapshot.val()[key]){
            return key;
          }
        });
        var promises = [];
        _.forEach(amigos, function (amigo) {
          var promise = service.ref.child(amigo + '/amigos/' + firebase.auth().currentUser.uid).once('value');
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
      service.ref.child(userId + '/amigos/' + firebase.auth().currentUser.uid).once('value').then(function (snapshot) {
        deferred.resolve(snapshot.val());
      });
      return deferred.promise;
    }

  });
