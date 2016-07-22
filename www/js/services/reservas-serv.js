/*global _ moment firebase GeoFire*/
'use strict';
angular.module('main')
  .factory('ReservasService', function (Ref, $timeout, $firebaseArray, $q, $rootScope, UserService) {
    var service = {
      ref: Ref.child('reservas'),
      refUserReservas: Ref.child('usersReservas').child(firebase.auth().currentUser.uid),

      getReservasDia: getReservasDia,
      getMinhasReservas: getMinhasReservas,
      criarReservaAvulsa: criarReservaAvulsa,
      //createGeo: createGeo
    };

    return service;

    function getReserva(arenaId, reservaId) {
      return service.ref.child(arenaId + '/' + reservaId);
    }

    function getReservasDia(arena, start, end) {
      var ref = service.ref.child(arena).orderByChild('start').startAt(start).endAt(end);
      return $firebaseArray(ref);
    }

    function criarReservaAvulsa(novaReserva, arena) {
      var deferred = $q.defer();

      verificaHorarioPeriodo(novaReserva, arena).then(function (horarioValido) {

        if (horarioValido) {
          var reservaId = service.ref.child(arena).push().key;
          var jogoId = Ref.child('jogos').push().key;
          var notificacaoId = Ref.child('arenasNotificacoes/' + arena).push().key;
          var reservaData = {};
          var notificacao = {
            data: new Date() / 1,
            titulo: 'Nova Reserva de ' + firebase.auth().currentUser.displayName,
            msg: moment(novaReserva.start).format('[dia] DD [as] HH:mm') + ' na - Quadra 1',
            img: firebase.auth().currentUser.photoURL,
            lida: false
          };
          var jogo = {
            arena: arena,
            inicio: novaReserva.start,
            responsavel: firebase.auth().currentUser.uid,
            reserva: reservaId,
            status: 'agendado'
          };
          reservaData['arenasContatos/' + arena + '/' + firebase.auth().currentUser.uid] = true;
          reservaData['arenasNotificacoes/' + arena + '/' + notificacaoId] = notificacao;
          reservaData['usersReservas/' + firebase.auth().currentUser.uid + '/' + reservaId] = arena;
          reservaData['usersJogos/' + firebase.auth().currentUser.uid + '/' + jogoId] = true;
          reservaData['jogos/' + jogoId] = jogo;
          reservaData['reservas/' + arena + '/' + reservaId] = novaReserva;

          Ref.update(reservaData, function (error) {
            if (error) {
              deferred.reject('Erro ao cadastrar nova turma');
            }
            else {
              var ref = Ref.child('arenasLocalizacao/' + arena + '/l');
              ref.once('value', function (data) {
                var geo = new GeoFire(Ref.child('jogosLocalizacao'));
                geo.set(jogoId, data.val());
              });

              deferred.resolve();
            }
          });
        }
        else {
          deferred.reject('Horário Ocupado!');
        }

      });

      return deferred.promise;
    }

    function verificaHorarioPeriodo(reserva, arena) {
      var deferred = $q.defer();

      var result = true;
      var ref = service.ref.child(arena)
        .orderByChild('start').startAt(moment(moment(reserva.start).format('MMDDYYYY'), 'MMDDYYYY') / 1).endAt(reserva.end);

      ref.once('value', function (data) {
        _.forEach(data.val(), function (h) {
          if (reserva.start === h.start ||
            reserva.end === h.end ||
            (reserva.start < h.start && h.start < reserva.start) ||
            (reserva.start > h.start && h.end > reserva.end)
          ) {
            result = false;
          }
        });
        deferred.resolve(result);
      });
      return deferred.promise;
    }

    function getMinhasReservas() {
      service.refUserReservas.on('child_added', function (snap) {
        getReserva(snap.val(), snap.key).on('value', function (snapReservaData) {
          Ref.child('arenas/' + snap.val() + '/nome').on('value', function (snapNomeArena) {
            var data = snapReservaData.val();
            data.id = snap.key;
            data.arenaId = snap.val();
            data.arenaNome = snapNomeArena.val();
            $timeout(function () {
              UserService.reservas.push(data);
            });
          });
        });
      });
    }

  });
