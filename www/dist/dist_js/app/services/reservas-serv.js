(function () {
  'use strict';
  angular.module('main')
  .factory('ReservasService', ReservasService);

  ReservasService.$inject = ['Ref', '$timeout', '$firebaseArray', '$q', '$rootScope', 'UserService', '$ionicModal', 'ArenasService'];

  function ReservasService(Ref, $timeout, $firebaseArray, $q, $rootScope, UserService, $ionicModal, ArenasService) {
    var service = {
      reservaSelecionada: {},
      ref: Ref.child('reservas'),
      refUserReservas: Ref.child('usersReservas').child(firebase.auth().currentUser.uid),

      getReservasDia: getReservasDia,
      getMinhasReservas: getMinhasReservas,
      criarReservaAvulsa: criarReservaAvulsa,
      cancelarReserva: cancelarReserva,
      openReservaModal: openReservaModal
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
          reservaData['arenasContatos/' + arena + '/' + firebase.auth().currentUser.uid] = true;
          reservaData['arenasNotificacoes/' + arena + '/' + notificacaoId] = notificacao;
          reservaData['usersReservas/' + firebase.auth().currentUser.uid + '/' + reservaId] = arena;
          reservaData['reservas/' + arena + '/' + reservaId] = novaReserva;

          Ref.update(reservaData, function (error) {
            if (error) {
              deferred.reject('Erro ao cadastrar nova turma');
            }
            else {
              novaReserva.$id = reservaId;
              novaReserva.arenaId = arena;
              deferred.resolve(novaReserva);
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
            data.$id = snap.key;
            data.arenaId = snap.val();
            data.arenaNome = snapNomeArena.val();
            $timeout(function () {
              _.remove(UserService.reservas, { 'id': snap.key });
              UserService.reservas.push(data);
            });
          });
        });
      });
    }

    function cancelarReserva(arenaId, reservaId) {
      var reservaData = {};
      reservaData['reservas/' + arenaId + '/' + reservaId + '/status'] = 'cancelado';
      Ref.update(reservaData);
    }

    function openReservaModal(reserva, arena) {
      service.reservaSelecionada.data = reserva;
      service.reservaSelecionada.data.arena = arena;
      $ionicModal.fromTemplateUrl('modal/reserva-details.html', {
        animation: 'slide-in-up'
      }).then(function (modal) {
        service.reservaSelecionada.modal = modal;
        modal.show();
      });
    }

  }

} ());
