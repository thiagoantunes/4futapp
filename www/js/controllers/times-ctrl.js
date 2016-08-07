/*global firebase moment*/
'use strict';
angular.module('main')

  .controller('TimesCtrl', function (TimesService, $timeout, $ionicModal) {
    var vm = this;
    vm.timesService = TimesService;
    vm.times = TimesService.timesRegiao;

    activate();

    function activate() {
    }

  })

  .controller('MeusTimesCtrl', function ($state, TimesService, UserService, $timeout, $ionicActionSheet, $ionicModal) {
    var vm = this;
    vm.timesService = TimesService;
    vm.userService = UserService;
    vm.amigos = UserService.amigos;
    vm.times = UserService.times;
    vm.openAddOptions = openAddOptions;

    activate();

    function activate() {
    }

    function openAddOptions() {
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text: 'Buscar Jogadores' },
          { text: 'Criar Time' }
        ],
        cancelText: 'Fechar',
        cancel: function () {
          // add cancel code..
        },
        buttonClicked: function (index) {
          if (index == 0) {
            $state.go('main.buscarJogadores');
            return true;
          }
          else if (index == 1) {
            $state.go('main.criarTime');
            return true;
          }
        }
      });

      $timeout(function () {
        hideSheet();
      }, 4000);

    }

  })

  .controller('PerfilTimeCtrl', function (TimesService , $timeout, ionicMaterialMotion, ionicMaterialInk) {
    var vm = this;
    vm.time = TimesService.timeSelecionado.data;
    vm.closeModal = closeModal;

    activate();

    function activate() {
    }

    function closeModal(){
      TimesService.timeSelecionado.modal.hide();
    }

    // Set Motion
    $timeout(function () {
      ionicMaterialMotion.slideUp({
        selector: '.slide-up'
      });
    }, 300);

    // Set Ink
    ionicMaterialInk.displayEffect();

  })

  .controller('CriarTimeCtrl', function ($scope, TimesService, UserService, RegionService, $ionicHistory, $ionicSlideBoxDelegate) {
    var vm = this;
    vm.amigos = UserService.amigos;
    vm.checkMembroTime = checkMembroTime;
    vm.toggleMembroTime = toggleMembroTime;
    vm.validForm = validForm;
    vm.criarTime = criarTime;

    activate();

    function activate() {
      selecionadorRegiao();
      vm.novoTime = {
        jogadores: [],
        modalidades: {}
      };
    }

    function toggleMembroTime(amigo) {
      if (_.some(vm.novoTime.jogadores, { 'id': amigo.id })) {
        var index = vm.novoTime.jogadores.indexOf(amigo);
        if (index > -1) {
          vm.novoTime.jogadores.splice(index, 1);
        }
      }
      else {
        vm.novoTime.jogadores.push(amigo);
      }
    }

    function checkMembroTime(amigo) {
      return _.some(vm.novoTime.jogadores, { 'id': amigo.id });
    }

    function validForm() {
      return !(vm.novoTime.nome && vm.novoTime.jogadores.length > 0);
    }

    function criarTime() {
      var novoTime = {
        nome: vm.novoTime.nome,
        capitao: firebase.auth().currentUser.uid,
        regiao: vm.novoTime.regiao,
        modalidades: vm.novoTime.modalidades
      };
      TimesService.criarTime(novoTime, vm.novoTime.jogadores, vm.locationNovoTime ).then(function () {
        $ionicHistory.goBack(-1);
      });
    }

    function selecionadorRegiao() {
      $scope.search = {
        suggestions: [],
        quert: '',
        justSelected: false,
      };
      $scope.$watch('search.query', function (newValue) {
        if (newValue && !$scope.search.justSelected) {
          RegionService.searchAddress(newValue).then(function (result) {
            $scope.search.error = null;
            $scope.search.suggestions = result;
          }, function (status) {
            $scope.search.error = 'Ops.. algo de errado aconteceu. ' + status;
          });
        }
        $scope.choosePlace = function (place) {
          RegionService.getDetails(place.place_id).then(function (location) {
            vm.novoTime.regiao = location.formatted_address;
            vm.locationNovoTime = [location.geometry.location.lat(), location.geometry.location.lng()];
            $scope.search.query = location.formatted_address;
            $scope.search.justSelected = true;
            $scope.search.suggestions = [];
          });
        };
      });
    }

  })

  .controller('BuscarJogadores', function (UserService, $ionicHistory) {
    var vm = this;
    //TODO !!!!!!!!!!!!!
    vm.usuarios = UserService.getUsers();
    vm.amigos = UserService.amigos;
    vm.checkAmizade = checkAmizade;

    activate();

    function activate() {
      vm.novoTime = {
        jogadores: []
      };
    }

    function checkAmizade(usuario) {
      return _.some(vm.amigos, function (val) {
        return val.id == firebase.auth().currentUser.uid
          || val.id == usuario.$id;
      });
    }

  });
