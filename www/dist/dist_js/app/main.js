/*global Ionic cordova StatusBar firebase*/
(function () {
    'use strict';
    var configFb = {
        apiKey: "AIzaSyCMgDkKuk3uMRhfIhcWTCgaCmOAqhDOoIY",
        authDomain: "rdqdb-a9419.firebaseapp.com",
        databaseURL: "https://rdqdb-a9419.firebaseio.com",
        storageBucket: "rdqdb-a9419.appspot.com",
    };

    // Initialize the FirebaseUI Widget using Firebase.
    firebase.initializeApp(configFb);
    angular
        .module('main', [
            'ionic',
            'ionic.cloud',
            'ngCordova',
            'templates',
            'ui.router',
            //'ionic.service.analytics',
            'firebase',
            'uiGmapgoogle-maps',
            'aCarousel',
            'tmh.dynamicLocale',
            'ionic.wizard',
            'rzModule',
            'ionic-material',
            'ionMdInput',
            'ion-gallery',
            'ngCordovaOauth',
            'ngFacebook',
            'ionic-timepicker',
            'ionic-numberpicker',
            'ionic-datepicker',
            'ionic-cache-src',
            'ngResource',
            'ui.utils.masks',
            'angularMoment',
            'monospaced.elastic',
            'angular-svg-round-progress',
            'angular-toArrayFilter'
        ])
        .run(run)
        .config(config)

        .factory('Ref', Ref)
        .filter('defaultImage', defaultImage)
        .filter('tel', tel);

    run.$inject = ['$ionicPlatform', '$state', 'Ref', '$rootScope', 'UserService', '$ionicLoading', '$ionicDeploy'];
    config.$inject = ['$stateProvider', '$urlRouterProvider', '$ionicCloudProvider', 'tmhDynamicLocaleProvider', '$ionicConfigProvider', '$facebookProvider', 'ionicTimePickerProvider', 'ionicDatePickerProvider', 'ionGalleryConfigProvider', 'uiGmapGoogleMapApiProvider'];

    function run($ionicPlatform, $state, Ref, $rootScope, UserService, $ionicLoading, $ionicDeploy) {
        firebase.auth().onAuthStateChanged(checkLogin);

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            console.log(error);
        });

        $ionicPlatform.onHardwareBackButton(function () {
            console.log('back button');
        });

        // if (window.cordova) {
        //   AndroidFullScreen.showUnderStatusBar(function (){
        //     $rootScope.underStatusBar = true;
        //     console.info("showUnderStatusBar");
        //   }, function(){
        //     console.error(error);
        //   });

        //   AndroidFullScreen.immersiveWidth(function(height){
        //     console.log(height);
        //   }, function(){
        //     console.error(error);
        //   });
        // }

        $ionicPlatform.ready(function () {
            //$ionicAnalytics.register();
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);

            }
            if (window.StatusBar) {
                StatusBar.overlaysWebView(true);
                StatusBar.styleLightContent();
                //StatusBar.styleDefault();
            }

            $ionicDeploy.check().then(function (snapshotAvailable) {
                if (snapshotAvailable) {
                    $ionicDeploy.download().then(function () {
                        return $ionicDeploy.extract().then(function () {
                            $ionicDeploy.load();
                        });
                    }, function (err) {
                        console.log(err);
                    });

                    // $ionicDeploy.getVersions().then(function(snapshots) {
                    //     _.forEach(snapshots, function(snap) {
                    //         window.alert(snap);
                    //     });
                    // });
                }
            });

        }).then(function () {
            if (window.cordova) {
                navigator.splashscreen.hide();
            }
        });

        // Load the facebook SDK asynchronously
        (function () {
            // If we've already installed the SDK, we're done
            if (document.getElementById('facebook-jssdk')) { return; }

            // Get the first script element, which we'll use to find the parent node
            var firstScriptElement = document.getElementsByTagName('script')[0];

            // Create a new script element and set its id
            var facebookJS = document.createElement('script');
            facebookJS.id = 'facebook-jssdk';

            // Set the new script's source to the source of the Facebook JS SDK
            facebookJS.src = '//connect.facebook.net/en_US/all.js';

            // Insert the Facebook JS SDK into the DOM
            firstScriptElement.parentNode.insertBefore(facebookJS, firstScriptElement);
        } ());

        function checkLogin(currentUser) {
            $ionicLoading.show({ template: 'Carregando...' });
            if (!currentUser) {
                $ionicLoading.hide();
                $state.go('login');
            }
            else {
                $state.go('app.map');
                var providerData = {};
                Ref.child('users/' + currentUser.uid).once('value', function (snap) {
                    $ionicLoading.hide();
                    if (snap.val() === null || !snap.val().usuarioComum) {
                        providerData = _.find(currentUser.providerData, { 'providerId': 'facebook.com' });
                        console.log(providerData);
                        Ref.child('users/' + currentUser.uid).set({
                            nome: providerData.displayName,
                            fotoPerfil: providerData.photoURL,
                            email: providerData.email,
                            usuarioComum: true
                        }, function () {
                            UserService.refConfig.child(currentUser.uid).set({
                                notificacoes: {
                                    confirmacaoPresenca: true,
                                    convitePartida: true,
                                    solicitacaoAmizade: true,
                                    promocoesProximas: true,
                                    partidasProximas: true
                                }
                            });
                            UserService.setLocalizacaoJogador(currentUser.uid);
                        });
                        currentUser.updateProfile({
                            displayName: providerData.displayName,
                            photoURL: providerData.photoURL
                        });
                    }
                    else {
                        providerData = _.find(currentUser.providerData, { 'providerId': 'facebook.com' });
                        console.log(providerData);
                        var user = snap.val();
                        user.fotoPerfil = providerData.photoURL;
                        Ref.child('users/' + currentUser.uid).set(user, function () {
                            UserService.setLocalizacaoJogador(currentUser.uid);
                        });
                        currentUser.updateProfile({
                            displayName: providerData.displayName,
                            photoURL: providerData.photoURL,
                        });
                    }
                }, function (errorObject) {
                    $ionicLoading.hide();
                    console.log('The read failed: ' + errorObject.code);
                });
            }
        }
    }

    function config($stateProvider, $urlRouterProvider, $ionicCloudProvider, tmhDynamicLocaleProvider, $ionicConfigProvider, $facebookProvider, ionicTimePickerProvider, ionicDatePickerProvider, ionGalleryConfigProvider, uiGmapGoogleMapApiProvider) {
        //$ionicConfigProvider.tabs.style('standard');
        //$ionicConfigProvider.tabs.position('top');
        // GoogleMapApiProviders.configure({
        //   brazil: true
        // });
        $ionicCloudProvider.init({
            'core': {
                'app_id': '2666a895'
            },
            'push': {
                'sender_id': 'AIzaSyAfkQ7QG4LY6w0x5XNKzvu1VRiGOVyOxCY',
                'pluginConfig': {
                    'ios': {
                        'badge': true,
                        'sound': true
                    },
                    'android': {
                        'iconColor': '#343434'
                    }
                }
            }
        });

        uiGmapGoogleMapApiProvider.configure({
            //    key: 'your api key',
            v: '3.20', //defaults to latest 3.X anyhow
            libraries: 'weather,geometry,visualizazzzztion'
        });

        $facebookProvider.setAppId('1834143436814148');
        tmhDynamicLocaleProvider.localeLocationPattern('bower_components/angular-locale-pt-br/angular-locale_pt-br.js');

        var timePickerObj = {
            inputTime: (((new Date()).getHours() * 60 * 60)),
            format: 24,
            step: 15,
            setLabel: 'Ok',
            closeLabel: 'Fechar'
        };
        ionicTimePickerProvider.configTimePicker(timePickerObj);

        var datePickerObj = {
            inputDate: new Date(),
            setLabel: 'Set',
            todayLabel: 'Hoje',
            closeLabel: 'Fechar',
            mondayFirst: false,
            weeksList: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"],
            monthsList: ["Jan", "Fev", "Mar", "Abr", "Mai", "Junh", "Julh", "Ago", "Set", "Out", "Nov", "Dez"],
            templateType: 'modal',
            from: new Date(),
            to: new Date(2018, 8, 1),
            showTodayButton: true,
            dateFormat: 'dd/MM/yyyy',
            closeOnSelect: true
        };
        ionicDatePickerProvider.configDatePicker(datePickerObj);

        ionGalleryConfigProvider.setGalleryConfig({
            action_label: 'Fechar',
            // template_gallery: 'gallery.html',
            // template_slider: 'slider.html',
            // toggle: false,
            row_size: 2,
            fixed_row_size: true
        });

        // ROUTING with ui.router
        //$urlRouterProvider.otherwise('/login');
        //$urlRouterProvider.otherwise('main.home');
        $urlRouterProvider.otherwise('app.map');
        $stateProvider
            // this state is placed in the <ion-nav-view> in the index.html
            .state('login', {
                url: '/login',
                templateUrl: 'login.html',
                controller: 'LoginCtrl as vm'
            })

            .state('wizard', {
                url: '/wizard',
                abstract: true,
                template: '<ion-nav-view></ion-nav-view>'
            })

            .state('wizard.intro', {
                url: '/intro',
                templateUrl: 'startup-wizard.html',
                controller: 'StartupCtrl as vm',
                resolve: {
                    user: ['UserService', function (UserService) {
                        return UserService.getUserProfile(firebase.auth().currentUser.uid);
                    }]
                }
            })



            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'menu.html',
                controller: 'MenuCtrl as menu',
                resolve: {
                    currentUser: ['UserService', function (UserService) {
                        return UserService.getCurrentUser();
                    }]
                }
            })

            .state('app.map', {
                url: '/map',
                views: {
                    'menuContent': {
                        templateUrl: 'map.html',
                        controller: 'MapCtrl as vm'
                    }
                }
            })

            .state('app.notificacoes', {
                url: '/notificacoes',
                views: {
                    'menuContent': {
                        templateUrl: 'notificacoes.html',
                        controller: 'NotificacoesCtrl as vm'
                    }
                }
            })

            .state('app.meus-jogos', {
                url: '/meus-jogos',
                views: {
                    'menuContent': {
                        templateUrl: 'meus-jogos.html',
                        controller: 'MeusJogosCtrl as vm'
                    }
                }
            })

            .state('app.meus-times', {
                url: '/meus-times',
                views: {
                    'menuContent': {
                        templateUrl: 'meus-times.html',
                        controller: 'MeusTimesCtrl as vm',
                    }
                }
            })

            .state('app.minhas-reservas', {
                url: '/minhas-reservas',
                views: {
                    'menuContent': {
                        templateUrl: 'minhas-reservas.html',
                        controller: 'MeusJogosCtrl as vm',
                    }
                }
            })

            .state('app.seguindoSeguidores', {
                url: '/seguindo-seguidores',
                views: {
                    'menuContent': {
                        templateUrl: 'seguindo-seguidores.html',
                        controller: 'SeguindoSeguidoresCtrl as vm',
                    }
                }
            })

            .state('app.mensagens', {
                url: '/mensagens',
                views: {
                    'menuContent': {
                        templateUrl: 'lista-chats.html',
                        controller: 'ChatsListCtrl as vm',
                    }
                }
            })

            .state('app.config', {
                url: '/configuracoes',
                views: {
                    'menuContent': {
                        templateUrl: 'configuracoes.html',
                        controller: 'ConfigCtrl as vm',
                    }
                }
            })



            .state('app.detalhes-jogo', {
                url: '/jogos/:id',
                views: {
                    'menuContent': {
                        templateUrl: 'jogos-detail.html',
                        controller: 'JogosDetailCtrl as vm',
                    }
                }
            })

            .state('app.detalhes-arena', {
                url: '/arenas/:id',
                views: {
                    'menuContent': {
                        templateUrl: 'arenas-detail.html',
                        controller: 'ArenaDetailsCtrl as vm',
                    }
                }
            })

            .state('app.detalhes-jogador', {
                url: '/perfilJogador/:id',
                views: {
                    'menuContent': {
                        templateUrl: 'perfil-jogador.html',
                        controller: 'PerfilJogadorCtrl as vm',
                    }
                }
            })



            .state('app.criar-partida', {
                url: '/criar-partida',
                views: {
                    'menuContent': {
                        templateUrl: 'criar-partida.html',
                        controller: 'NovaPartidaCtrl as vm',
                    }
                }
            })

            .state('app.criar-time', {
                url: '/criar-time',
                views: {
                    'menuContent': {
                        templateUrl: 'criar-time.html',
                        controller: 'CriarTimeCtrl as vm',
                    }
                }
            })



            .state('app.chat', {
                url: '/chat/:id/:tipoChat',
                views: {
                    'menuContent': {
                        templateUrl: 'chat.html',
                        controller: 'ChatCtrl as vm',
                    }
                }
            })

            .state('app.listaJogadores', {
                url: '/lista-jogadores/:tipoLista',
                views: {
                    'menuContent': {
                        templateUrl: 'lista-jogadores.html',
                        controller: 'ListaJogadoresCtrl as vm',
                    }
                }
            });
    }

    function Ref() {
        return firebase.database().ref();
    }

    function defaultImage() {
        return function (input, param) {
            if (!input) {
                return 'img/avatar_placeholder.jpg';
            }
            return input;
        };
    }

    function tel() {
        return function (tel) {
            console.log(tel);
            if (!tel) { return ''; }

            var value = tel.toString().trim().replace(/^\+/, '');

            if (value.match(/[^0-9]/)) {
                return tel;
            }

            var country, city, number;

            switch (value.length) {
                case 1:
                case 2:
                case 3:
                    city = value;
                    break;

                default:
                    city = value.slice(0, 2);
                    number = value.slice(3);
            }

            if (number) {
                if (number.length > 8) {
                    number = number.slice(0, 5) + '-' + number.slice(5, 9);
                }
                else if (number.length > 7) {
                    number = number.slice(0, 4) + '-' + number.slice(4, 8);
                }
                else {
                    number = number;
                }

                return ("(" + city + ") " + number).trim();
            }
            else {
                return "(" + city;
            }

        };
    }

} ());

