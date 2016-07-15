/*global firebase GeoFire*/
'use strict';
angular.module('main')
  .factory('JogosService', function (Ref, $timeout, $firebaseArray, $cordovaGeolocation, $q, UserService) {
    var service = {
      ref: Ref.child('jogos'),
      refLocalizacao: Ref.child('jogosLocalizacao'),
      refUserJogos: Ref.child('usersJogos').child(firebase.auth().currentUser.uid),

      getMeusJogos: getMeusJogos,
      getUserJogos: getUserJogos,
      getGeoQuery: getGeoQuery,
      getJogoNoSync: getJogoNoSync,
      criarJogo: criarJogo
    };

    return service;

    function getUserJogos(user) {
      var ref = Ref.child('usersJogos/' + user);
      return $firebaseArray(ref);
    }

    function getJogoNoSync(key) {
      return service.ref.child(key).once('value');
    }

    function getGeoQuery() {
      var geoFire = new GeoFire(Ref.child('jogosLocalizacao'));
      return $cordovaGeolocation.getCurrentPosition().then(function (position) {
        return geoFire.query({
          center: [position.coords.latitude, position.coords.longitude],
          radius: 20
        });
      });
    }

    function criarJogo(novoJogo, coords) {
      var deferred = $q.defer();

      var jogoId = service.ref.push().key;
      var jogoData = {};
      jogoData['usersJogos/' + firebase.auth().currentUser.uid + '/' + jogoId] = true;
      jogoData['jogos/' + jogoId] = novoJogo;

      Ref.update(jogoData, function (error) {
        if (error) {
          deferred.reject('Erro ao cadastrar nova turma');
        }
        else {
          var geo = new GeoFire(Ref.child('jogosLocalizacao'));
          geo.set(jogoId, coords);
          deferred.resolve();
        }
      });

      return deferred.promise;
    }

    function getMeusJogos() {
      service.refUserJogos.on('child_added', function (snap) {
        service.ref.child(snap.key).on('value', function (snapJogo) {
          service.refLocalizacao.child(snap.key).on('value', function (snapLocalizacao) {
            var data = snapJogo.val();
            data.id = snap.key;
            data.l = snapLocalizacao.val().l;
            $timeout(function () {
              UserService.jogos.push(data);
            });
          });
        });
      });
    }

  });
