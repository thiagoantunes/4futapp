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
        service.ref.child(key).on('value', function (snapshot) {
          getJogadoresJogo(key).$loaded().then(function (val) {
            var jogo = snapshot.val();
            jogo.distance = distance;
            jogo.id = key;
            jogo.latitude = location[0];
            jogo.longitude = location[1];
            jogo.jogadores = val;
            if (jogo.responsavel == firebase.auth().currentUser.uid) {
              jogo.visivel = true;
              jogo.icon = 'img/pin-jogos.png';
              $timeout(function () {
                _.remove(service.jogosRegiao, { 'id': key });
                service.jogosRegiao.push(jogo);
              });
            }
            else {
              verificaPermissao(jogo).then(function (visivel) {
                jogo.visivel = visivel;
                jogo.icon = visivel ? 'img/pin-jogos.png' : 'img/pin-jogos-readonly.png';
                $timeout(function () {
                  _.remove(service.jogosRegiao, { 'id': key });
                  service.jogosRegiao.push(jogo);
                });
              });
            }
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
            getJogadoresJogo(snap.key).$loaded().then(function (val) {
              var data = snapJogo.val();
              data.id = snap.key;
              data.l = snapLocalizacao.val().l;
              data.jogadores = val;
              $timeout(function () {
                _.remove(UserService.jogos, { 'id': snap.key });
                UserService.jogos.push(data);
              });
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

      Ref.update(conviteData, function () {
        UserService.enviaNotificacao({
          msg: '<b>' + firebase.auth().currentUser.displayName + '</b> te convidou para uma partida',
          img: firebase.auth().currentUser.photoURL,
          tipo: 'convitePartida',
          lida: false,
          dateTime: new Date().getTime()
        }, amigo.id);
      });
    }

    function desconvidarAmigo(amigo, jogoId) {
      var conviteData = {};
      conviteData['jogosJogadores/' + jogoId + '/' + amigo.id] = null;
      conviteData['usersJogos/' + amigo.id + '/' + jogoId] = null;

      Ref.update(conviteData);
    }

    function verificaPermissao(jogo) {
      var deferred = $q.defer();

      if (jogo.visibilidade == 4) {
        deferred.resolve(true);
      }
      else if (jogo.visibilidade == 3) {
        UserService.verificaAmizadeDeAmizades(jogo.responsavel).then(function (val) {
          deferred.resolve(val);
        });
      }
      else if (jogo.visibilidade == 2) {
        UserService.verificaAmizade(jogo.responsavel).then(function (val) {
          deferred.resolve(val);
        });
      }
      else if (jogo.visibilidade == 1) {
        var convidado = _.some(jogo.jogadores, { '$id': firebase.auth().currentUser.uid });
        deferred.resolve(convidado);
      }

      return deferred.promise;
    }

  });
