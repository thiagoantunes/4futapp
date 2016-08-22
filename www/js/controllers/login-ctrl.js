/*global firebase firebaseui _*/
'use strict';
angular.module('main')
  .controller('LoginCtrl', function ($state, $facebook, Ref, $ionicPlatform, $cordovaOauth, $ionicLoading, $window) {
    var vm = this;
    vm.facebookLogin = facebookLogin;
    vm.googleLogin = googleLogin;

    activate();

    function activate() {
    }

    function facebookLogin() {
      $ionicLoading.show({ template: 'Carregando...' });
      if (window.cordova) {
        // $ionicPlatform.ready(function () {
        //   $cordovaOauth.facebook('1834143436814148', ['email', 'user_friends', 'public_profile']).then(function (result) {
        //     var provider = new firebase.auth.FacebookAuthProvider();
        //     provider.addScope('user_friends');
        //     provider.addScope('email');
        //     provider.addScope('public_profile');
        //     var credential = firebase.auth.FacebookAuthProvider.credential(result.access_token);
        //     firebase.auth().signInWithCredential(credential).then(function () {
        //       $ionicLoading.hide();
        //     });
        //   }, function (error) {
        //     $ionicLoading.hide();
        //     $window.alert('Ops! Ocorreu um erro ao entrar no Rei da Quadra');
        //     console.log("Error -> " + error);
        //   });
        // });
        facebookConnectPlugin.login(['email', 'user_friends', 'public_profile'], function (result) {
          var provider = new firebase.auth.FacebookAuthProvider();
          provider.addScope('user_friends');
          provider.addScope('email');
          provider.addScope('public_profile');
          var credential = firebase.auth.FacebookAuthProvider.credential(result.authResponse.accessToken);
          firebase.auth().signInWithCredential(credential).then(function () {
            $ionicLoading.hide();
          });
        }, function (error) {
          $ionicLoading.hide();
          $window.alert('Ops! Ocorreu um erro ao entrar no Rei da Quadra');
          console.log("Error -> " + error);
        });
      } else {
        $facebook.login().then(function (result) {
          var credential = firebase.auth.FacebookAuthProvider.credential(result.authResponse.accessToken);
          firebase.auth().signInWithCredential(credential).then(function () {
            $ionicLoading.hide();
          });
        });
      }
    }

    function googleLogin() {
      $ionicLoading.show({ template: 'Carregando...' });
      if (window.cordova) {
        $ionicPlatform.ready(function () {
          $cordovaOauth.google('276187195050-hs1p1pa1dkh7ia7v2th8t55u7a89bgkq.apps.googleusercontent.com', ['profile', 'email']).then(function (result) {
            var credential = firebase.auth.GoogleAuthProvider.credential(result.access_token);
            firebase.auth().signInWithCredential(credential).then(function () {
              $ionicLoading.hide();
            });
            console.log(result);
          }, function (error) {
            $ionicLoading.hide();
            $window.alert('Ops! Ocorreu um erro ao entrar no Rei da Quadra');
            console.log("Error -> " + error);
          });
        });
      }
    }

  });
