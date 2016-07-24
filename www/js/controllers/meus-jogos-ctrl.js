/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('MeusJogosCtrl', function ($scope, JogosService, UserService, $ionicModal, ionicTimePicker, ionicDatePicker) {
    var vm = this;
    vm.jogosService = JogosService;
    vm.jogos = UserService.jogos;
    vm.filtroJogos = filtroJogos;
    vm.mostrarHistorico = false;
    vm.modalNovoJogo = {};
    vm.modalLocais = {};
    vm.novoJogo = {};

    vm.salvarJogo = salvarJogo;
    vm.placeChanged = placeChanged;
    vm.openNovoJogoModal = openNovoJogoModal;
    vm.openTimePicker = openTimePicker;
    vm.openDatePicker = openDatePicker;

    activate();

    function activate() {

      vm.numberPickerMin = {
        inputValue: 10,
        minValue: 0,
        maxValue: 22,
        titleLabel: 'Mínimo de jogadores',
        setLabel: 'Ok',  //Optional
        format: 'WHOLE',
        closeLabel: 'Fechar',  //Optional
        setButtonType: 'button-positive',  //Optional
        closeButtonType: 'button-stable',  //Optional
        callback: function (val) {    //Mandatory
          if (!(typeof (val) === 'undefined')) {
            $scope.novoJogo.minJogadores = val;
          }
        }
      };
      vm.numberPickerMax = {
        inputValue: 20,
        minValue: 0,
        maxValue: 50,
        titleLabel: 'Máximo de jogadores',
        setLabel: 'Ok',  //Optional
        format: 'WHOLE',
        closeLabel: 'Fechar',  //Optional
        setButtonType: 'button-positive',  //Optional
        closeButtonType: 'button-stable',  //Optional
        callback: function (val) {    //Mandatory
          if (!(typeof (val) === 'undefined')) {
            $scope.novoJogo.maxJogadores = val;
          }
        }
      };
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

    function salvarJogo(location) {
      $scope.novoJogo.endereco = location.formatted_address;
      //$scope.novoJogo.inicio = $scope.novoJogo.inicio.add($scope.modalForm.horarioRange.value, 'ms')._d.getTime();
      vm.jogosService.criarJogo($scope.novoJogo, [location.geometry.location.lat(), location.geometry.location.lng()]);
    }

    function openTimePicker() {
      var tpObj = {
        callback: function (val) {
          if (!(typeof (val) === 'undefined')) {
            var selectedTime = new Date(val * 1000);
            $scope.novoJogo.inicio = selectedTime.getUTCHours() + ':' + selectedTime.getUTCMinutes();
          }
        }
      };
      ionicTimePicker.openTimePicker(tpObj);
    }

    function openDatePicker() {
      var ipObj1 = {
        callback: function (val) {  //Mandatory
          $scope.novoJogo.dia = moment(val).format('DD/MM/YYYY');
        },
        inputDate: new Date(),
        mondayFirst: true,
      }; 
      ionicDatePicker.openDatePicker(ipObj1);
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

      // $scope.onDateSelect = function (item) {
      //   $scope.novoJogo.inicio = moment(item.val);
      // };

      $scope.salvarJogo = salvarJogo;

      $scope.novoJogo = {
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

