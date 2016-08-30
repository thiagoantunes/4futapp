/*jshint loopfunc: true */
(function () {
    'use strict';
    angular.module('main')
        .controller('MapCtrl', MapCtrl);

    MapCtrl.$inject = ['$scope', '$rootScope', '$timeout', 'ArenasService', 'JogosService', '$ionicHistory', '$window', 'GeoService', '$ionicSideMenuDelegate'];

    function MapCtrl($scope, $rootScope, $timeout, ArenasService, JogosService, $ionicHistory, $window, GeoService, $ionicSideMenuDelegate) {
        var vm = this;
        vm.arenaService = ArenasService;
        vm.jogosService = JogosService;
        vm.arenas = ArenasService.arenas;
        vm.jogosRegiao = JogosService.jogosRegiao;
        vm.isDevice = isDevice;
        vm.acharNoMapa = acharNoMapa;
        vm.toggleLeftSideMenu = toggleLeftSideMenu;

        vm.orderByConfirmacao = orderByConfirmacao;
        vm.jogoHoje = jogoHoje;
        vm.jogoAlgumasHoras = jogoAlgumasHoras;
        vm.jogoEmAndamento = jogoEmAndamento;

        activate();

        function activate() {
            if (isDevice()) {
                initMap();
            }
            else {
                ArenasService.getArenas();
                JogosService.getJogosRegiao();
            }
        }

        function initMap() {
            console.log('Getting map');
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
                var map = plugin.google.maps.Map.getMap(document.getElementById("map-arenas"), mapParams);
                map.on(plugin.google.maps.event.MAP_READY, function (map) {
                    console.log('Map loaded');
                    $rootScope.map = map;
                    $rootScope.markers = [];
                    $rootScope.map.animateCamera({
                        'target': mapPosition,
                        'tilt': 0,
                        'zoom': 14,
                        'bearing': 0,
                        'duration': 2000
                        // = 2 sec.
                    });
                    ArenasService.getArenas();
                    JogosService.getJogosRegiao();
                    $rootScope.map.addEventListener(plugin.google.maps.event.CAMERA_CHANGE, GeoService.onMapCameraChanged);
                });
            }, 500);
        }

        function acharNoMapa(marker) {
            var mapPosition = new plugin.google.maps.LatLng(marker.data.latitude, marker.data.longitude);
            marker.showInfoWindow();
            $rootScope.map.animateCamera({
                'target': mapPosition,
                'tilt': 0,
                'zoom': 14,
                'bearing': 0,
                'duration': 500
                // = 2 sec.
            });
        }

        function orderByConfirmacao(jogador) {
            if (jogador.confirmado === true) {
                return 1;
            }
            else if (jogador.confirmado === undefined) {
                return 2;
            }
            else if (jogador.confirmado === false) {
                return 3;
            }
        }

        function jogoHoje(inicio) {
            var date = moment(inicio);
            var REFERENCE = moment();
            var TODAY = REFERENCE.clone().startOf('day');
            return date.isSame(TODAY, 'd');
        }

        function jogoAlgumasHoras(inicio) {
            var date = moment(inicio);
            var duration = moment.duration(date.diff(moment()));
            return duration.asHours() < 5 && duration.asHours() > 0;
        }

        function jogoEmAndamento(inicio) {
            var date = moment(inicio);
            var duration = moment.duration(date.diff(moment()));
            return duration.asHours() < 0 && duration.asHours() >= -1.5;
        }

        function isDevice() {
            return window.cordova;
        }

        function toggleLeftSideMenu() {
            if ($ionicSideMenuDelegate.isOpen()) {
                $rootScope.hideMenu = true;
            }
            else {
                $rootScope.hideMenu = false;
            }
            $ionicSideMenuDelegate.toggleLeft();
        }

    }

} ());
