/*global GeoFire*/
'use strict';
angular.module('main')
  .factory('ArenasService', function (Ref, $timeout, $firebaseArray, $firebaseObject) {
    var service = {
      ref: Ref.child('arenas'),
      arenas: [],
      geoFire: new GeoFire(Ref.child('arenasLocalizacao')),
      geoQuery: {},

      getArenas: getArenas,
      getArena: getArena,
      getQuadrasArena: getQuadrasArena,
      getAlbum: getAlbum,
      getEstrutura: getEstrutura,
      arenaSelecionada: null
    };

    return service;

    function getArenas() {
      service.geoQuery.on('key_entered', function (key, location, distance) {
        service.ref.child(key).once('value').then(function (snapshot) {
          var arena = snapshot.val();
          arena.distance = distance;
          arena.id = key;
          arena.latitude = location[0];
          arena.longitude = location[1];
          arena.icon = '/img/estrutura/quadra.png';
          $timeout(function () {
            service.arenas.push(arena);
          });
        });
      });
    }

    function getArena(id) {
      return $firebaseObject(service.ref.child(id));
    }

    function getQuadrasArena(arena) {
      return $firebaseArray(Ref.child('arenasQuadras/' + arena));
    }

    function getAlbum(arena) {
      return $firebaseArray(Ref.child('arenasAlbuns/' + arena));
    }

    function getEstrutura(arena) {
      return $firebaseArray(Ref.child('arenasEstrutura/' + arena).orderByChild('ativo').startAt(true).endAt(true));
    }

  })

  .factory('GeoService', function ($q, $cordovaGeolocation, ArenasService) {
    var service = {
      position: [],

      getPosition: getPosition
    };

    return service;

    function getPosition() {
      var deferred = $q.defer();
      var posOptions = { timeout: 10000, enableHighAccuracy: false };
      var watchOptions = { timeout : 3000, enableHighAccuracy: false};
      $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
        service.position = [position.coords.latitude, position.coords.longitude];
        ArenasService.geoQuery = ArenasService.geoFire.query({
          center: service.position,
          radius: 20
        });
        deferred.resolve(service.position);
      });

      $cordovaGeolocation.watchPosition(watchOptions).then(function (position) {
        service.position = [position.coords.latitude, position.coords.longitude];
        ArenasService.geoQuery.updateCriteria({
          center: [position[0], position[1]],
          radius: 20
        });
      });

      return deferred.promise;
    }

  });


