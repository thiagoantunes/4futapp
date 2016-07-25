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
      $ionicModal.fromTemplateUrl('templates/modal/criar-jogo.html', {
      }).then(function (modal) {
        JogosService.novaPartidaModal = {
          modal: modal,
          params: undefined
        };
        modal.show();
      });
    }

  })

  .controller('NovaPartidaCtrl', function ($scope, JogosService, $ionicModal, ionicTimePicker, ionicDatePicker) {
    var vm = this;
    vm.openTimePicker = openTimePicker;
    vm.openDatePicker = openDatePicker;
    vm.salvarJogo = salvarJogo;
    vm.hideModal = hideModal;

    activate();

    function activate() {
      vm.novaPartida = {
        minJogadores: 10,
        maxJogadores: 20,
        visibilidade: '4',
        compartilharFacebook: true,
        aprovacaoManual: false,
        responsavel: firebase.auth().currentUser.uid,
        status: 'agendado'
      };

      vm.numJogadoresRangeOptions = {
        floor: 5,
        ceil: 30,
        step: 1,
        hidePointerLabels: true,
        hideLimitLabels: true,
      };
    }

    function salvarJogo(location) {
      vm.novaPartida.endereco = location.formatted_address;
      vm.novaPartida.inicio = moment(vm.novaPartida.dia + vm.novaPartida.hora, 'DD/MM/YYYYHH:mm')._d.getTime();
      vm.jogosService.criarJogo(vm.novaPartida, [location.geometry.location.lat(), location.geometry.location.lng()]);
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

  })



  .controller('JogosDetailCtrl', function ($scope, JogosService, UserService, $ionicModal) {
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
      UserService.getAmigos();

      vm.jogadores.$loaded(function (val) {
        vm.minhaPresenca = _.find(val, { '$id': firebase.auth().currentUser.uid });
      });

      $ionicModal.fromTemplateUrl('templates/modal/convidar-amigos.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
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

  });

