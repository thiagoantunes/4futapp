/*global Ionic cordova StatusBar firebase*/

'use strict';
angular.module('main', [
  'ionic',
  'ngCordova',
  'ui.router',
  'ionic.service.analytics',
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
  'monospaced.elastic'
])

  .run(function ($ionicPlatform, $ionicAnalytics, $state, Ref, $rootScope, UserService, $ionicLoading) {
    firebase.auth().onAuthStateChanged(checkLogin);

    $rootScope.$on('$stateChangeStart', function (event, next) {
      if (next.name == 'main.home') {
        $rootScope.hideTabs = false;
      }
    });

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
      $ionicAnalytics.register();
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

      var deploy = new Ionic.Deploy();
      deploy.watch().then(
        function noop() {
        },
        function noop() {
        },
        function hasUpdate(has) {
          console.log('Has Update ', has);
          if (has) {
            console.log('Calling ionicDeploy.update()');
            deploy.update().then(function (deployResult) {
              console.log(deployResult);
              // deployResult will be true when successfull and
              // false otherwise
            }, function (deployUpdateError) {
              // fired if we're unable to check for updates or if any
              // errors have occured.
              console.log('Ionic Deploy: Update error! ', deployUpdateError);
            }, function (deployProgress) {
              // this is a progress callback, so it will be called a lot
              // deployProgress will be an Integer representing the current
              // completion percentage.
              console.log('Ionic Deploy: Progress... ', deployProgress);
            });
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
        $state.go('main.home');
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
                notificacoes : {
                  confirmacaoPresenca : true,
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
  })

  .config(function ($stateProvider, $urlRouterProvider, tmhDynamicLocaleProvider, $ionicConfigProvider, $facebookProvider, ionicTimePickerProvider, ionicDatePickerProvider, ionGalleryConfigProvider) {
    //$ionicConfigProvider.tabs.style('standard');
    //$ionicConfigProvider.tabs.position('top');
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
    $urlRouterProvider.otherwise('main.home');
    $stateProvider
      // this state is placed in the <ion-nav-view> in the index.html
      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl as vm'
      })

      .state('wizard', {
        url: '/wizard',
        abstract: true,
        template: '<ion-nav-view></ion-nav-view>'
      })

      .state('wizard.intro', {
        url: '/intro',
        templateUrl: 'templates/startup-wizard.html',
        controller: 'StartupCtrl as vm',
        resolve: {
          user: ['UserService', function (UserService) {
            return UserService.getUserProfile(firebase.auth().currentUser.uid);
          }]
        }
      })

      .state('main', {
        url: '/main',
        abstract: true,
        templateUrl: 'templates/tabs.html',
        controller: 'MenuCtrl as menu',
        resolve: {
          currentUser: ['UserService', function (UserService) {
            return UserService.getCurrentUser();
          }]
        }
      })
      //
      //
      //TAB-HOME
      //
      //
      .state('main.home', {
        url: '/?origem',
        views: {
          'tab-home': {
            templateUrl: 'templates/home.html',
            controller: 'HomeCtrl'
          }
        }
      })
      .state('main.arenas', {
        url: '/arenas',
        views: {
          'tab-home': {
            templateUrl: 'templates/arenas/arenas-list.html',
            controller: 'ArenasCtrl as actrl'
          }
        }
      })
      .state('main.arenas-detail', {
        url: '/arenas/:id',
        views: {
          'tab-home': {
            templateUrl: 'templates/arenas/arenas-detail.html',
            controller: 'ArenaDetailsCtrl as vm',
          }
        }
      })

      .state('main.criar-partida-reserva', {
        url: '/criar-partida-reserva',
        views: {
          'tab-home': {
            templateUrl: 'templates/criar-partida.html',
            controller: 'NovaPartidaCtrl as vm',
          }
        }
      })

      .state('main.meus-jogos-detail-reserva', {
        url: '/meus-jogos-reserva/:id',
        views: {
          'tab-home': {
            templateUrl: 'templates/jogos-detail.html',
            controller: 'JogosDetailCtrl as vm',
          }
        }
      })

      .state('main.jogos', {
        url: '/jogos',
        views: {
          'tab-home': {
            templateUrl: 'templates/jogos.html',
            controller: 'JogosCtrl as vm'
          }
        }
      })

      .state('main.jogos-detail', {
        url: '/jogos/:id',
        views: {
          'tab-home': {
            templateUrl: 'templates/jogos-detail.html',
            controller: 'JogosDetailCtrl as vm',
          }
        }
      })

      .state('main.times', {
        url: '/times',
        views: {
          'tab-home': {
            templateUrl: 'templates/times.html',
            controller: 'TimesCtrl as vm',
          }
        }
      })

      .state('main.criarDesafio', {
        url: '/criar-desafio',
        views: {
          'tab-home': {
            templateUrl: 'templates/criar-desafio.html',
            controller: 'CriarDesafioCtrl as vm',
          }
        }
      })

      .state('main.listaJogadores-tab-home', {
        url: '/jogos/lista-jogadores/:tipoLista',
        views: {
          'tab-home': {
            templateUrl: 'templates/lista-jogadores.html',
            controller: 'ListaJogadoresCtrl as vm',
          }
        }
      })

      .state('main.perfilJogador-tab-home', {
        url: '/jogos/perfilJogador/:id',
        views: {
          'tab-home': {
            templateUrl: 'templates/perfil-jogador.html',
            controller: 'PerfilJogadorCtrl as vm',
          }
        }
      })

      .state('main.chat-tab-home', {
        url: 'jogos/chat/:id/:tipoChat',
        views: {
          'tab-home': {
            templateUrl: 'templates/chat-jogador.html',
            controller: 'ChatCtrl as vm',
          }
        }
      })

      //
      //
      //TAB-MEUS-JOGOS
      //
      //

      .state('main.meus-jogos', {
        url: '/meus-jogos',
        views: {
          'tab-meus-jogos': {
            templateUrl: 'templates/meus-jogos.html',
            controller: 'MeusJogosCtrl as vm'
          }
        }
      })

      .state('main.criar-partida', {
        url: '/criar-partida',
        views: {
          'tab-meus-jogos': {
            templateUrl: 'templates/criar-partida.html',
            controller: 'NovaPartidaCtrl as vm',
          }
        }
      })

      .state('main.arenas-detail-partida', {
        url: '/arenas-partida/:id',
        views: {
          'tab-meus-jogos': {
            templateUrl: 'templates/arenas/arenas-detail.html',
            controller: 'ArenaDetailsCtrl as vm',
          }
        }
      })

      .state('main.meus-jogos-detail', {
        url: '/meus-jogos/:id',
        views: {
          'tab-meus-jogos': {
            templateUrl: 'templates/jogos-detail.html',
            controller: 'JogosDetailCtrl as vm',
          }
        }
      })

      .state('main.listaJogadores-tab-meus-jogos', {
        url: '/meus-jogos/lista-jogadores/:tipoLista',
        views: {
          'tab-meus-jogos': {
            templateUrl: 'templates/lista-jogadores.html',
            controller: 'ListaJogadoresCtrl as vm',
          }
        }
      })

      .state('main.perfilJogador-tab-meus-jogos', {
        url: '/meus-jogos/perfilJogador/:id',
        views: {
          'tab-meus-jogos': {
            templateUrl: 'templates/perfil-jogador.html',
            controller: 'PerfilJogadorCtrl as vm',
          }
        }
      })

      .state('main.chat-tab-meus-jogos', {
        url: '/meus-jogos/chat/:id/:tipoChat',
        views: {
          'tab-meus-jogos': {
            templateUrl: 'templates/chat-jogador.html',
            controller: 'ChatCtrl as vm',
          }
        }
      })


      //
      //
      //TAB-MEUS-TIMES
      //
      //

      .state('main.meus-times', {
        url: '/meus-times',
        views: {
          'tab-meus-times': {
            templateUrl: 'templates/meus-times.html',
            controller: 'MeusTimesCtrl as vm',
          }
        }
      })

      .state('main.listaJogadores-tab-meus-times', {
        url: '/lista-jogadores/:tipoLista',
        views: {
          'tab-meus-times': {
            templateUrl: 'templates/lista-jogadores.html',
            controller: 'ListaJogadoresCtrl as vm',
          }
        }
      })

      .state('main.perfilJogador-tab-meus-times', {
        url: '/meus-times/perfilJogador/:id',
        views: {
          'tab-meus-times': {
            templateUrl: 'templates/perfil-jogador.html',
            controller: 'PerfilJogadorCtrl as vm',
          }
        }
      })

      .state('main.chat-tab-meus-times', {
        url: '/meus-times/chat/:id/:tipoChat',
        views: {
          'tab-meus-times': {
            templateUrl: 'templates/chat-jogador.html',
            controller: 'ChatCtrl as vm',
          }
        }
      })


      .state('main.criarTime', {
        url: '/criar-time',
        views: {
          'tab-meus-times': {
            templateUrl: 'templates/criar-time.html',
            controller: 'CriarTimeCtrl as vm',
          }
        }
      })

      //
      //
      //TAB-PERFIL
      //
      //

      .state('main.perfil', {
        url: '/perfil',
        views: {
          'tab-perfil': {
            templateUrl: 'templates/meu-perfil.html',
            controller: 'PerfilCtrl as vm',
            resolve: {
              selectedUser: ['UserService', function (UserService) {
                return UserService.getUserProfile(firebase.auth().currentUser.uid).$loaded();
              }]
            }
          }
        }
      })

      .state('main.seguindoSeguidores', {
        url: '/perfil/seguindo-seguidores',
        views: {
          'tab-perfil': {
            templateUrl: 'templates/seguindo-seguidores.html',
            controller: 'SeguindoSeguidoresCtrl as vm',
          }
        }
      })

      .state('main.config', {
        url: '/perfil/configuracoes',
        views: {
          'tab-perfil': {
            templateUrl: 'templates/configuracoes.html',
            controller: 'ConfigCtrl as vm',
          }
        }
      })

      .state('main.listaJogadores-tab-perfil', {
        url: '/perfil/lista-jogadores/:tipoLista',
        views: {
          'tab-perfil': {
            templateUrl: 'templates/lista-jogadores.html',
            controller: 'ListaJogadoresCtrl as vm',
          }
        }
      })

      .state('main.perfilJogador-tab-perfil', {
        url: '/perfil/meus-times/perfilJogador/:id',
        views: {
          'tab-perfil': {
            templateUrl: 'templates/perfil-jogador.html',
            controller: 'PerfilJogadorCtrl as vm',
          }
        }
      })

      .state('main.chat-tab-perfil', {
        url: '/perfil/meus-times/chat/:id/:tipoChat',
        views: {
          'tab-perfil': {
            templateUrl: 'templates/chat-jogador.html',
            controller: 'ChatCtrl as vm',
          }
        }
      })

      //
      //
      //TAB-NOTIFICACOES
      //
      //

      .state('main.notificacoes', {
        url: '/notificacoes',
        views: {
          'tab-notificacoes': {
            templateUrl: 'templates/notificacoes.html',
            controller: 'NotificacoesCtrl as vm'
          }
        }
      })

      .state('main.perfilJogador-tab-notificacoes', {
        url: '/notificacoes/perfilJogador/:id',
        views: {
          'tab-notificacoes': {
            templateUrl: 'templates/perfil-jogador.html',
            controller: 'PerfilJogadorCtrl as vm',
          }
        }
      })

      .state('main.listaJogadores-tab-notificacoes', {
        url: '/notificacoes/lista-jogadores/:tipoLista',
        views: {
          'tab-notificacoes': {
            templateUrl: 'templates/lista-jogadores.html',
            controller: 'ListaJogadoresCtrl as vm',
          }
        }
      })

      .state('main.chat-tab-notificacoes', {
        url: '/notificacoes/meus-times/chat/:id/:tipoChat',
        views: {
          'tab-notificacoes': {
            templateUrl: 'templates/chat-jogador.html',
            controller: 'ChatCtrl as vm',
          }
        }
      })

      .state('main.meus-jogos-detail-notificacoes', {
        url: '/meus-jogos-notificacoes/:id',
        views: {
          'tab-notificacoes': {
            templateUrl: 'templates/jogos-detail.html',
            controller: 'JogosDetailCtrl as vm',
          }
        }
      });
  })

  .controller('MenuCtrl', function ($state, $window, $rootScope, GeoService, ArenasService, UserService, ReservasService, JogosService, TimesService, $ionicHistory, $cordovaNetwork) {
    var vm = this;
    var hideTabsStates = [
      'main.arenas',
      'main.arenas-detail',
      'main.minhas-reservas',
      'main.encontrar-jogos',
      'main.jogos-detail',
      'main.criar-partida',
      'main.meus-jogos-detail',
      'main.jogos',
      'main.perfilAmigo',
      'main.criar-partida-reserva',
      'main.meus-jogos-detail-reserva',
      'main.arenas-detail-partida',
      'main.criarDesafio',
      'main.times',
      'main.criarTime',
      'main.meus-jogos-detail-notificacoes',
      'main.perfilJogador-tab-meus-times',
      'main.perfilJogador-tab-notificacoes',
      'main.listaJogadores-tab-notificacoes',
      'main.listaJogadores-tab-meus-times',
      'main.listaJogadores-tab-perfil',
      'main.perfilJogador-tab-perfil',
      'main.listaJogadores-tab-meus-jogos',
      'main.perfilJogador-tab-meus-jogos',
      'main.perfilJogador-tab-home',
      'main.listaJogadores-tab-home',
      'main.chat-tab-perfil',
      'main.chat-tab-notificacoes',
      'main.chat-tab-meus-times',
      'main.chat-tab-meus-jogos',
      'main.chat-tab-home'
    ];
    $rootScope.$on('$ionicView.beforeEnter', function () {
      $rootScope.hideTabs = ~hideTabsStates.indexOf($state.current.name);
    });


    if (window.cordova) {
      if ($cordovaNetwork.isOffline()) {
        $window.alert('Voce está offline');
      }

      // listen for Online event
      $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
        $window.alert('Sem conexão com a internet.');
      });

      // listen for Offline event
      $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
        //$window.alert('Voce está offline');
      });
    }

    GeoService.getPosition().then(function(){
      JogosService.getJogosRegiao();
      ArenasService.getArenas();
      TimesService.getTimesRegiao();
    });

    ReservasService.getMinhasReservas();
    JogosService.getMeusJogos();
    UserService.getMeusAmigos();
    UserService.getNotificacoes();
    TimesService.getMeusTimes();

    UserService.notificacoesNaoLidas.$loaded().then(function (val) {
      vm.notificacoes = UserService.notificacoesNaoLidas;
    });

    vm.logOut = function () {
      firebase.auth().signOut().then(function () {
        $state.go('login');
      }, function (error) {
        console.log(error);
      });
    };

  })


  .controller('HomeCtrl', function ($scope, $stateParams, $state) {

    if ($stateParams.origem == 'reservas') {
      $state.go('main.arenas');
    }

  })

  .config(function (uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      //    key: 'your api key',
      v: '3.20', //defaults to latest 3.X anyhow
      libraries: 'weather,geometry,visualizazzzztion'
    });
  })

  .config(['uiGmapGoogleMapApiProvider', function (GoogleMapApiProviders) {
    GoogleMapApiProviders.configure({
      brazil: true
    });
  }])

  .filter('defaultImage', function () {
    return function (input, param) {
      if (!input) {
        return 'img/avatar_placeholder.jpg';
      }
      return input;
    };
  })

  .filter('tel', function () {
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
  });
