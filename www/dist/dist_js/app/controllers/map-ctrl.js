/*jshint loopfunc: true */
(function () {
    'use strict';
    angular.module('main')
        .controller('MapCtrl', MapCtrl);

    MapCtrl.$inject = ['$scope', '$rootScope', '$timeout', 'ArenasService', 'JogosService', '$ionicHistory', '$window', 'GeoService', '$ionicSideMenuDelegate', '$ionicModal', '$ionicSlideBoxDelegate', '$location', '$ionicScrollDelegate', '$q', '$ionicLoading'];

    function MapCtrl($scope, $rootScope, $timeout, ArenasService, JogosService, $ionicHistory, $window, GeoService, $ionicSideMenuDelegate, $ionicModal, $ionicSlideBoxDelegate, $location, $ionicScrollDelegate, $q, $ionicLoading) {
        var vm = this;
        vm.arenaService = ArenasService;
        vm.jogosService = JogosService;
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
        vm.criarPartida = criarPartida;

        activate();

        function activate() {
            vm.showDetails = true;
            vm.showTipoMapa = false;
            $ionicSlideBoxDelegate.update();

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
                //$rootScope.map.setMyLocationEnabled(true);
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
                $rootScope.map.addEventListener(plugin.google.maps.event.MAP_CLICK, onMapClick);

                var promises = [ArenasService.getArenas(), JogosService.getJogosRegiao()];
                $q.all(promises).then(function (requests) {
                    vm.showDetails = false;
                    JogosService.geoQueryLoaded = true;
                    ArenasService.geoQueryLoaded = true;
                    addMarkersToMap();
                });

                //Watch for new items entering the query
                JogosService.geoQuery.on('key_entered', function (key, location, distance) {
                    if (JogosService.geoQueryLoaded) {
                        JogosService.getJogo(key).$loaded().then(function (obj) {
                            JogosService.setMatchOnMarker(obj);
                            var markerData = _.find($rootScope.markers, { '$id': key });
                            addMarkerToMap(markerData);
                        });
                    }
                });

                ArenasService.geoQuery.on('key_entered', function (key, location, distance) {
                    if (ArenasService.geoQueryLoaded) {
                        ArenasService.getArena(key).$loaded().then(function (obj) {
                            ArenasService.setArenaOnMarker(obj);
                            var markerData = _.find($rootScope.markers, { '$id': key });
                            addMarkerToMap(markerData);
                        });
                    }
                });
            });
        }

        function addMarkersToMap() {
            $rootScope.markers.map(function (markerData) {
                addMarkerToMap(markerData);
            });
        }

        function addMarkerToMap(markerData) {
            if (markerData.marker) {
                markerData.marker.remove();
            }
            if (markerData.jogo) {
                var samePlaces = _.filter($rootScope.markers, function (val) {
                    if (val.jogo && val.data) {
                        return val.data.local.id == markerData.data.local.id;
                    }
                });
                if (samePlaces.length > 1) {
                    markerData.icon = 'www/img/pin-jogos-multiple.png';
                    markerData.multiple = true;
                }
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
                    markerData.marker.multiple = markerData.multiple;
                    markerData.marker.addEventListener(plugin.google.maps.event.MARKER_CLICK, onMarkerClicked);
                    $rootScope.map.on('category_change', function (category) {
                        $timeout(function () {
                            markerData.marker.setVisible(markerData[category] ? true : false);
                        });
                    });

                    var totalMarkers = _.filter($rootScope.markers, function (val) { return val.marker; }).length;
                    if (totalMarkers === $rootScope.markers.length) {
                        vm.filtro = {
                            tipo: 'arena'
                        };
                        vm.showTipoMapa = true;
                        vm.arenasView = true;
                        $rootScope.map.trigger('category_change', vm.filtro.tipo);
                    }
                });
            });
        }

        function onMarkerClicked(marker) {
            if (marker.multiple) {
                alert('Abrir modal');
            }
            else {
                $timeout(function () {
                    if (!vm.showDetails) {
                        vm.showDetails = true;
                        $ionicSlideBoxDelegate.update();
                    }
                    var filteredList = _.filter($rootScope.markers, function (val) {
                        return val[vm.filtro.tipo];
                    });
                    var orderedList = _.orderBy(filteredList, ['distance'], ['asc']);
                    var index = _.findIndex(orderedList, function (val) {
                        return val.$id == marker.$id;
                    });
                    $ionicSlideBoxDelegate.slide(index);
                });
            }
        }

        function onMapCameraChanged(position) {
        }

        function onMapClick() {
            $timeout(function () {
                vm.showDetails = false;
            });
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
            var index = $ionicSlideBoxDelegate.currentIndex();
            var filteredList = _.filter($rootScope.markers, function (val) {
                return val[vm.filtro.tipo];
            });
            var orderedList = _.orderBy(filteredList, ['distance'], ['asc']);
            var marker = orderedList[index];
            acharNoMapa(marker);
            if(index === filteredList.length){
                $ionicSlideBoxDelegate.slide(0);
            }
            $ionicSlideBoxDelegate.update();
        }

        function toggleMarkers(tipo) {
            vm.filtro.tipo = tipo;
            vm.showDetails = false;
            $rootScope.map.trigger('category_change', tipo);
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

        function criarPartida() {
            vm.jogosService.novaPartida = { data:{} };
            $ionicLoading.show({ template: 'Carregando...' });
        }

    }

} ());
