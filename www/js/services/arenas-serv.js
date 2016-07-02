/*global GeoFire*/
'use strict';
angular.module('main')
  .factory('ArenasService', function (Ref, $firebaseArray, $firebaseObject, $cordovaGeolocation) {
    var service = {
      getRef: getRef,
      getGeoQuery: getGeoQuery,
      getArenas: getArenas,
      getArena: getArena,
      getArenaNoSync: getArenaNoSync,
      getQuadrasArena: getQuadrasArena,
      getAlbum: getAlbum,
      arenaSelecionada: null
      //createGeo: createGeo
    };

    return service;

    function getRef() {
      return Ref.child('arenas');
    }

    function getGeoQuery() {
      var geoFire = new GeoFire(Ref.child('arenasLocalizacao'));
      return $cordovaGeolocation.getCurrentPosition().then(function (position) {
        return geoFire.query({
          center: [position.coords.latitude, position.coords.longitude],
          radius: 20
        });
      });
    }

    function getArena(id) {
      return $firebaseObject(getRef().child(id));
    }

    function getArenaNoSync(key) {
      return getRef().child(key).once('value');
    }

    function getArenas() {
      return $firebaseArray(getRef());
    }

    function getQuadrasArena(arena) {
      return $firebaseArray(Ref.child('arenasQuadras/' + arena));
    }

    function getAlbum(arena) {
      return $firebaseArray(Ref.child('arenasAlbuns/' + arena));
    }

  });
