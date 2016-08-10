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
      openPerfilTime: openPerfilTime,
      criarDesafio: criarDesafio
    };

    return service;

    function getMeusTimes() {
      service.refJogador.child(firebase.auth().currentUser.uid + '/times').on('child_added', function (snap) {
        service.ref.child(snap.key).on('value', function (snapUser) {
          var data = snapUser.val();
          data.id = snap.key;
          data.modalidades = Object.keys(data.modalidades).map(function (key) {
            return key;
          });
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
        service.ref.child(key).on('value', function (snapshot) {
          var time = snapshot.val();
          time.distance = distance;
          time.id = key;
          time.modalidades = Object.keys(time.modalidades).map(function (key) {
            return key;
          });
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

    function criarDesafio(data) {
      var deferred = $q.defer();

      var desafioId = service.ref.push().key;
      var desafioData = {};
      desafioData['times/' + data.desafio.desafiante.id + '/desafios/' + desafioId] = true;
      desafioData['times/' + data.desafio.desafiado.id + '/desafios/' + desafioId] = false;
      desafioData['desafios/' + desafioId] = data.desafio;

      if (data.desafio.reserva && data.arenaId) {
        desafioData['reservas/' + data.arenaId + '/' + data.desafio.reserva + '/desafio'] = desafioId;
      }

      Ref.update(desafioData, function (error) {
        if (error) {
          deferred.reject('Erro ao cadastrar novo desafio');
        }
        else {
          UserService.enviaNotificacao({
            msg: 'Seu time <b>' + data.desafio.desafiado.nome + '</b> foi desafiado pelo time <b>' + data.desafio.desafiante.nome + '</b> ',
            img: data.desafio.desafiante.escudo,
            tipo: 'desafio',
            lida: false,
            dateTime: new Date().getTime()
          }, data.desafio.desafiado.capitao);
          var geo = new GeoFire(Ref.child('desafiosLocalizacao'));
          geo.set(desafioId, data.coords);
          deferred.resolve(desafioId);
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
