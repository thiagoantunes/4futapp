/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('MeusJogosCtrl', function (JogosService, UserService, $ionicModal) {
    var vm = this;
    vm.jogosService = JogosService;
    vm.jogos = UserService.jogos;
    vm.filtroJogos = filtroJogos;
    vm.mostrarHistorico = false;

    vm.openNovoJogoModal = openNovoJogoModal;
    vm.getNumJogadores = getNumJogadores;

    activate();

    function activate() {

    }

    function filtroJogos() {
      return function (item) {
        var diff = moment().diff(item['inicio'], 'days');
        if (vm.mostrarHistorico) {
          return diff > 0;
        }
        else {
          return diff <= 0;
        }
      }
    }

    function openNovoJogoModal() {
      JogosService.novaPartidaModal = {
        data: undefined
      };
      $ionicModal.fromTemplateUrl('templates/modal/criar-jogo.html', {
      }).then(function (modal) {
        JogosService.novaPartidaModal.modal = modal;
        modal.show();
      });
    }

    function getNumJogadores(jogadores){
      return Object.keys(jogadores).length;
    }

  })

  .controller('NovaPartidaCtrl', function ($scope, $state, JogosService, ArenasService, $ionicModal, ionicTimePicker, ionicDatePicker, LocationService) {
    var vm = this;
    vm.arenasBasicas = ArenasService.arenasBasicas;
    vm.modalData = JogosService.novaPartidaModal.data;
    vm.openTimePicker = openTimePicker;
    vm.openDatePicker = openDatePicker;
    vm.openLocalPicker = openLocalPicker;
    vm.openCriaLocalModal = openCriaLocalModal;
    vm.selecionaArenaBasica = selecionaArenaBasica;
    vm.salvarJogo = salvarJogo;
    vm.hideModal = hideModal;

    activate();

    function activate() {
      ArenasService.getArenasBasicas();
      vm.novaPartida = {
        minJogadores: 10,
        maxJogadores: 20,
        visibilidade: '4',
        compartilharFacebook: true,
        aprovacaoManual: false,
        responsavel: firebase.auth().currentUser.uid,
        status: 'agendado'
      };
      if (vm.modalData) {
        vm.novaPartida.dia = moment(vm.modalData.start).format('DD/MM/YYYY');
        vm.novaPartida.hora = moment(vm.modalData.start).format('HH:mm');
        vm.localSelecionado = vm.modalData.local;
      }

      vm.numJogadoresRangeOptions = {
        floor: 5,
        ceil: 30,
        step: 1,
        hidePointerLabels: true,
        hideLimitLabels: true,
      };
    }

    function salvarJogo(location) {
      vm.novaPartida.endereco = vm.localSelecionado.endereco;
      vm.novaPartida.inicio = moment(vm.novaPartida.dia + vm.novaPartida.hora, 'DD/MM/YYYYHH:mm')._d.getTime();
      JogosService.criarJogo(vm.novaPartida, [vm.localSelecionado.latitude, vm.localSelecionado.longitude])
        .then(function (val) {
          hideModal();
          JogosService.jogoSelecionado = val;
          JogosService.jogoSelecionado.novoJogo = true;
          $state.go('main.jogos-detail', { id: val.id });
        });
    }

    function hideModal() {
      JogosService.novaPartidaModal.modal.hide();
    }

    function openTimePicker() {
      if (window.cordova) {
        var options = {
          date: new Date(),
          mode: 'time',
          locale: 'pt_br',
          minuteInterval: 15,
          doneButtonLabel: 'Ok',
          cancelButtonLabel: 'Cancelar',
          androidTheme: 4,
          is24Hour: true,
          okText: 'Ok',
          cancelText: 'Cancelar',

        };
        datePicker.show(options, function (date) {
          $scope.$apply(function () {
            var activeElement = document.activeElement;
            if (activeElement) {
              activeElement.blur();
            }
            vm.novaPartida.hora = moment(date).format('HH:mm');
          });
        });
      }
      else {
        var tpObj = {
          callback: function (val) {
            if (!(typeof (val) === 'undefined')) {
              var selectedTime = new Date(val * 1000);
              vm.novaPartida.hora = moment(new Date(val * 1000)).add(moment(new Date(val * 1000))._d.getTimezoneOffset(), 'm').format('HH:mm');
            }
          }
        };
        ionicTimePicker.openTimePicker(tpObj);
      }

    }

    function openDatePicker() {
      if (window.cordova) {
        var options = {
          date: new Date(),
          mode: 'date',
          locale: 'pt_br',
          minuteInterval: 15,
          doneButtonLabel: 'Ok',
          cancelButtonLabel: 'Cancelar',
          allowOldDates: false,
          androidTheme: 4,
          is24Hour: true,
          okText: 'Ok',
          cancelText: 'Cancelar',
        };
        datePicker.show(options, function (date) {
          $scope.$apply(function () {
            var activeElement = document.activeElement;
            if (activeElement) {
              activeElement.blur();
            }
            vm.novaPartida.dia = moment(date).format('DD/MM/YYYY');
          });
        });
      }
      else {
        var ipObj1 = {
          callback: function (val) {  //Mandatory
            vm.novaPartida.dia = moment(val).format('DD/MM/YYYY');
          },
          inputDate: new Date(),
          mondayFirst: true,
        };
        ionicDatePicker.openDatePicker(ipObj1);
      }
    }

    function openLocalPicker() {
      $ionicModal.fromTemplateUrl('templates/modal/selecionar-local.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modalLocal = modal;
        $scope.modalLocal.show();
      });
    }

    function openCriaLocalModal() {
      $scope.search = {};
      $scope.search.suggestions = [];
      $scope.search.query = '';
      $scope.search.justSelected = false;
      $scope.$watch('search.query', function (newValue) {
        if (newValue && !$scope.search.justSelected) {
          LocationService.searchAddress(newValue).then(function (result) {
            $scope.search.error = null;
            $scope.search.suggestions = result;
          }, function (status) {
            $scope.search.error = 'There was an error :( ' + status;
          });
        }
        $scope.choosePlace = function (place) {
          LocationService.getDetails(place.place_id).then(function (location) {
            $scope.search.query = location.formatted_address;
            $scope.location = location;
            $scope.search.justSelected = true;
            $scope.search.suggestions = [];
          });
        };

        $scope.salvarNovoLocal = function () {
          ArenasService.criaArenaBasica(
            $scope.search.nome,
            [$scope.location.geometry.location.lat(), $scope.location.geometry.location.lng()],
            $scope.location.formatted_address
          )
            .then(function () {
              vm.localSelecionado = {
                nome: $scope.search.nome,
                latitude: $scope.location.geometry.location.lat(),
                longitude: $scope.location.geometry.location.lng(),
                endereco: $scope.location.formatted_address
              }
              $scope.modalCriaLocal.hide();
              $scope.modalLocal.hide();
            }, function (error) {
              console.log('Erro ao cadastrar novo local');
            });
        };
      });
      $ionicModal.fromTemplateUrl('templates/modal/criar-local.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modalCriaLocal = modal;
        $scope.modalCriaLocal.show();
      });
    }

    function selecionaArenaBasica(arenaBasica) {
      vm.localSelecionado = arenaBasica;
      $scope.modalLocal.hide();
      console.log(arenaBasica);
    }

  })

  .controller('JogosDetailCtrl', function ($scope, $rootScope, $ionicPlatform, $ionicHistory, JogosService, UserService, $ionicModal) {
    var vm = this;
    vm.jogo = JogosService.jogoSelecionado;
    vm.jogadores = JogosService.getJogadoresJogo(vm.jogo.id);
    vm.amigos = UserService.amigos;

    vm.atualizaPresenca = atualizaPresenca;
    vm.getPresencaClass = getPresencaClass;
    vm.checkPresencaAmigo = checkPresencaAmigo;
    vm.convidarAmigo = convidarAmigo;
    vm.desconvidarAmigo = desconvidarAmigo;

    activate();

    function activate() {
      vm.jogadores.$loaded(function (val) {
        vm.minhaPresenca = _.find(val, { '$id': firebase.auth().currentUser.uid });
      });

      $ionicModal.fromTemplateUrl('templates/modal/convidar-amigos.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
        if (vm.jogo.novoJogo) {
          $scope.modal.show();
        }
      });
    }

    function atualizaPresenca(bool) {
      if (vm.minhaPresenca.confirmado !== undefined) {
        vm.minhaPresenca.confirmado = bool == vm.minhaPresenca.confirmado ? null : bool;
      }
      else {
        vm.minhaPresenca.confirmado = bool;
      }

      vm.jogadores.$save(vm.minhaPresenca);
    }

    function getPresencaClass(confirmacao) {
      var val = 'icon ion-ios-help-outline';
      if (confirmacao != undefined) {
        if (confirmacao) {
          val = 'icon ion-ios-checkmark positive';
        }
        else {
          val = 'icon ion-ios-close assertive';
        }
      }
      return val;
    }

    function checkPresencaAmigo(amigo) {
      return _.some(vm.jogadores, { '$id': amigo.id });
    }

    function convidarAmigo(amigo) {
      JogosService.convidarAmigo(amigo, vm.jogo.id);
    }

    function desconvidarAmigo(amigo) {
      JogosService.desconvidarAmigo(amigo, vm.jogo.id);
    }

    var oldSoftBack = $rootScope.$ionicGoBack;

    var doCustomBack = function () {
      if (vm.jogo.novoJogo) {
        $ionicHistory.goBack(-5);
      }
      else {
        oldSoftBack();
      }
    };

    $rootScope.$ionicGoBack = function () {
      doCustomBack();
    };
    var deregisterSoftBack = function () {
      $rootScope.$ionicGoBack = oldSoftBack;
    };

    var deregisterHardBack = $ionicPlatform.registerBackButtonAction(
      doCustomBack, 101
    );

    $scope.$on('$destroy', function () {
      deregisterHardBack();
      deregisterSoftBack();
    });

  });

