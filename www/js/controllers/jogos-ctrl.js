/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('JogosCtrl', function ($scope, GeoService, JogosService, $ionicModal) {
    var vm = this;
    vm.jogosRegiao = JogosService.jogosRegiao;
    vm.modalNovoJogo = {};
    vm.modalLocais = {};
    vm.novoJogo = {};

    vm.salvarJogo = salvarJogo;
    vm.placeChanged = placeChanged;
    vm.openNovoJogoModal = openNovoJogoModal;
    activate();

    function activate() {
      setMap();
      console.log(vm.jogosRegiao);
      console.log('vm.jogosRegiao');
    }

    function setMap() {
      vm.map = {
        center: {
          latitude: GeoService.position[0],
          longitude: GeoService.position[1]
        },
        zoom: 12,
        options: {
          disableDefaultUI: true,
          // styles: [{ 'stylers': [{ 'hue': '#ff1a00' }, { 'invert_lightness': true }, { 'saturation': -100 }, { 'lightness': 33 }, { 'gamma': 0.5 }] }, { 'featureType': 'water', 'elementType': 'geometry', 'stylers': [{ 'color': '#2D333C' }] }]
          styles: [{ 'featureType': 'administrative.country', 'elementType': 'geometry.stroke', 'stylers': [{ 'visibility': 'on' }, { 'color': '#1c99ed' }] }, { 'featureType': 'administrative.country', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#1f79b5' }] }, { 'featureType': 'administrative.province', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#6d6d6d' }, { 'visibility': 'on' }] }, { 'featureType': 'administrative.locality', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#555555' }] }, { 'featureType': 'administrative.neighborhood', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#999999' }] }, { 'featureType': 'landscape', 'elementType': 'all', 'stylers': [{ 'color': '#f2f2f2' }] }, { 'featureType': 'landscape.natural', 'elementType': 'geometry.fill', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'landscape.natural.landcover', 'elementType': 'geometry.fill', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.attraction', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.business', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.government', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.medical', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.park', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#e1eddd' }] }, { 'featureType': 'poi.place_of_worship', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.school', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.sports_complex', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'road', 'elementType': 'all', 'stylers': [{ 'saturation': '-100' }, { 'lightness': '45' }] }, { 'featureType': 'road.highway', 'elementType': 'all', 'stylers': [{ 'visibility': 'simplified' }] }, { 'featureType': 'road.highway', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#009688' }] }, { 'featureType': 'road.highway', 'elementType': 'labels.icon', 'stylers': [{ 'visibility': 'on' }, { 'hue': '#009aff' }, { 'saturation': '100' }, { 'lightness': '5' }] }, { 'featureType': 'road.highway.controlled_access', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'road.highway.controlled_access', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#009688' }] }, { 'featureType': 'road.highway.controlled_access', 'elementType': 'geometry.stroke', 'stylers': [{ 'visibility': 'off' }] }, { 'featureType': 'road.highway.controlled_access', 'elementType': 'labels.icon', 'stylers': [{ 'lightness': '1' }, { 'saturation': '100' }, { 'hue': '#009aff' }] }, { 'featureType': 'road.arterial', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#ffffff' }] }, { 'featureType': 'road.arterial', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#8a8a8a' }] }, { 'featureType': 'road.arterial', 'elementType': 'labels.icon', 'stylers': [{ 'visibility': 'off' }] }, { 'featureType': 'road.local', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#ffffff' }] }, { 'featureType': 'transit', 'elementType': 'all', 'stylers': [{ 'visibility': 'off' }] }, { 'featureType': 'transit.station.airport', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'transit.station.airport', 'elementType': 'geometry.fill', 'stylers': [{ 'lightness': '33' }, { 'saturation': '-100' }, { 'visibility': 'on' }] }, { 'featureType': 'transit.station.bus', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'transit.station.rail', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'water', 'elementType': 'all', 'stylers': [{ 'color': '#46bcec' }, { 'visibility': 'on' }] }, { 'featureType': 'water', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#4db4f8' }] }, { 'featureType': 'water', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#ffffff' }] }, { 'featureType': 'water', 'elementType': 'labels.text.stroke', 'stylers': [{ 'visibility': 'off' }] }]
        },
        markersEvents: {
          click: function (marker, eventName, model) {
            vm.arenaService.arenaSelecionada = _.find(vm.arenas, { id: model.id });
            vm.map.window.show = true;
          }
        },
        window: {
          marker: {},
          show: false,
          closeClick: function () {
            this.show = false;
          },
          options: {} // define when map is ready
        }
      };
    }

    function salvarJogo(location) {
      $scope.novoJogo.inicio = $scope.novoJogo.inicio.add($scope.modalForm.horarioRange.value, 'ms')._d.getTime();
      JogosService.criarJogo($scope.novoJogo, [location.lat(), location.lng()]);
    }

    function placeChanged() {
      vm.place = this.getPlace();
      vm.map.setCenter(vm.place.geometry.location);
      vm.event.location = vm.place.formatted_address;
    }

    function createArray() {
      var arr = [];

      for (var i = 0; i < 10; i++) {
        var dat = new Date();
        dat.setDate(dat.getDate() + i);

        arr.push({
          id: i,
          display: moment(dat).format('ddd') + ' ' + dat.getDate(),
          val: dat / 1
        });
      }

      return arr;
    }

    vm.translate = function (value) {
      var val = moment(value).utc().format('HH:mm');
      return val;
    };

    function openNovoJogoModal() {
      $scope.modalForm = {
        dateSelectorConfig: {
          carouselId: 'carousel-1',
          align: 'left',
          selectFirst: true,
          centerOnSelect: false,
          template: 'templates/misc/carousel-template.html'
        },
        dateSelector: createArray(),
        jogadoresRange: {
          options: {
            floor: 0,
            ceil: 40,
            step: 1
          }
        },
        horarioRange: {
          value: 43200000,
          options: {
            floor: 0,
            step: 1800000,
            ceil: 86400000,
            translate: vm.translate,
          }
        }
      };
      $scope.hideModal = function () {
        $scope.novoJogoModal.hide();
      };

      $scope.onDateSelect = function (item) {
        $scope.novoJogo.inicio = moment(item.val);
      };

      $scope.salvarJogo = salvarJogo;

      $scope.novoJogo = {
        minJogadores: 10,
        maxJogadores: 20,
        responsavel: firebase.auth().currentUser.uid,
        status: 'agendado'
      };

      $ionicModal.fromTemplateUrl('templates/modal/criar-jogo.html', {
        scope: $scope
      }).then(function (modal) {
        $scope.novoJogoModal = modal;
        modal.show();
      });
    }

  })

  .controller('CriarJogoCtrl', function (JogosService) {
    var vm = this;
    vm.novoJogo = {};
    vm.salvarJogo = salvarJogo;

    activate();

    function activate() {
      vm.novoJogo = {
        minJogadores: 10,
        maxJogadores: 20
      };

      vm.jogadoresRange = {
        options: {
          floor: 0,
          ceil: 40,
          step: 1
        }
      };

      vm.carouselOptions1 = {
        carouselId: 'carousel-1',
        align: 'left',
        selectFirst: true,
        centerOnSelect: false,
      };
      vm.carouselData1 = createArray(20);
    }

    function salvarJogo() {
      JogosService.criarJogo(vm.novoJogo, [-19.8733446, -43.93158549999998]);
    }

    function createArray() {
      var arr = [];

      for (var i = 0; i < 30; i++) {
        var dat = new Date();
        dat.setDate(dat.getDate() + i);

        arr.push({
          id: i,
          display: moment(dat).format('ddd') + ' ' + dat.getDate(),
          val: dat / 1
        });
      }

      return arr;
    }

  });
