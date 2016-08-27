(function () {
  'use strict';
  angular.module('main')
    .directive('googleMap', ['GeoService', '$timeout',
      function (GeoService, $timeout) {
        return {
          restrict: 'A',
          scope: {
            mapReady: '&onMapReady'
          },
          link: function (scope, element) {
            function triggerMapReady(map) {
              scope.mapReady({ map: map });
            }
            if (GeoService.position.length > 0) {
              callMap();
            }
            else {
              GeoService.getLocation().then(function () {
                callMap();
              }, function (err) {
                console.log(err);
              });
            }

            function callMap() {
              var mapPosition = new plugin.google.maps.LatLng(GeoService.position[0], GeoService.position[1]);

              var mapParams = {
                'backgroundColor': '#ffffff',
                'mapType': plugin.google.maps.MapTypeId.ROADMAP,
                'controls': {
                  'compass': false,
                  'myLocationButton': false,
                  'indoorPicker': true,
                  'zoom': false
                  // Only for Android
                },
                'gestures': {
                  'scroll': true,
                  'tilt': false,
                  'rotate': true,
                  'zoom': true,
                },
                'camera': {
                  'latLng': mapPosition,
                  'tilt': 0,
                  'zoom': 5,
                  'bearing': 0
                }

              };
              $timeout(function () {
                var map = plugin.google.maps.Map.getMap(element[0], mapParams);
                map.on(plugin.google.maps.event.MAP_READY, triggerMapReady);
              }, 500);
            }

          }
        };
      }
    ]);

} ());