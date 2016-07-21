/*global Ionic cordova StatusBar firebase*/
/*eslint no-undef: "error"*/

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
  'ngFacebook'
  // TODO: load other modules selected during generation
])

  .run(function ($ionicPlatform, $ionicAnalytics, $state, Ref) {
    firebase.auth().onAuthStateChanged(checkLogin);

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
      if (!currentUser) {
        $state.go('login');
      }
      else {
        $state.go('main.home');
        var providerData = {};
        Ref.child('users/' + currentUser.uid).once('value', function (snap) {
          if (snap.val() === null) {
            providerData = _.find(currentUser.providerData, { 'providerId': 'facebook.com' });
            Ref.child('users/' + currentUser.uid).set({
              nome: providerData.displayName,
              fotoPerfil: providerData.photoURL,
              email: providerData.email
            });
            currentUser.updateProfile({
              displayName: providerData.displayName,
              photoURL: providerData.photoURL
            });
            $state.go('wizard.intro');
          }
          else {
            providerData = _.find(currentUser.providerData, { 'providerId': 'facebook.com' });
            var user = snap.val();
            user.fotoPerfil = providerData.photoURL;
            Ref.child('users/' + currentUser.uid).set(user);
            currentUser.updateProfile({
              displayName: providerData.displayName,
              photoURL: providerData.photoURL
            });
          }
        }, function (errorObject) {
          console.log('The read failed: ' + errorObject.code);
        });
      }
    }
  })

  .config(function ($stateProvider, $urlRouterProvider, tmhDynamicLocaleProvider, $ionicConfigProvider, $facebookProvider) {
    //$ionicConfigProvider.tabs.style('standard');
    //$ionicConfigProvider.tabs.position('top');
    $facebookProvider.setAppId('908423235912952');
    tmhDynamicLocaleProvider.localeLocationPattern('bower_components/angular-locale-pt-br/angular-locale_pt-br.js');

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
          }],
          position: ['GeoService', function (GeoService) {
            return GeoService.getPosition();
          }]
        }
      })
      .state('main.home', {
        url: '/',
        views: {
          'tab-home': {
            templateUrl: 'templates/home.html'
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

      .state('main.jogos', {
        url: '/jogos',
        views: {
          'tab-home': {
            templateUrl: 'templates/jogos.html',
            controller: 'JogosCtrl as vm'
          }
        }
      })

      .state('main.meus-jogos', {
        url: '/meus-jogos',
        views: {
          'tab-home': {
            templateUrl: 'templates/meus-jogos.html',
            controller: 'MeusJogosCtrl as vm'
          }
        }
      })

      .state('main.reservas', {
        url: '/reservas',
        views: {
          'tab-jogos': {
            templateUrl: 'templates/reservas.html',
            controller: 'ReservasCtrl as vm',
          }
        }
      })

      .state('main.grupos', {
        url: '/grupos',
        views: {
          'tab-grupos': {
            templateUrl: 'templates/grupos.html'
          }
        }
      })

      .state('main.perfil', {
        url: '/perfil',
        views: {
          'tab-perfil': {
            templateUrl: 'templates/perfil.html',
            controller: 'PerfilCtrl as vm'
          }
        }
      });
  })

  .controller('MenuCtrl', function ($state, $rootScope, ArenasService, ReservasService, JogosService) {
    var vm = this;
    var hideTabsStates = ['main.arenas', 'main.arenas-detail', 'main.minhas-reservas', 'main.encontrar-jogos'];
    $rootScope.$on('$ionicView.beforeEnter', function () {
      $rootScope.hideTabs = ~hideTabsStates.indexOf($state.current.name);
    });

    ReservasService.getMinhasReservas();
    JogosService.getMeusJogos();
    JogosService.getJogosRegiao();
    ArenasService.getArenas();

    vm.logOut = function () {
      firebase.auth().signOut().then(function () {
        $state.go('login');
      }, function (error) {
        console.log(error);
      });
    };
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
  }]);
