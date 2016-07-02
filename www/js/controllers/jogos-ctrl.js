/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('JogosCtrl', function ($scope, JogosService, $ionicModal) {
    var vm = this;
    vm.jogosRegiao = [];
    vm.modalNovoJogo = {};
    vm.modalLocais = {};
    vm.meusJogos = {};
    vm.novoJogo = {};

    vm.salvarJogo = salvarJogo;
    vm.placeChanged = placeChanged;
    vm.openNovoJogoModal = openNovoJogoModal;
    activate();

    function activate() {
      loadJogos();
    }

    function loadJogos() {
      var user = firebase.auth().currentUser;
      if (user) {
        JogosService.getUserJogos(user.uid).$loaded(function (val) {
          vm.meusJogos = val;
        });
      }

      JogosService.getGeoQuery().then(function (geo) {
        vm.map = {
          center: {
            latitude: geo.center()[0],
            longitude: geo.center()[1]
          },
          zoom: 14
        };

        geo.on('key_entered', function (key, location, distance) {
          JogosService.getJogoNoSync(key).then(function (snapshot) {
            $scope.$apply(function () {
              var jogo = snapshot.val();
              jogo.distance = distance;
              jogo.id = key;
              jogo.l = { latitude: location[0], longitude: location[1] };
              vm.jogosRegiao.push(jogo);
            });
          });
        });
      });
    }

    function salvarJogo(location) {
      $scope.novoJogo.inicio.add($scope.modalForm.horarioRange.value, 'ms')._d.getTime();
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
          template: 'templates/carousel-template.html'
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

      $ionicModal.fromTemplateUrl('templates/criar-jogo.html', {
        scope: $scope
      }).then(function (modal) {
        $scope.novoJogoModal = modal;
        modal.show();
      });
    }

  });
