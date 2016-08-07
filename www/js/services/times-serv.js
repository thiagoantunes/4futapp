'use strict';
angular.module('main')
  .factory('TimesService', function (Ref, UserService, $firebaseObject, $firebaseArray, $q, $timeout, $http, $ionicModal) {
    var service = {
      timesRegiao: [],
      timeSelecionado: {},
      ref: Ref.child('times'),
      refJogador: Ref.child('users'),
      refLocalizacao: Ref.child('timesLocalizacao'),
      geoFire: new GeoFire(Ref.child('timesLocalizacao')),
      geoQuery: {},

      getMeusTimes: getMeusTimes,
      criarTime: criarTime,
      getTimesRegiao: getTimesRegiao,
      openPerfilTime: openPerfilTime
    };

    return service;

    function getMeusTimes() {
      service.refJogador.child(firebase.auth().currentUser.uid + '/times').on('child_added', function (snap) {
        service.ref.child(snap.key).on('value', function (snapUser) {
          var data = snapUser.val();
          data.id = snap.key;
          data.jogadores = Object.keys(data.jogadores).map(function (key) {
            return data.jogadores[key];
          });
          $timeout(function () {
            _.remove(UserService.times, { 'id': snap.key });
            UserService.times.push(data);
          });
        });
      });
    }

    function getTimesRegiao() {
      service.geoQuery.on('key_entered', function (key, location, distance) {
        service.ref.child(key).once('value').then(function (snapshot) {
          var time = snapshot.val();
          time.distance = distance;
          time.id = key;
          time.jogadores = Object.keys(time.jogadores).map(function (key) {
            return time.jogadores[key];
          });
          $timeout(function () {
            _.remove(service.timesRegiao, { 'id': key });
            service.timesRegiao.push(time);
          });
        });
      });

      service.geoQuery.on("key_exited", function (key, location, distance) {
        _.remove(service.timesRegiao, { 'id': key });
      });
    }

    function criarTime(time, jogadores, location) {
      var deferred = $q.defer();

      var timeData = {};
      var timeId = service.ref.push().key;
      timeData['times/' + timeId] = time;
      timeData['times/' + timeId].jogadores = {};
      _.forEach(jogadores, function (val) {
        timeData['times/' + timeId].jogadores[val.id] = {
          fotoPerfil: val.fotoPerfil,
          id: val.id
        };
      });
      timeData['times/' + timeId].jogadores[firebase.auth().currentUser.uid] = {
        fotoPerfil: firebase.auth().currentUser.photoURL,
        id: firebase.auth().currentUser.uid
      };
      _.forEach(jogadores, function (val) {
        timeData['users/' + val.id + '/times/' + timeId] = true;
      });
      timeData['users/' + firebase.auth().currentUser.uid + '/times/' + timeId] = true;

      Ref.update(timeData, function (error) {
        if (error) {
          deferred.reject('Erro ao cadastrar novo time');
        }
        else {
          var geo = new GeoFire(service.refLocalizacao);
          geo.set(timeId, location);
          deferred.resolve();
        }
      });

      return deferred.promise;
    }

    function openPerfilTime(time) {
      service.timeSelecionado.data = time;
      $ionicModal.fromTemplateUrl('templates/modal/perfil-time.html', {
        animation: 'slide-in-up'
      }).then(function (modal) {
        service.timeSelecionado.modal = modal;
        modal.show();
      });
    }

  });
