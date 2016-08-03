/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('JogosCtrl', function ($scope, GeoService, JogosService, $ionicModal) {
    var vm = this;
    vm.jogosRegiao = JogosService.jogosRegiao;
    vm.jogosService = JogosService;
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
        vm.jogosService.jogoSelecionado = _.find(vm.jogosRegiao, { id: model.id });
        vm.jogosService.jogoSelecionado.jogadores = JogosService.getJogadoresJogo(model.id);
        vm.map.center = {
          latitude: vm.jogosService.jogoSelecionado.latitude,
          longitude: vm.jogosService.jogoSelecionado.longitude
        };
        vm.showDetails = true;
    }

  });