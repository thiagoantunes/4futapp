/*global */
'use strict';
angular.module('main')
  .controller('ArenasCtrl', function ($scope, ArenasService) {
    var vm = this;
    vm.arenaService = ArenasService;
    vm.arenas = [];

    activate();

    function activate() {
      loadArenas();
    }

    function loadArenas() {
      vm.arenaService.getGeoQuery().then(function (geo) {

        vm.map = {
          center: {
            latitude: geo.center()[0],
            longitude: geo.center()[1]
          },
          zoom: 12,
          options: {
            disableDefaultUI: true,
            styles: [{ 'stylers': [{ 'hue': '#ff1a00' }, { 'invert_lightness': true }, { 'saturation': -100 }, { 'lightness': 33 }, { 'gamma': 0.5 }] }, { 'featureType': 'water', 'elementType': 'geometry', 'stylers': [{ 'color': '#2D333C' }] }]
          }
        };

        geo.on('key_entered', function (key, location, distance) {
          vm.arenaService.getArenaNoSync(key).then(function (snapshot) {
            $scope.$apply(function () {
              var arena = snapshot.val();
              arena.distance = distance;
              arena.id = key;
              arena.l = { latitude: location[0], longitude: location[1] };
              vm.arenas.push(arena);
            });
          });
        });
      });
    }

  });
