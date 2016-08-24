'use strict';
angular.module('main')
  .factory('UserService', function (Ref, $firebaseObject, $state, Enum, $firebaseArray, $q, $timeout, $http, $ionicModal, $resource, $ionicPlatform) {
    var service = {
      jogos: [],
      amigos: [],
      times: [],
      reservas: [],
      notificacoes: [],
      deviceToken: '',
      jogadorSelecionado: {},
      ref: Ref.child('users'),
      refConfig: Ref.child('usersConfig'),
      refNotificacoes: Ref.child('usersNotificacoes'),
      refLocalizacao: Ref.child('usersLocalizacao'),

      getUserProfile: getUserProfile,
      getCurrentUser: getCurrentUser,
      getMeusAmigos: getMeusAmigos,
      getJogadoresRegiao: getJogadoresRegiao,
      getListaJogadores: getListaJogadores,
      getNotificacoes: getNotificacoes,
      getConfiguracao: getConfiguracao,
      verificaAmizade: verificaAmizade,
      verificaAmizadeDeAmizades: verificaAmizadeDeAmizades,

      adicionarAmigo: adicionarAmigo,
      removerAmigo: removerAmigo,
      enviaNotificacao: enviaNotificacao,
      sendPushNotification: sendPushNotification,
      schedulePushNotification: schedulePushNotification,
      setLocalizacaoJogador: setLocalizacaoJogador,
      setConexao: setConexao,
    };

    return service;

    function getCurrentUser() {
      var deferred = $q.defer();
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          setConexao(user.uid);
          setDeviceToken(user.uid);
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

    function getConfiguracao() {
      return $firebaseObject(service.refConfig.child(firebase.auth().currentUser.uid));
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
          $http(req).then(function (val) {
            console.log(val);
          }, function (err) {
            console.log(err);
          });
        }
      });
    }

    function schedulePushNotification(data) {
      service.ref.child(data.id + '/token').once('value', function (snap) {
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
              'scheduled': data.date,
              'profile': 'dev',
              'notification': {
                'title': 'Rei da Quadra',
                'message': data.msg,
              }
            }
          };
          $http(req).then(function (val) {
            console.log(val);
          }, function (err) {
            console.log(err);
          });
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

    function setDeviceToken(id) {
      if (window.cordova) {
        $ionicPlatform.ready(function () {
          var push = new Ionic.Push({
            "debug": true
          });

          push.register(function (token) {
            service.deviceToken = token.token;
            service.ref.child(id + '/token').set(token.token);
            console.log('token:' + token);
            push.saveToken(token);
          });
        });
      }
    }

    function setLocalizacaoJogador(userId) {
      navigator.geolocation.getCurrentPosition(function (position) {
        console.log('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + position.coords.latitude + ',' + position.coords.longitude + '&result_type=administrative_area_level_2&key=AIzaSyCMgDkKuk3uMRhfIhcWTCgaCmOAqhDOoIY');
        var resource = $resource('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + position.coords.latitude + ',' + position.coords.longitude + '&result_type=administrative_area_level_2&key=AIzaSyCMgDkKuk3uMRhfIhcWTCgaCmOAqhDOoIY', {}, {
          query: { method: 'GET', isArray: false }
        });
        resource.query(function (data) {
          if (data.results.length > 0) {
            var locationData = {};
            locationData['users/' + userId + '/localizacao/'] = data.results[0].formatted_address;
            Ref.update(locationData, function (error) {
              if (error) {
                console.log('Erro ao definir local');
              }
              else {
                var geo = new GeoFire(service.refLocalizacao);
                geo.set(userId, [position.coords.latitude, position.coords.longitude]);
              }
            });
          }
          console.log(data);
        });
      });
    }

    function setConexao(id) {
      var myConnectionsRef = service.ref.child(id + '/connections');
      var lastOnlineRef = service.ref.child(id + '/lastOnline');

      var connectedRef = Ref.child('.info/connected');
      connectedRef.on('value', function (snap) {
        if (snap.val() === true) {
          // We're connected (or reconnected)! Do anything here that should happen only if online (or on reconnect)

          // add this device to my connections list
          // this value could contain info about the device or a timestamp too
          var con = myConnectionsRef.push(true);
          // when I disconnect, remove this device
          con.onDisconnect().remove();

          // when I disconnect, update the last time I was seen online
          lastOnlineRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
        }
      });
    }

  });