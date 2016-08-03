'use strict';
angular.module('main')
  .factory('UserService', function (Ref, $firebaseObject, $firebaseArray, $q, $timeout, $http) {
    var service = {
      jogos: [],
      amigos: [],
      grupos: [],
      reservas: [],
      notificacoes: [],
      usuarioSelecionado: null,
      ref: Ref.child('users'),
      refAmigos: Ref.child('usersAmigos'),
      refGrupos: Ref.child('grupos'),
      refNotificacoes: Ref.child('usersNotificacoes'),

      getUserProfile: getUserProfile,
      getCurrentUser: getCurrentUser,
      getMeusAmigos: getMeusAmigos,
      getAmigosUsuario: getAmigosUsuario,
      getUsers: getUsers,
      getGrupos: getGrupos,
      criarGrupo: criarGrupo,
      getNotificacoes: getNotificacoes,

      adicionarAmigo: adicionarAmigo,
      removerAmigo: removerAmigo,
      enviaNotificacao: enviaNotificacao
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

      Ref.update(amigoData, function(){
        enviaNotificacao({
          msg: '<b>' + firebase.auth().currentUser.displayName + '</b> começou a te seguir',
          img: firebase.auth().currentUser.photoURL,
          tipo: 'solicitacaoAmizade',
          lida: false,
          dateTime: new Date().getTime()
        }, id);
      });
    }

    function enviaNotificacao(data, userId){
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

    function getAmigosUsuario(amigos) {
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

    function getGrupos() {
      service.ref.child(firebase.auth().currentUser.uid + '/grupos').on('child_added', function (snap) {
        service.refGrupos.child(snap.key).on('value', function (snapUser) {
          var data = snapUser.val();
          $timeout(function () {
            _.remove(service.grupos, { 'id': snap.key });
            service.grupos.push(data);
          });
        });
      });
    }

    function getUsers() {
      return $firebaseArray(service.ref.orderByChild('usuarioComum').startAt(true).endAt(true));
    }

    function criarGrupo(grupo, membros) {
      var deferred = $q.defer();

      var grupoData = {};
      var grupoId = service.refGrupos.push().key;
      grupoData['grupos/' + grupoId] = grupo;
      grupoData['grupos/' + grupoId].membros = {};
      _.forEach(membros, function (val) {
        grupoData['grupos/' + grupoId].membros[val.id] = true;
      });
      grupoData['grupos/' + grupoId].membros[firebase.auth().currentUser.uid] = true;
      _.forEach(membros, function (val) {
        grupoData['users/' + val.id + '/grupos/' + grupoId] = true;
      });
      grupoData['users/' + firebase.auth().currentUser.uid + '/grupos/' + grupoId] = true;

      Ref.update(grupoData, function (error) {
        if (error) {
          deferred.reject('Erro ao cadastrar novo grupo');
        }
        else {
          deferred.resolve();
        }
      });

      return deferred.promise;
    }

  });


