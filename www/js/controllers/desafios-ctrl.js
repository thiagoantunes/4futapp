/*global firebase*/
'use strict';
angular.module('main')
  .controller('DesafiosCtrl', function (TimesService, UserService, $timeout, $ionicModal) {
    var vm = this;
    vm.timesService = TimesService;
    vm.times = TimesService.timesRegiao;

    activate();

    function activate() {
    }

  })

  .controller('CriarDesafioCtrl', function (TimesService, $scope, $state, $ionicHistory, UserService, ReservasService, JogosService, ArenasService, $ionicModal, ionicTimePicker, ionicDatePicker, LocationService) {
    var vm = this;
    vm.arenas = ArenasService.arenas;
    vm.meusTimes = UserService.times;
    vm.timeSelecionado = {};
    vm.timeDesafiado = TimesService.timeSelecionado.data;
    vm.modalTimeDesafiado = TimesService.timeSelecionado.modal;
    vm.arenasBasicas = ArenasService.arenasBasicas;

    vm.openTimePicker = openTimePicker;
    vm.openDatePicker = openDatePicker;
    vm.openLocalPicker = openLocalPicker;
    vm.openCriaLocalModal = openCriaLocalModal;
    vm.selecionaArenaBasica = selecionaArenaBasica;
    vm.getModalidades = getModalidades;
    vm.goBack = goBack;
    vm.salvarDesafio = salvarDesafio;
    vm.selecionaTime = selecionaTime;

    activate();

    function activate() {
      vm.minhasModalidades = [];
      var meuTime = {};
      if (vm.meusTimes.length == 1) {
        meuTime = {
          id: vm.meusTimes[0].id,
          escudo: vm.meusTimes[0].escudo,
          nome: vm.meusTimes[0].nome
        };
        vm.minhasModalidades = vm.meusTimes[0].modalidades;
        getModalidades();
      }
      ArenasService.getArenasBasicas();
      vm.novoDesafio = {
        data: {
          desafiante: meuTime,
          desafiado: {
            id: vm.timeDesafiado.id,
            escudo: vm.timeDesafiado.escudo,
            nome: vm.timeDesafiado.nome
          }
        }
      };
    }

    function salvarDesafio() {
      vm.novoDesafio.data.endereco = vm.novoDesafio.localSelecionado.endereco;
      var novoDesafioData = {
        desafio: vm.novoDesafio.data,
        coords: [vm.novoDesafio.localSelecionado.latitude, vm.novoDesafio.localSelecionado.longitude],
        arenaId: vm.novoDesafio.arenaReserva
      }
      TimesService.criarDesafio(novoDesafioData)
        .then(function (desafioId) {
          TimesService.getDesafio(desafioId).then(function (val) {
            TimesService.desafioSelecionado = val;
            $state.go('main.meus-desafios-detail', { id: desafioId });
          });
        });
    }

    function getModalidades() {
      vm.modalidadesCombinadas = [];
      _.forEach(vm.timeDesafiado.modalidades, function (mod) {
        if (_.some(vm.minhasModalidades, function (minhaMod) {
          return minhaMod == mod;
        })) {
          vm.modalidadesCombinadas.push(mod);
        }
      });
      if (vm.modalidadesCombinadas.length == 1) {
        vm.novoDesafio.data.modalidade = vm.modalidadesCombinadas[0];
      }
    }

    function selecionaTime(time) {
      vm.minhasModalidades = time.modalidades;
      getModalidades();
      vm.novoDesafio.data.desafiante  = {
        id: time.id,
        escudo: time.escudo,
        nome: time.nome
      };
    }

    function openTimePicker() {
      if (!vm.novoDesafio.arenaReservaCallback) {
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
              vm.novoDesafio.data.inicio = moment(vm.novoDesafio.data.inicio + moment(date).format('HH:mm'), 'DD/MM/YYYYHH:mm')._d.getTime();
              vm.novoDesafio.dataFormatada = moment(vm.novoDesafio.data.inicio).format('DD/MM') + ' às ' + moment(vm.novoDesafio.data.inicio).format('HH:mm');
            });
          });
        }
        else {
          var tpObj = {
            callback: function (val) {
              if (!(typeof (val) === 'undefined')) {
                var selectedTime = new Date(val * 1000);
                var hora = moment(new Date(val * 1000)).add(moment(new Date(val * 1000))._d.getTimezoneOffset(), 'm').format('HH:mm');

                vm.novoDesafio.data.inicio = moment(vm.novoDesafio.data.inicio + hora, 'DD/MM/YYYYHH:mm')._d.getTime();
                vm.novoDesafio.dataFormatada = moment(vm.novoDesafio.data.inicio).format('DD/MM') + ' às ' + moment(vm.novoDesafio.data.inicio).format('HH:mm');
              }
            }
          };
          ionicTimePicker.openTimePicker(tpObj);
        }
      }
    }

    function openDatePicker() {
      if (!vm.novoDesafio.arenaReservaCallback) {
        if (window.cordova) {
          var options = {
            date: new Date(),
            mode: ionic.Platform.isAndroid() ? 'date' : 'datetime',
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
              if (ionic.Platform.isAndroid()) {
                vm.novoDesafio.data.inicio = moment(date).format('DD/MM/YYYY');
                openTimePicker();
              }
              else {
                vm.novoDesafio.data.inicio = moment(date)._d.getTime();
                vm.novoDesafio.dataFormatada = moment(date).format('DD/MM') + ' às ' + moment(date).format('HH:mm');
              }
            });
          });
        }
        else {
          var ipObj1 = {
            callback: function (val) {
              openTimePicker();
              vm.novoDesafio.data.inicio = moment(val).format('DD/MM/YYYY');
            },
            inputDate: new Date(),
            mondayFirst: true,
          };
          ionicDatePicker.openDatePicker(ipObj1);
        }
      }
    }

    function openLocalPicker() {
      if (!vm.novoDesafio.arenaReservaCallback) {
        $ionicModal.fromTemplateUrl('templates/modal/selecionar-local.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function (modal) {
          $scope.modalLocal = modal;
          $scope.modalLocal.show();
        });
      }
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
              vm.novoDesafio.localSelecionado = {
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
      vm.novoDesafio.localSelecionado = arenaBasica;
      $scope.modalLocal.hide();
      console.log(arenaBasica);
    }

    function goBack() {
      $ionicHistory.goBack();
      vm.modalTimeDesafiado.show();
    }

  });
