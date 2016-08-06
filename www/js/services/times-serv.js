'use strict';
angular.module('main')
  .factory('TimesService', function (Ref, $firebaseObject, $firebaseArray, $q, $timeout, $http, $ionicModal) {
    var service = {
      timesRegiao: [],
      timeSelecionado: {},
      ref: Ref.child('times'),
      refJogador: Ref.child('users'),
      refLocalizacao: Ref.child('timesLocalizacao'),
      geoFire: new GeoFire(Ref.child('timesLocalizacao')),
      geoQuery: {},

      criarTime: criarTime,
      getTimesRegiao: getTimesRegiao,
      openPerfilTime: openPerfilTime,
      getJogadoresTime: getJogadoresTime
    };

    return service;

    function getTimesRegiao() {
      service.geoQuery.on('key_entered', function (key, location, distance) {
        service.ref.child(key).once('value').then(function (snapshot) {
          var time = snapshot.val();
          time.distance = distance;
          time.id = key;
          $timeout(function () {
            service.timesRegiao.push(time);
          });
        });
      });
    }

    function criarTime(time, jogadores, location) {
      var deferred = $q.defer();

      var timeData = {};
      var timeId = service.ref.push().key;
      timeData['times/' + timeId] = time;
      timeData['times/' + timeId].jogadores = {};
      _.forEach(jogadores, function (val) {
        timeData['times/' + timeId].jogadores[val.id] = true;
      });
      timeData['times/' + timeId].jogadores[firebase.auth().currentUser.uid] = true;
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

    function getJogadoresTime(jogadores) {
      jogadores.list = [];
      $timeout(function () {
        for (var i in jogadores) {
          var key = i;
          if (jogadores[i]) {
            service.refJogador.child(key + '/fotoPerfil').on('value', function (snapUser) {
              if (snapUser.val()) {
                jogadores.list.push({
                  fotoPerfil: snapUser.val(),
                  id: key
                });
              }
            });
          }
        }
      });
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
