/*jshint loopfunc: true */
(function () {
    'use strict';
    angular.module('main')
        .controller('MapCtrl', MapCtrl);

    MapCtrl.$inject = ['$scope', '$rootScope', '$timeout', 'ArenasService', 'JogosService', '$ionicHistory', '$window', 'GeoService', '$ionicSideMenuDelegate', '$ionicModal', '$ionicSlideBoxDelegate', '$location', '$ionicScrollDelegate'];

    function MapCtrl($scope, $rootScope, $timeout, ArenasService, JogosService, $ionicHistory, $window, GeoService, $ionicSideMenuDelegate, $ionicModal, $ionicSlideBoxDelegate, $location, $ionicScrollDelegate) {
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
        vm.getLength = getLength;
        vm.toggleMarkers = toggleMarkers;
        vm.onSlideChange = onSlideChange;

        activate();

        function activate() {
            vm.showDetails = true;
            $ionicSlideBoxDelegate.update();
            vm.filtro = {
                tipo: 'todos',
                viewArenas: true
            };

            if (isDevice() && !$rootScope.map) {
                initMap();
            }
            else {
                GeoService.getLocation().then(function (location) {
                    ArenasService.getArenas();
                    JogosService.getJogosRegiao();
                });
            }
        }

        function initMap() {
            GeoService.getLocation().then(function (position) {
                console.log('Getting map');
                var mapPosition = new plugin.google.maps.LatLng(position[0], position[1]);
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
                    map.on(plugin.google.maps.event.MAP_READY, onMapInit);
                }, 500);
            }, function (err) {
                console.log(err);
            });
        }

        function onMapInit(map) {
            GeoService.getLocation().then(function (position) {
                var mapPosition = new plugin.google.maps.LatLng(position[0], position[1]);
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
                $rootScope.markers = [];
                $rootScope.map.addEventListener(plugin.google.maps.event.CAMERA_CHANGE, onMapCameraChanged);

                ArenasService.getArenas().then(function () {
                    vm.showDetails = false;
                    addMarkersToMap();
                }, function (err) {
                    console.log(err);
                });

                JogosService.getJogosRegiao().then(function () {
                    vm.showDetails = false;
                    addMarkersToMap();
                }, function (err) {
                    console.log(err);
                });

                //Watch for new items entering the query
                JogosService.geoQuery.on('key_entered', function (key, location, distance) {
                    if (JogosService.geoQueryLoaded) {
                        JogosService.getJogo(key).$loaded().then(function (obj) {
                            JogosService.setMatchOnMarker(obj);
                            addMarkerToMap(key);
                        });
                    }
                });

                ArenasService.geoQuery.on('key_entered', function (key, location, distance) {
                    if (ArenasService.geoQueryLoaded) {
                        ArenasService.getArena(key).$loaded().then(function (obj) {
                            ArenasService.setArenaOnMarker(obj);
                            addMarkerToMap(key);
                        });
                    }
                });
            });
        }

        function addMarkersToMap() {
            $rootScope.markers.map(function (markerData) {
                if (markerData.marker) {
                    markerData.marker.remove();
                }
                var latLng = new plugin.google.maps.LatLng(markerData.latitude, markerData.longitude);
                $timeout(function () {
                    $rootScope.map.addMarker({
                        'position': latLng,
                        'title': markerData.data.nome,
                        'icon': {
                            'url': markerData.icon,
                            'size': {
                                width: 79,
                                height: 48
                            }
                        }
                    }, function (marker) {
                        markerData.marker = marker;
                        markerData.marker.$id = markerData.$id;
                        markerData.marker.addEventListener(plugin.google.maps.event.MARKER_CLICK, onMarkerClicked);
                        $rootScope.map.on('category_change', function (category) {
                            $timeout(function () {
                                markerData.marker.setVisible(markerData[category] ? true : false);
                            }, 100);
                        });
                    });
                });
            });
        }

        function addMarkerToMap(key) {
            var markerData = _.find($rootScope.markers, { '$id': key });
            if (markerData.marker) {
                markerData.marker.remove();
            }
            var latLng = new plugin.google.maps.LatLng(markerData.latitude, markerData.longitude);
            $timeout(function () {
                $rootScope.map.addMarker({
                    'position': latLng,
                    'title': markerData.data.nome,
                    'icon': {
                        'url': markerData.icon,
                        'size': {
                            width: 79,
                            height: 48
                        }
                    }
                }, function (marker) {
                    markerData.marker = marker;
                    markerData.marker.$id = markerData.$id;
                    markerData.marker.addEventListener(plugin.google.maps.event.MARKER_CLICK, onMarkerClicked);
                    $rootScope.map.on('category_change', function (category) {
                        $timeout(function () {
                            markerData.marker.setVisible(marker[category] ? true : false);
                        }, 100);
                    });
                });
            });
        }

        function onMarkerClicked(marker) {
            $location.hash('anchor' + marker.$id);
            $ionicScrollDelegate.anchorScroll(true);
            // $timeout(function () {
            //     vm.showDetails = true;
            //     $ionicSlideBoxDelegate.update();
            // });
        }

        function onMapCameraChanged(position) {
            console.log(position);
        }




        function acharNoMapa(marker) {
            var mapPosition = new plugin.google.maps.LatLng(marker.latitude, marker.longitude);
            marker.marker.showInfoWindow();
            $rootScope.map.animateCamera({
                'target': mapPosition,
                'tilt': 0,
                'zoom': 14,
                'bearing': 0,
                'duration': 500
                // = 2 sec.
            });
        }

        function onSlideChange() {
            $ionicSlideBoxDelegate.update();
        }

        function toggleMarkers() {
            if (vm.filtro.viewArenas) {
                vm.filtro.tipo = 'arena';
                $rootScope.map.trigger('category_change', 'arena');
            }
            else {
                vm.filtro.tipo = 'jogo';
                $rootScope.map.trigger('category_change', 'jogo');
            }
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

        function getLength(obj) {
            if (obj) {
                return Object.keys(obj).length;
            }
        }

    }

} ());
