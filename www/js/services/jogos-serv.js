/*global firebase GeoFire*/
'use strict';
angular.module('main')
  .factory('JogosService', function (Ref, $firebaseArray, $cordovaGeolocation, $q) {
    var service = {
      getUserJogos: getUserJogos,
      getGeoQuery: getGeoQuery,
      getJogoNoSync: getJogoNoSync,
      criarJogo: criarJogo
    };

    return service;

    function getRef() {
      return Ref.child('jogos');
    }

    function getUserJogos(user) {
      var ref = Ref.child('usersJogos/' + user);
      return $firebaseArray(ref);
    }

    function getJogoNoSync(key) {
      return getRef().child(key).once('value');
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

      var jogoId = getRef().push().key;
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

  });
