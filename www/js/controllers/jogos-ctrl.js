/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('JogosCtrl', function ($scope, GeoService, JogosService, $ionicModal) {
    var vm = this;
    vm.jogosRegiao = JogosService.jogosRegiao;
    vm.jogosService = JogosService;
    vm.orderByConfirmacao = orderByConfirmacao;
    activate();

    function activate() {
      setMap();
    }

    function setMap() {
      vm.map = {
        center: {
          latitude: GeoService.position[0],
          longitude: GeoService.position[1]
        },
        zoom: 14,
        options: {
          disableDefaultUI: true,
        },
        mapEvents: {
          click: function () {
            $scope.$apply(function () {
              vm.showDetails = false;
            });
          }
        },

        markersEvents: {
          click: selecionaJogoMapa
        }
      };
    }

    function selecionaJogoMapa(marker, eventName, model) {
      if (model.visivel) {
        vm.jogosService.jogoSelecionado = _.find(vm.jogosRegiao, { id: model.id });
        vm.map.center = {
          latitude: vm.jogosService.jogoSelecionado.latitude,
          longitude: vm.jogosService.jogoSelecionado.longitude
        };
        vm.showDetails = true;
      }
    }

    function orderByConfirmacao(jogador) {
      if (jogador.confirmado == true) {
        return 1;
      }
      else if (jogador.confirmado == undefined) {
        return 2;
      }
      else if (jogador.confirmado == false) {
        return 3;
      }
    }

  });