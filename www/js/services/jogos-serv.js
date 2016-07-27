/*global firebase GeoFire*/
'use strict';
angular.module('main')
  .factory('JogosService', function (Ref, $timeout, $firebaseObject, $firebaseArray, $q, UserService) {
    var service = {
      jogoSelecionado: null,
      novaPartidaModal: {},
      jogosRegiao: [],
      ref: Ref.child('jogos'),
      refLocalizacao: Ref.child('jogosLocalizacao'),
      refUserJogos: Ref.child('usersJogos'),
      refJogadoresJogo: Ref.child('jogosJogadores'),
      geoFire: new GeoFire(Ref.child('jogosLocalizacao')),
      geoQuery: {},

      getJogosRegiao: getJogosRegiao,
      getJogadoresJogo: getJogadoresJogo,
      getMeusJogos: getMeusJogos,
      getUserJogos: getUserJogos,
      criarJogo: criarJogo,
      convidarAmigo: convidarAmigo,
      desconvidarAmigo: desconvidarAmigo
    };

    return service;

    function getJogosRegiao() {
      service.geoQuery.on('key_entered', function (key, location, distance) {
        service.ref.child(key).once('value').then(function (snapshot) {
          var jogo = snapshot.val();
          jogo.distance = distance;
          jogo.id = key;
          jogo.latitude = location[0];
          jogo.longitude = location[1];
          jogo.icon = '/img/estrutura/quadra.png';
          $timeout(function () {
            service.jogosRegiao.push(jogo);
          });
        });
      });
    }

    function getUserJogos(user) {
      var ref = Ref.child('usersJogos/' + user);
      return $firebaseArray(ref);
    }

    function getJogadoresJogo(jogoId) {
      return $firebaseArray(service.refJogadoresJogo.child(jogoId));
    }

    function criarJogo(novoJogo, coords) {
      var deferred = $q.defer();

      var jogoId = service.ref.push().key;
      var jogoData = {};
      jogoData['usersJogos/' + firebase.auth().currentUser.uid + '/' + jogoId] = true;
      jogoData['jogos/' + jogoId] = novoJogo;
      jogoData['jogosJogadores/' + jogoId + '/' + firebase.auth().currentUser.uid] = {
        nome: firebase.auth().currentUser.displayName,
        fotoPerfil: firebase.auth().currentUser.photoURL,
        confirmado: true
      };

      Ref.update(jogoData, function (error) {
        if (error) {
          deferred.reject('Erro ao cadastrar nova turma');
        }
        else {
          var geo = new GeoFire(Ref.child('jogosLocalizacao'));
          geo.set(jogoId, coords);
          novoJogo.id = jogoId;
          novoJogo.l = coords;
          deferred.resolve(novoJogo);
        }
      });

      return deferred.promise;
    }

    function getMeusJogos() {
      service.refUserJogos.child(firebase.auth().currentUser.uid).on('child_added', function (snap) {
        service.ref.child(snap.key).on('value', function (snapJogo) {
          service.refLocalizacao.child(snap.key).on('value', function (snapLocalizacao) {
            var data = snapJogo.val();
            data.id = snap.key;
            data.l = snapLocalizacao.val().l;
            $timeout(function () {
              _.remove(UserService.jogos, { 'id': snap.key });
              UserService.jogos.push(data);
            });
          });
        });
      });
    }

    function convidarAmigo(amigo, jogoId) {
      var conviteData = {};
      conviteData['jogosJogadores/' + jogoId + '/' + amigo.id] = {
        nome: amigo.nome,
        fotoPerfil: amigo.fotoPerfil
      };
      conviteData['usersJogos/' + amigo.id + '/' + jogoId] = true;

      Ref.update(conviteData);
    }

    function desconvidarAmigo(amigo, jogoId) {
      var conviteData = {};
      conviteData['jogosJogadores/' + jogoId + '/' + amigo.id] = null;
      conviteData['usersJogos/' + amigo.id + '/' + jogoId] = null;

      Ref.update(conviteData);
    }

  });
