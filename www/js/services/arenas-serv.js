(function () {
    'use strict';
    angular.module('main')
        .factory('ArenasService', ArenasService)
        .factory('GeoService', GeoService)
        .factory('SmsVerify', SmsVerify);

    ArenasService.$inject = ['Ref', '$timeout', '$rootScope', '$firebaseArray', '$firebaseObject', '$q', '$location', '$ionicScrollDelegate'];
    GeoService.$inject = ['$q', '$rootScope', '$ionicPlatform', 'ArenasService', 'JogosService', 'TimesService', '$window', '$timeout'];
    SmsVerify.$inject = ['$resource'];

    function ArenasService(Ref, $timeout, $rootScope, $firebaseArray, $firebaseObject, $q, $location, $ionicScrollDelegate) {
        var service = {
            geoQueryLoaded: false,
            ref: Ref.child('arenas'),
            refArenaBasica: Ref.child('arenasBasicas'),
            arenasMap: {},
            arenas: [],
            arenasBasicas: [],
            geoFire: new GeoFire(Ref.child('arenasLocalizacao')),
            geoArenaBasica: new GeoFire(Ref.child('arenasBasicasLocalizacao')),
            geoQuery: {},
            geoArenasBasicasQuery: {},

            getArenas: getArenas,
            getArena: getArena,
            getQuadrasArena: getQuadrasArena,
            getAlbum: getAlbum,
            getEstrutura: getEstrutura,
            getArenasBasicas: getArenasBasicas,
            criaArenaBasica: criaArenaBasica,
            getQuadraArena: getQuadraArena,
            getArenaLocation: getArenaLocation,
            onMarkerClicked: onMarkerClicked,
            arenaSelecionada: null
        };

        return service;

        function getArenas() {
            var deferred = $q.defer();

            service.geoQuery.on('key_entered', function (key, location, distance) {
                var existingMarker = _.find($rootScope.markers, { '$id': key });
                if (existingMarker) {
                    existingMarker.distance = distance;
                    existingMarker.latitude = location[0];
                    existingMarker.longitude = location[1];
                }
                else {
                    $rootScope.markers.push({
                        $id: key,
                        distance: distance,
                        latitude: location[0],
                        longitude: location[1],
                        icon: 'www/img/pin.png',
                        todos: true,
                        arena: true
                    });
                }
                if (service.geoQueryLoaded) {
                    getJogo(key).$loaded().then(function (obj) {
                        setMatch(obj);
                        addMarkerToMap(key);
                    });
                }
            });

            service.geoQuery.on("key_exited", function (key, location, distance) {
                _.remove($rootScope.markers, { '$id': key });
                var arenaMarker = _.find($rootScope.markers, { $id: key });
                if (arenaMarker) {
                    arenaMarker.marker.remove();
                }
            });

            service.geoQuery.on('ready', function () {
                onFirstLoadReady();
            });

            function onFirstLoadReady() {
                service.geoQueryLoaded = true;

                var promises = [];
                _.forEach($rootScope.markers, function (a) {
                    var promise = getArena(a.$id).$loaded();
                    promises.push(promise);
                });
                $q.all(promises).then(function (requests) {
                    _.forEach(requests, function (arena) {
                        setArena(arena);
                    });
                    addMarkersToMap();
                    deferred.resolve();
                });

            }

            function setArena(arena) {
                var marker = _.find($rootScope.markers, { $id: arena.$id });
                marker.data = arena;
            }

            function addMarkersToMap() {
                $rootScope.markers.map(function (markArena) {
                    if (markArena.marker) {
                        markArena.marker.remove();
                    }
                    var latLng = new plugin.google.maps.LatLng(markArena.latitude, markArena.longitude);
                    $timeout(function () {
                        $rootScope.map.addMarker({
                            'position': latLng,
                            'title': markArena.data.nome,
                            'icon': {
                                'url': markArena.icon,
                                'size': {
                                    width: 79,
                                    height: 48
                                }
                            }
                        }, function (marker) {
                            markArena.marker = marker;
                            $rootScope.map.on('category_change', function (category) {
                                $timeout(function () {
                                    markArena.marker.setVisible(marker[category] ? true : false);
                                }, 100);
                            });
                        });
                    });
                });
            }

            function addMarkerToMap(key) {
                var markArena = _.find($rootScope.markers, { '$id': key });
                if (markArena.marker) {
                    markArena.marker.remove();
                }
                var latLng = new plugin.google.maps.LatLng(markArena.latitude, markArena.longitude);
                $timeout(function () {
                    $rootScope.map.addMarker({
                        'position': latLng,
                        'title': markArena.data.nome,
                        'icon': {
                            'url': markArena.icon,
                            'size': {
                                width: 79,
                                height: 48
                            }
                        }
                    }, function (marker) {
                        markArena.marker = marker;
                        $rootScope.map.on('category_change', function (category) {
                            $timeout(function () {
                                markArena.marker.setVisible(marker[category] ? true : false);
                            }, 100);
                        });
                    });
                });
            }


            return deferred.promise;

        }

        function onMarkerClicked(marker) {
            $location.hash('anchor' + marker.$id);
            $ionicScrollDelegate.anchorScroll(true);
        }

        function getArena(id) {
            return $firebaseObject(service.ref.child(id));
        }

        function getQuadrasArena(arena) {
            return $firebaseArray(Ref.child('arenasQuadras/' + arena));
        }

        function getQuadraArena(arenaId, quadraId) {
            return $firebaseObject(Ref.child('arenasQuadras/' + arenaId + '/' + quadraId));
        }

        function getArenaLocation(arenaId) {
            return $firebaseObject(Ref.child('arenasLocalizacao/' + arenaId));
        }

        function getAlbum(arena) {
            return $firebaseArray(Ref.child('arenasAlbuns/' + arena));
        }

        function getEstrutura(arena) {
            return $firebaseArray(Ref.child('arenasEstrutura/' + arena).orderByChild('ativo').startAt(true).endAt(true));
        }

        function criaArenaBasica(nomeLocal, coords, endereco) {
            var deferred = $q.defer();
            var key = service.refArenaBasica.push().key;
            service.refArenaBasica.child(key).set({
                endereco: endereco,
                nome: nomeLocal
            }).then(function () {
                service.geoArenaBasica.set(key, coords).then(function () {
                    deferred.resolve(key);
                }, function (error) {
                    deferred.reject('Erro ao cadastrar novo local');
                });
            });

            return deferred.promise;
        }

        function getArenasBasicas() {
            service.geoArenasBasicasQuery.on('key_entered', function (key, location, distance) {
                service.refArenaBasica.child(key).once('value').then(function (snapshot) {
                    if (snapshot.val()) {
                        var arena = snapshot.val();
                        arena.$id = key;
                        arena.latitude = location[0];
                        arena.longitude = location[1];
                        $timeout(function () {
                            _.remove(service.arenasBasicas, { '$id': key });
                            service.arenasBasicas.push(arena);
                        });
                    }
                });
            });
        }

    }

    function GeoService($q, $rootScope, $ionicPlatform, ArenasService, JogosService, TimesService, $window, $timeout) {
        var service = {
            position: [],

            getLocation: getLocation,
            navigateTo: navigateTo,
            initMap: initMap,
            onMapCameraChanged: onMapCameraChanged
        };

        return service;

        function getLocation() {
            var deferred = $q.defer();

            //isLocationAvailable();

            service.position = [-19.872510, -43.930562];
            setGeoQuery(service.position);
            deferred.resolve(service.position);

            function isLocationAvailable() {
                console.log('Getting location');
                cordova.plugins.diagnostic.isLocationAvailable(function (available) {
                    if (available) {
                        console.log('Location available');
                        doGetLocation();
                    }
                    else {
                        console.log('Location not available');
                        isLocationAuthorized();
                    }
                }, function (err) {
                    deferred.reject(err);
                });
            }

            function doGetLocation() {

                console.log('Actually Getting location');
                //var posOptions = { timeout: 30000, maximumAge: 5 * 60 * 1000 };
                navigator.geolocation.getCurrentPosition(function (position) {
                    service.position = [position.coords.latitude, position.coords.longitude];
                    setGeoQuery(service.position);
                    watchPosition();
                    deferred.resolve(service.position);
                }, function (err) {
                    deferred.reject(err);
                });
            }

            function isLocationAuthorized() {
                cordova.plugins.diagnostic.isLocationAuthorized(function (authorized) {
                    if (authorized) {
                        console.log('Location authorized');
                        isLocationEnabled();
                    }
                    else {
                        console.log('Location not authorized');
                        requestLocationAuthorization();
                    }
                }, function (err) {
                    deferred.reject(err);
                });
            }

            function isLocationEnabled() {
                cordova.plugins.diagnostic.isLocationEnabled(function (enabled) {
                    if (enabled) {
                        doGetLocation();
                    }
                    else {
                        cordova.plugins.locationAccuracy.request(function (success) {
                            isLocationAvailable();
                        }, function (err) {
                            deferred.reject(err);
                        });
                    }
                }, function (err) {
                    deferred.reject(err);
                });
            }

            function requestLocationAuthorization() {
                console.log('Requesting location');
                cordova.plugins.diagnostic.requestLocationAuthorization(function (status) {
                    switch (status) {
                        case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
                            isLocationAvailable();
                            break;
                        case cordova.plugins.diagnostic.permissionStatus.GRANTED:
                            isLocationAvailable();
                            break;
                        case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
                            isLocationAvailable();
                            break;
                        case cordova.plugins.diagnostic.permissionStatus.DENIED:
                            deferred.reject('Permission denied');
                            break;
                        case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
                            eferred.reject('Permission permanently denied');
                            break;
                    }
                }, function (err) {
                    deferred.reject(err);
                });
            }

            function setGeoQuery(position) {
                ArenasService.geoQuery = ArenasService.geoFire.query({
                    center: position,
                    radius: 100
                });

                ArenasService.geoArenasBasicasQuery = ArenasService.geoArenaBasica.query({
                    center: position,
                    radius: 100
                });

                JogosService.geoQuery = JogosService.geoFire.query({
                    center: position,
                    radius: 100
                });

                TimesService.geoQuery = TimesService.geoFire.query({
                    center: position,
                    radius: 100
                });
            }

            function watchPosition() {
                navigator.geolocation.watchPosition(function (position) {
                    service.position = [position.coords.latitude, position.coords.longitude];
                    if (!_.isEmpty(ArenasService.geoQuery)) {
                        ArenasService.geoQuery.updateCriteria({
                            center: service.position,
                            radius: 100
                        });
                    }

                    if (!_.isEmpty(ArenasService.geoArenasBasicasQuery)) {
                        ArenasService.geoArenasBasicasQuery.updateCriteria({
                            center: service.position,
                            radius: 100
                        });
                    }

                    if (!_.isEmpty(TimesService.geoQuery)) {
                        TimesService.geoQuery.updateCriteria({
                            center: service.position,
                            radius: 100
                        });
                    }

                    if (!_.isEmpty(JogosService.geoQuery)) {
                        JogosService.geoQuery.updateCriteria({
                            center: service.position,
                            radius: 100
                        });
                    }
                }, function (err) {
                    deferred.reject(err);
                    console.log(err);
                });
            }

            return deferred.promise;
        }

        function initMap(div) {
            console.log('Getting map');
            var mapPosition = new plugin.google.maps.LatLng(service.position[0], service.position[1]);
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
                var map = plugin.google.maps.Map.getMap(div, mapParams);
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
                    $rootScope.markers = [];
                    ArenasService.getArenas();
                    JogosService.getJogosRegiao();
                    $rootScope.map.addEventListener(plugin.google.maps.event.CAMERA_CHANGE, service.onMapCameraChanged);
                });
            }, 500);
        }

        function onMapCameraChanged(position) {
            console.log(position);
        }

        function navigateTo(endereco) {
            launchnavigator.isAppAvailable(launchnavigator.APP.WAZE, function (isAvailable) {
                var app;
                if (isAvailable) {
                    app = launchnavigator.APP.WAZE;
                } else {
                    console.warn("Google Maps not available - falling back to user selection");
                    app = launchnavigator.APP.USER_SELECT;
                }
                launchnavigator.navigate(endereco, {
                    app: app
                });
            });
        }

    }

    function SmsVerify($resource) {

        var serviceBase = 'http://rdqapi.azurewebsites.net/api/';

        return $resource(serviceBase + 'twofactorverification/', {}, {
            query: { method: 'POST' },
            numberVerify: {
                url: serviceBase + 'twofactorverification/NumberVerify',
                method: 'POST',
            },
            numberVerifyCheck: {
                url: serviceBase + 'twofactorverification/NumberVerifyCheck',
                method: 'POST',
            }
        });
    }
} ());
