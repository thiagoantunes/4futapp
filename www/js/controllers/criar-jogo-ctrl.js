/*global moment*/
'use strict';
angular.module('main')
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
