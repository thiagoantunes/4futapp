/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('ReservasCtrl', function ($scope, ReservasService, UserService, ArenasService, GeoService, $ionicModal, $ionicPopup) {
    var vm = this;
    vm.minhasReservas = UserService.reservas;
    vm.mostrarHistorico = false;
    vm.modal = {};

    vm.filtroReservas = filtroReservas;
    vm.openReservamodal = openReservamodal;
    vm.cancelarReserva = cancelarReserva;
    vm.getStatusReserva = getStatusReserva;
    vm.isAndroid = isAndroid;

    activate();

    function activate() {
      setMap();
      $ionicModal.fromTemplateUrl('templates/modal/reserva-details.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        vm.modal = modal;
      });
    }

    function openReservamodal(reserva) {
      vm.reservaSelecionada = reserva;
      vm.reservaSelecionada.arena = ArenasService.getArena(reserva.arenaId);
      vm.reservaSelecionada.arenaLocation = ArenasService.getArenaLocation(reserva.arenaId).$loaded().then(function (val) {
        vm.map.center = {
          latitude: val.l[0],
          longitude: val.l[1]
        };
      });
      vm.modal.show();
    }

    function filtroReservas() {
      return function (item) {
        var diff = moment().diff(item['start'], 'days');
        if (vm.mostrarHistorico) {
          return diff > 0;
        }
        else {
          return diff <= 0;
        }
      }
    }

    function isAndroid() {
      return ionic.Platform.isAndroid();
    }

    function cancelarReserva() {
      var popup = $ionicPopup.confirm({
        template: 'Confirma o cancelamento da reserva?',
        buttons: [{
          text: 'Não',
          type: 'button-default',
          onTap: function (e) {
            e.preventDefault();
            popup.close();
          }
        }, {
            text: 'Sim',
            type: 'button-assertive',
            onTap: function (e) {
              ReservasService.cancelarReserva(vm.reservaSelecionada.arenaId, vm.reservaSelecionada.id);
              vm.modal.hide();
            }
          }]
      });
    }

    function setMap() {
      vm.showDetails = false;
      vm.map = {
        center: {
          latitude: GeoService.position[0],
          longitude: GeoService.position[1]
        },
        zoom: 14,
        options: {
          disableDefaultUI: true,

        }
      };
    }

    function getStatusReserva(status) {
      if (status == 'cancelado') {
        return 'Reserva cancelada';
      }
      else if (status == 'agendado') {
        return 'Agendamento confirmado';
      }
      else if (status == 'aguardando-confirmacao') {
        return 'Aguardando confirmação';
      }

    }

  });
