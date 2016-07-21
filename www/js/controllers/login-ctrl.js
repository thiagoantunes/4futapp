/*global firebase firebaseui _*/
'use strict';
angular.module('main')
  .controller('LoginCtrl', function ($state, $facebook, Ref, $ionicPlatform, $cordovaOauth) {
    var vm = this;
    vm.facebookLogin = facebookLogin;

    activate();

    function activate() {
      var auth = firebase.auth();
      var provider = new firebase.auth.FacebookAuthProvider();
    }



    function facebookLogin() {
      if (window.cordova) {
        $ionicPlatform.ready(function () {
          $cordovaOauth.facebook('908423235912952', []).then(function (result) {
            var credential = firebase.auth.FacebookAuthProvider.credential(result.access_token);
            firebase.auth().signInWithCredential(credential).catch(function (error) {
              var errorCode = error.code;
              var errorMessage = error.message;
              var email = error.email;
              var credential = error.credential;
            });
            console.log(result);
          }, function (error) {
            console.log("Error -> " + error);
          });
        });
      } else {
        $facebook.login().then(function (result) {
          var credential = firebase.auth.FacebookAuthProvider.credential(result.authResponse.accessToken);
          firebase.auth().signInWithCredential(credential).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
          });
        });
      }
    }

  });
