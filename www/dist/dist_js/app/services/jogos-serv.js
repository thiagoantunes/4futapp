(function () {
  'use strict';
  angular.module('main')
    .factory('JogosService', JogosService);

  JogosService.$inject = ['Ref', '$timeout', '$firebaseObject', 'Enum', '$firebaseArray', '$q', 'UserService', '$location', '$ionicScrollDelegate'];

  function JogosService(Ref, $timeout, $firebaseObject, Enum, $firebaseArray, $q, UserService, $location, $ionicScrollDelegate) {
    var service = {
      jogoSelecionado: null,
      novaPartida: {},
      jogosRegiao: [],
      jogosRegiaoMarkers: [],
      jogosRegiaoMap: {},
      ref: Ref.child('jogos'),
      refLocalizacao: Ref.child('jogosLocalizacao'),
      refUserJogos: Ref.child('usersJogos'),
      refJogadoresJogo: Ref.child('jogosJogadores'),
      geoFire: new GeoFire(Ref.child('jogosLocalizacao')),
      geoQuery: {},

      getJogo: getJogo,
      getAndamentoJogo: getAndamentoJogo,
      getJogosRegiao: getJogosRegiao,
      getJogadoresJogo: getJogadoresJogo,
      getMeusJogos: getMeusJogos,
      getUserJogos: getUserJogos,
      getLocalizacaoJogo: getLocalizacaoJogo,
      criarJogo: criarJogo,
      editarJogo: editarJogo,
      cancelarJogo: cancelarJogo,
      convidarAmigo: convidarAmigo,
      desconvidarAmigo: desconvidarAmigo,
      solicitarPresenca: solicitarPresenca,
      aprovarSolicitacaoPresenca: aprovarSolicitacaoPresenca
    };

    return service;

    function getJogo(jogoId) {
      var deferred = $q.defer();
      service.ref.child(jogoId).on('value', function (snapJogo) {
        getJogadoresJogo(jogoId).$loaded().then(function (val) {
          var data = snapJogo.val();
          data.$id = jogoId;
          data.jogadores = val;
          deferred.resolve(data);
        });
      });
      return deferred.promise;
    }

    function getAndamentoJogo(jogoId) {
      return $firebaseObject(service.ref.child(jogoId + '/andamento'));
    }

    function getJogosRegiao() {
      service.geoQuery.on('key_entered', function (key, location, distance) {
        service.ref.child(key).on('value', function (snapshot) {
          if (snapshot.val() && snapshot.val().inicio > moment(new Date()).subtract(1, 'H')._d.getTime()) {
            getJogadoresJogo(key).$loaded().then(function (val) {
              var jogo = snapshot.val();
              jogo.distance = distance;
              jogo.$id = key;
              jogo.latitude = location[0];
              jogo.longitude = location[1];
              jogo.jogadores = val;
              if (jogo.responsavel == firebase.auth().currentUser.uid) {
                jogo.visivel = true;
                jogo.icon = 'www/img/pin-jogos.png';
                $timeout(function () {
                  _.remove(service.jogosRegiao, { '$id': key });
                  service.jogosRegiao.push(jogo);
                  addJogoMarker(jogo);
                });
              }
              else {
                verificaPermissao(jogo).then(function (visivel) {
                  jogo.visivel = visivel;
                  jogo.icon = visivel ? 'www/img/pin-jogos.png' : 'www/img/pin-jogos-readonly.png';
                  $timeout(function () {
                    _.remove(service.jogosRegiao, { '$id': key });
                    service.jogosRegiao.push(jogo);
                    addJogoMarker(jogo);
                  });
                });
              }
            });
          }
          else {
            service.geoFire.remove(key);
          }
        });
      });


      service.geoQuery.on("key_exited", function (key, location, distance) {
        _.remove(service.jogosRegiao, { '$id': key });
        var jogoMarker =  _.find(service.jogosRegiaoMarkers, {$id: key});
        if(jogoMarker) {
            jogoMarker.remove();
        }
      });
    }

    function addJogoMarker(jogo) {
      var jogoMarker =  _.find(service.jogosRegiaoMarkers, {$id: jogo.$id});
      if(jogoMarker) {
          jogoMarker.remove();
      }
      var data = {
        'position': new plugin.google.maps.LatLng(jogo.latitude, jogo.longitude),
        'title': jogo.nome,
        'icon': { 'url': jogo.icon, }
      };
      service.arenasMap.addMarker(data, function (marker) {
        if (jogo.visivel) {
          marker.addEventListener(plugin.google.maps.event.MARKER_CLICK, onMarkerClicked);
        }
        marker.nome = jogo.nome;
        marker.visivel = jogo.visivel;
        marker.$id = jogo.$id;
        service.jogosRegiaoMarkers.push(marker);
      });
    }

    function onMarkerClicked(marker) {
      $location.hash('anchor' + marker.$id);
      $ionicScrollDelegate.anchorScroll(true);
    }

    function getUserJogos(user) {
      var ref = Ref.child('usersJogos/' + user);
      return $firebaseArray(ref);
    }

    function getJogadoresJogo(jogoId) {
      return $firebaseArray(service.refJogadoresJogo.child(jogoId));
    }

    function getLocalizacaoJogo(jogoId) {
      return service.refLocalizacao.child(jogoId).once('value');
    }

    function criarJogo(data) {
      var deferred = $q.defer();

      data.partida.andamento = {
        timeForTimer: 300,
        started: false,
        paused: false,
        done: false
      };

      var jogoId = service.ref.push().key;
      var jogoData = {};
      jogoData['usersJogos/' + firebase.auth().currentUser.uid + '/' + jogoId] = true;
      jogoData['jogos/' + jogoId] = data.partida;
      jogoData['jogosJogadores/' + jogoId + '/' + firebase.auth().currentUser.uid] = {
        fotoPerfil: firebase.auth().currentUser.photoURL,
        id: firebase.auth().currentUser.uid,
        confirmado: true
      };
      _.forEach(data.jogadores, function (jogador) {
        jogoData['jogosJogadores/' + jogoId + '/' + jogador.$id] = {
          fotoPerfil: jogador.fotoPerfil,
          id: jogador.$id
        };
        jogoData['usersJogos/' + jogador.$id + '/' + jogoId] = true;
      });
      _.forEach(data.times, function (time) {
        _.forEach(time.jogadores, function (jogador) {
          if (jogador.id !== firebase.auth().currentUser.uid) {
            jogoData['jogosJogadores/' + jogoId + '/' + jogador.id] = {
              fotoPerfil: jogador.fotoPerfil,
              id: jogador.id
            };
            jogoData['usersJogos/' + jogador.$id + '/' + jogoId] = true;
          }
        });
      });
      if (data.partida.reserva && data.arenaId) {
        jogoData['reservas/' + data.arenaId + '/' + data.partida.reserva + '/partida'] = jogoId;
      }

      Ref.update(jogoData, function (error) {
        if (error) {
          deferred.reject('Erro ao cadastrar nova turma');
        }
        else {
          var scheduleNotificationData = {
            id: firebase.auth().currentUser.uid,
            msg: 'Comece a aquecer! ' + data.partida.nome + ' vai começar!',
            date: moment(data.partida.inicio).subtract(30, 'minutes').toISOString()
          };
          UserService.schedulePushNotification(scheduleNotificationData);

          _.forEach(data.jogadores, function (jogador) {
            UserService.enviaNotificacao({
              msg: firebase.auth().currentUser.displayName + ' te convidou para uma partida',
              img: firebase.auth().currentUser.photoURL,
              tipo: Enum.TipoNotificacao.convitePartida,
              lida: false,
              dateTime: new Date().getTime()
            }, jogador.$id);
            var scheduleNotificationData = {
              id: jogador.$id,
              msg: 'Comece a aquecer! ' + data.partida.nome + ' vai começar!',
              date: moment(data.partida.inicio).subtract(30, 'minutes').toISOString()
            };
            UserService.schedulePushNotification(scheduleNotificationData);
          });
          _.forEach(data.times, function (time) {
            _.forEach(time.jogadores, function (jogador) {
              if (jogador.id !== firebase.auth().currentUser.uid) {
                var scheduleNotificationData = {
                  id: jogador.$id,
                  msg: 'Comece a aquecer! ' + data.partida.nome + ' vai começar!',
                  date: moment(data.partida.inicio).subtract(30, 'minutes').toISOString()
                };
                UserService.schedulePushNotification(scheduleNotificationData);
                UserService.enviaNotificacao({
                  msg: firebase.auth().currentUser.displayName + ' te convidou para uma partida',
                  img: firebase.auth().currentUser.photoURL,
                  tipo: Enum.TipoNotificacao.convitePartida,
                  lida: false,
                  dateTime: new Date().getTime()
                }, jogador.id);
              }
            });
          });
          var geo = new GeoFire(Ref.child('jogosLocalizacao'));
          geo.set(jogoId, data.coords);
          deferred.resolve(jogoId);
        }
      });

      return deferred.promise;
    }

    function cancelarJogo(jogo) {
      var deferred = $q.defer();
      var jogoData = {};
      var jogoId = jogo.$id;
      jogoData['jogos/' + jogoId] = null;
      jogoData['jogosJogadores/' + jogoId] = null;
      jogoData['jogosLocalizacao/' + jogoId] = null;
      _.forEach(jogo.jogadores, function (jogador) {
        jogoData['usersJogos/' + jogador.$id + '/' + jogoId] = null;
      });
      Ref.update(jogoData, function (error) {
        if (error) {
          deferred.reject('Erro ao cancelar a partida');
        }
        else {
          _.forEach(jogo.jogadores, function (jogador) {
            UserService.enviaNotificacao({
              msg: firebase.auth().currentUser.displayName + ' cancelou uma partida ' + jogo.nome,
              img: firebase.auth().currentUser.photoURL,
              tipo: Enum.TipoNotificacao.cancelamentoPartida,
              lida: false,
              dateTime: new Date().getTime()
            }, jogador.$id);
          });
          deferred.resolve(jogoId);
        }
      });
      return deferred.promise;
    }

    function editarJogo(data) {
      var deferred = $q.defer();
      var jogoData = {};
      jogoData['jogos/' + data.idPartida] = data.partida;

      if (data.partida.reserva && data.arenaId) {
        jogoData['reservas/' + data.arenaId + '/' + data.partida.reserva + '/partida'] = data.idPartida;
      }

      Ref.update(jogoData, function (error) {
        if (error) {
          deferred.reject('Erro ao cadastrar nova turma');
        }
        else {
          //enviar notificaçao jogadores'
          var geo = new GeoFire(Ref.child('jogosLocalizacao'));
          geo.set(data.idPartida, data.coords);
          deferred.resolve(data.idPartida);
        }
      });

      return deferred.promise;
    }

    function solicitarPresenca(jogo) {
      var deferred = $q.defer();
      var conviteData = {};
      var solicitacao = {
        nome: firebase.auth().currentUser.displayName,
        fotoPerfil: firebase.auth().currentUser.photoURL,
        confirmado: true
      };
      if (jogo.aprovacaoManual) {
        solicitacao.aguardandoConfirmacao = true;
      }
      conviteData['jogosJogadores/' + jogo.$id + '/' + firebase.auth().currentUser.uid] = solicitacao;
      conviteData['usersJogos/' + firebase.auth().currentUser.uid + '/' + jogo.$id] = true;

      Ref.update(conviteData, function () {
        deferred.resolve(solicitacao);
        if (jogo.aprovacaoManual) {
          UserService.enviaNotificacao({
            msg: firebase.auth().currentUser.displayName + ' solicitou presença na partida ' + jogo.nome,
            img: firebase.auth().currentUser.photoURL,
            userId: firebase.auth().currentUser.uid,
            jogoId: jogo.$id,
            tipo: Enum.TipoNotificacao.solicitacaoPresenca,
            lida: false,
            dateTime: new Date().getTime()
          }, jogo.responsavel);
        }
      });
      return deferred.promise;
    }

    function getMeusJogos() {
      service.refUserJogos.child(firebase.auth().currentUser.uid).on('child_added', function (snap) {
        service.ref.child(snap.key).on('value', function (snapJogo) {
          getJogadoresJogo(snap.key).$loaded().then(function (val) {
            if (snapJogo.val()) {
              var data = snapJogo.val();
              data.$id = snap.key;
              data.jogadores = val;
              $timeout(function () {
                _.remove(UserService.jogos, { '$id': snap.key });
                UserService.jogos.push(data);
              });
            }
          });
        });
      });

      service.refUserJogos.child(firebase.auth().currentUser.uid).on('child_removed', function (oldChild) {
        $timeout(function () {
          _.remove(UserService.jogos, { '$id': oldChild.key });
        });
      });
    }

    function aprovarSolicitacaoPresenca(userId, jogoId) {
      var data = {};
      data['jogosJogadores/' + jogoId + '/' + userId + '/aguardandoConfirmacao'] = null;

      Ref.update(data, function () {
        UserService.enviaNotificacao({
          msg: firebase.auth().currentUser.displayName + ' aprovou sua participação em uma partida',
          userId: firebase.auth().currentUser.uid,
          jogoId: jogoId,
          img: firebase.auth().currentUser.photoURL,
          tipo: Enum.TipoNotificacao.aprovacaoSolicitacaoPresenca,
          lida: false,
          dateTime: new Date().getTime()
        }, userId);
      });
    }

    function convidarAmigo(amigo, jogoId) {
      var conviteData = {};
      conviteData['jogosJogadores/' + jogoId + '/' + amigo.$id] = {
        nome: amigo.nome,
        fotoPerfil: amigo.fotoPerfil
      };
      conviteData['usersJogos/' + amigo.$id + '/' + jogoId] = true;

      Ref.update(conviteData, function () {
        UserService.enviaNotificacao({
          msg: firebase.auth().currentUser.displayName + ' te convidou para uma partida',
          userId: firebase.auth().currentUser.uid,
          jogoId: jogoId,
          img: firebase.auth().currentUser.photoURL,
          tipo: Enum.TipoNotificacao.convitePartida,
          lida: false,
          dateTime: new Date().getTime()
        }, amigo.$id);
      });
    }

    function desconvidarAmigo(amigo, jogoId) {
      var conviteData = {};
      conviteData['jogosJogadores/' + jogoId + '/' + amigo.$id] = null;
      conviteData['usersJogos/' + amigo.$id + '/' + jogoId] = null;

      Ref.update(conviteData);
    }

    function verificaPermissao(jogo) {
      var deferred = $q.defer();

      if (jogo.visibilidade == Enum.VisualizacaoJogo.publico) {
        deferred.resolve(true);
      }
      else if (jogo.visibilidade == Enum.VisualizacaoJogo.amigosDeAmigos) {
        UserService.verificaAmizadeDeAmizades(jogo.responsavel).then(function (val) {
          deferred.resolve(val);
        });
      }
      else if (jogo.visibilidade == Enum.VisualizacaoJogo.amigos) {
        UserService.verificaAmizade(jogo.responsavel).then(function (val) {
          deferred.resolve(val);
        });
      }
      else if (jogo.visibilidade == Enum.VisualizacaoJogo.convidados) {
        var convidado = _.some(jogo.jogadores, { '$id': firebase.auth().currentUser.uid });
        deferred.resolve(convidado);
      }

      return deferred.promise;
    }

  }
  
} ());