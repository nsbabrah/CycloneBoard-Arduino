var appmgrSettingsApp = angular.module('appmgr-settings', ['ngRoute', 'common-service']);

appmgrSettingsApp.config(['$routeProvider', '$locationProvider',
            function ($routeProvider, $locationProvider) {
              //  $locationProvider.html5Mode(true);
            }
]);

appmgrSettingsApp.controller('appmgrSettingsCtrl', ['$scope', '$location', 'settingsService', 'commonService',
    function ($scope, $location, settingsService, commonService) {
        $scope.ss = settingsService;
        $scope.cs = commonService;
        $scope.settings = $scope.ss.getSettings();
        $scope.aboutInfo = $scope.ss.getAboutInfo();
        $scope.errorTabs = {};
        $scope.keyClicked = "";
        $scope.isDeploymentMode = $scope.cs.isDeployment();
        $scope.defaultTab = $scope.isDeploymentMode ? "network" : "general";

		$scope.infoStyle = {};
		var langCode = CmdTarget.getLocale();
		if (langCode == "ja_JP") {
			    $scope.infoStyle = {'min-width':'180px'};
		}
		
		if (SettingsDialog.withError) {
			$scope.errorState = SettingsDialog.errorState;
			console.log($scope.errorState);
			var errorKey = "";
			var anyKnownError = false;
			if ($scope.errorState & 0x1) {
				$scope.selectedTab = "network";
				errorKey = "ERROR_INVALID_HOST";
				$scope.errorTabs[$scope.selectedTab] = [$scope.ss.footerErrors[errorKey][0],$scope.ss.footerErrors[errorKey][1], true];
				anyKnownError = true;
			}
			if ($scope.errorState & 0x2) { 
				$scope.selectedTab = "network";
				errorKey = "ERROR_INVALID_PORT";
			    $scope.errorTabs[$scope.selectedTab] = [$scope.ss.footerErrors[errorKey][0],$scope.ss.footerErrors[errorKey][1], true];
				anyKnownError = true;
			}
			if ($scope.errorState & 0x4) {
				$scope.selectedTab = "network";
				errorKey = "ERROR_INVALID_PROXY_CRED";
				$scope.errorTabs[$scope.selectedTab] = [$scope.ss.footerErrors[errorKey][0],$scope.ss.footerErrors[errorKey][1], true];
				anyKnownError = true;
			}
			if ($scope.errorState & 0x8 && !$scope.isDeploymentMode) {
				$scope.selectedTab = "files";
				errorKey = "ERROR_CANNOT_ACCESS_FILE";
				$scope.errorTabs[$scope.selectedTab] = [$scope.ss.footerErrors[errorKey][0],$scope.ss.footerErrors[errorKey][1], true];
				anyKnownError = true;
			} 
			if ($scope.errorState & 0x10 && !$scope.isDeploymentMode) {
				$scope.selectedTab = "files";
				errorKey = "ERROR_DISK_SPACE_LOW";
				$scope.errorTabs[$scope.selectedTab] = [$scope.ss.footerErrors[errorKey][0],$scope.ss.footerErrors[errorKey][1], true];
				anyKnownError = true;
			} 
			if (!anyKnownError) {
			    $scope.selectedTab = $scope.defaultTab;
				$scope.errorState = "";
			}
			console.log($scope.errorTabs);
		} else {
		    $scope.selectedTab = $scope.defaultTab;
		    $scope.errorState = "";
		}
		
        $scope.importSettings = function () {
            var file = SettingsDialog.onBrowseFile(1);
            if (file) {
                var cmd = {
                    Target: 'AppSettingMgr',
                    Action: 'importSettings',
                    Path: file
                },
                    ret = CmdTarget.invoke(cmd);
                if (ret.Status == "SUCCESS") {
                    var imported = $scope.ss.renameKey(ret.Settings, "/", "_");
                    $scope.settings = $.extend($scope.settings, imported);
                    $scope.errorTabs = {};
                    $scope.errorState = "";
                }
            }
        };

        $scope.exportSettings = function () {
            var file = SettingsDialog.onBrowseFile(0),
                settings = $scope.ss.renameKey($scope.settings, "_", "/");
            if (file) {
                var cmd = {
                    Target: 'AppSettingMgr',
                    Action: 'exportSettings',
                    Path: file,
                    Settings: settings
                };
                CmdTarget.invoke(cmd);
            }
        };

        $scope.saveSettings = function () {
            var settings = $scope.ss.renameKey($scope.settings, "_", "/"),
                cmd = {
                    Target: 'AppSettingMgr',
                    Action: 'saveSettings',
                    Settings: settings
                },
                ret = CmdTarget.invoke(cmd);
            if (ret.Status == "SUCCESS") {
                SettingsDialog.onOK();
            }
        };

        $scope.cancelSettings = function () {
            SettingsDialog.onCancel();
        };

        $scope.browse = function (model) {
            var newPath = SettingsDialog.onBrowseFolder($scope.settings[model]);
            if (newPath) {
            	$scope.clearFieldError(model);
            	$scope.settings[model] = newPath;
            }
        };
        
		$scope.browseWithUNC = function (model) {
            var newPath = SettingsDialog.onBrowseFolderWithUNC($scope.settings[model]);
            if (newPath) {
            	$scope.clearFieldError(model);
            	$scope.settings[model] = newPath;
            }
        };
		
        $scope.switchTab = function (tabName) {
		    console.log("switchTab");
            $scope.selectedTab = tabName;
        };

        $scope.getNavClass = function (tabName) {
            return {
                'selected': $scope.selectedTab == tabName,
                'prev-clicked': $scope.selectedTab == tabName,
                'error-nav': $scope.checkForErrors(tabName)
            };
        };

        $scope.getFooterText = function () {
            return $scope.ss.settingsFooterText[$scope.selectedTab];
        };
        
        /********************************** Error Handling Start ********************************/
        $scope.getFieldClass = function(isInputElement, errorCode) {
			return {
				'error': (isInputElement && ($scope.errorState & errorCode)),
				'error-icon': (!isInputElement && ($scope.errorState & errorCode)),
	            'info-icon in-visible': (!isInputElement && !($scope.errorState & errorCode))
	        };
		};
		
		$scope.getFooterErrorFlag = function() {
			return $scope.errorTabs[$scope.selectedTab] ? $scope.errorTabs[$scope.selectedTab][2] : false;
		};
		
		$scope.getFooterErrorTitle = function() {
		    console.log("getFooterErrorTitle");
			return $scope.errorTabs[$scope.selectedTab] ? $scope.errorTabs[$scope.selectedTab][0] : "";
		};
		
		$scope.getFooterErrorText = function() {
		    console.log("getFooterErrorText");
			return $scope.errorTabs[$scope.selectedTab] ? $scope.errorTabs[$scope.selectedTab][1] : "";
		};
		
		$scope.onChangeProxyType = function(type) {
			var errState = $scope.errorState;
			if ((type == 0 && (errState & 0x1 || errState & 0x2 || errState & 0x4)) || ((type == 1 || type == 2) && (errState & 0x1 || errState & 0x2))) {
				$scope.errorState = $scope.errorState & 0xFFFF8;
				delete $scope.errorTabs["network"];
			}
		};
		
		$scope.checkForErrors = function(tabName) {
			return $scope.errorTabs[tabName] || $scope.validateForEmpty([tabName]);
		};
		
		$scope.validate = function() {
			$scope.disableOK = (_.size($scope.errorTabs) > 0 || $scope.validateForEmpty(["files", "network"]));
			$scope.cs.safeApply($scope);
		};
		
		$scope.validateForEmpty = function(tabNames) {
			var isEmpty = false;
			$.each(tabNames, function(i, tabName) {
				switch (true) {
				case (tabName == "files"):
				    var localLocation = $scope.settings.DownloadManager_Location,
				        sharedLocation = $scope.settings.Shared_Location,
				        useSharedStorage = $scope.settings.UseSharedStorage;
				    if (!localLocation || (useSharedStorage == 'true' && !sharedLocation)) {
				        isEmpty = true;
				    }
				    break;
				case (tabName == "network"):
				    var pType = $scope.settings.Proxy_ProxyType,
				        pHost = $scope.settings.Proxy_ProxyHostname,
				        pPort = $scope.settings.Proxy_ProxyPortnumber;
				    if (pType == 3 && !(pHost && pPort)) {
				        isEmpty = true;
				    }
				    break;
				}
			});
			return isEmpty;
		};
		
		$scope.clearFieldError = function(className) {
        	$("." + className).removeClass('error').parents(".field-wrapper").find(".error-icon").removeClass("error-icon");
        	if ($("#settings_" + $scope.selectedTab).find(".error").length == 0){
        		delete $scope.errorTabs[$scope.selectedTab];
        	}
        };
        
        $scope.closeFooterError = function() {
			$scope.errorTabs[$scope.selectedTab][2] = false;
		};
		
		$scope.$watchCollection("settings",function(newValue, oldValue) {
			$scope.validate();
		});
		/********************************** Error Handling End ********************************/

        /********************************** Settings window events **************************************/
        angular.element(document).ready(function () {
            arb.localizeHtml();
            loadLocaleStyles("settings");
            /* Set top navigation links width */
            $("#settings_nav li a").each(function () {
                $(this).width($(this).width() + 12);
            });

            $(document).on("mouseenter", "#settings_nav li a", function () {
                $('#settings_nav li a.prev-clicked').removeClass("selected");
                $(this).addClass("selected");
            });

            $(document).on("mouseleave", "#settings_nav li a", function () {
                if (!$(this).hasClass("prev-clicked")) {
                    $(this).removeClass("selected");
                    $("#settings_nav li a.prev-clicked").addClass("selected");
                }
            });

            $(document).on("mouseenter", ".field-wrapper", function () {
                $(this).find(".info-icon").removeClass("in-visible");
            });

            $(document).on("mouseleave", ".field-wrapper", function () {
            	var infoIcon = $(this).find(".info-icon");
            	if (($(infoIcon).length > 0) && ($(infoIcon).data("key") != $scope.keyClicked)) {
            		$(infoIcon).addClass("in-visible");
            	}
            });
            
            $(document).on("click", ".field-wrapper", function () {
            	$(".info-icon").not($(this).find(".info-icon")).addClass("in-visible");
            	$scope.keyClicked = "";
            });
            
            $(document).on("mouseenter", ".error-icon", function () {
                var key = $(this).data('key');
                $(".info-icon").addClass("in-visible");
                $(this).tooltip("show", {
                    title: $scope.ss.fieldErrors[key][0],
                    content: $scope.ss.fieldErrors[key][1]
                });
            });
            
            $(document).on("click", ".error-icon", function () {
                var key = $(this).data('key');
                $(".info-icon").addClass("in-visible");
                $(this).tooltip("show", {
                    title: $scope.ss.fieldErrors[key][0],
                    content: $scope.ss.fieldErrors[key][1],
                    showClose: true
                });
            });

            $(document).on("mouseenter", ".info-icon", function () {
                var key = $(this).data("key");
                if (key != $scope.keyClicked) {
                	$(".info-icon").not(this).addClass("in-visible");
                    $scope.keyClicked = "";
                    $(this).tooltip("show", {
                        title: $scope.ss.settingsInfo[key][0],
                        content: $scope.ss.settingsInfo[key][1],
                        type: "info",
                        placement: "right",
                        showClose: false
                    });
                }
            });

            $(document).on("click", ".info-icon", function (e) {
            	e.stopPropagation();
                var key = $(this).data("key");
                $scope.keyClicked = key;
                $(this).tooltip("show", {
                    title: $scope.ss.settingsInfo[key][0],
                    content: $scope.ss.settingsInfo[key][1],
                    type: "info",
                    placement: "right",
                    showClose: true
                });
            });
            
            $(document).click(function (e) {
                var et = e.target ? e.target : e.srcElement;
                if ($scope.keyClicked != "") {
                	if ($(et).is(".tt-close") || !($(et).is(".info-icon, .tt-wrapper, .field-wrapper") || $(et).parents().is(".info-icon, .tt-wrapper, .field-wrapper"))) {
                    	$(".info-icon").addClass("in-visible");
                        $scope.keyClicked = "";
                    }
                }
            });

            $('input[class~=number]').on("keypress", function (e) {
            	// Restrict alphabets from number field 
                var keyCode = e.which ? e.which : e.keyCode,
                	result = (keyCode >= 48 && keyCode <= 57);
                return result;
            });
            
            $(document).on("contextmenu", document.body, function () {
                return false;
            });
        });
    }
]);

// SIG // Begin signature block
// SIG // MIIZewYJKoZIhvcNAQcCoIIZbDCCGWgCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFHNQk/rg3EU1
// SIG // iC4sMB2jaLDUHF1joIIUMDCCA+4wggNXoAMCAQICEH6T
// SIG // 6/t8xk5Z6kuad9QG/DswDQYJKoZIhvcNAQEFBQAwgYsx
// SIG // CzAJBgNVBAYTAlpBMRUwEwYDVQQIEwxXZXN0ZXJuIENh
// SIG // cGUxFDASBgNVBAcTC0R1cmJhbnZpbGxlMQ8wDQYDVQQK
// SIG // EwZUaGF3dGUxHTAbBgNVBAsTFFRoYXd0ZSBDZXJ0aWZp
// SIG // Y2F0aW9uMR8wHQYDVQQDExZUaGF3dGUgVGltZXN0YW1w
// SIG // aW5nIENBMB4XDTEyMTIyMTAwMDAwMFoXDTIwMTIzMDIz
// SIG // NTk1OVowXjELMAkGA1UEBhMCVVMxHTAbBgNVBAoTFFN5
// SIG // bWFudGVjIENvcnBvcmF0aW9uMTAwLgYDVQQDEydTeW1h
// SIG // bnRlYyBUaW1lIFN0YW1waW5nIFNlcnZpY2VzIENBIC0g
// SIG // RzIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
// SIG // AQCxrLNJVEuXHBIK2CV5kSJXKm/cuCbEQ3Nrwr8uUFr7
// SIG // FMJ2jkMBJUO0oeJF9Oi3e8N0zCLXtJQAAvdN7b+0t0Qk
// SIG // a81fRTvRRM5DEnMXgotptCvLmR6schsmTXEfsTHd+1Fh
// SIG // AlOmqvVJLAV4RaUvic7nmef+jOJXPz3GktxK+Hsz5HkK
// SIG // +/B1iEGc/8UDUZmq12yfk2mHZSmDhcJgFMTIyTsU2sCB
// SIG // 8B8NdN6SIqvK9/t0fCfm90obf6fDni2uiuqm5qonFn1h
// SIG // 95hxEbziUKFL5V365Q6nLJ+qZSDT2JboyHylTkhE/xni
// SIG // RAeSC9dohIBdanhkRc1gRn5UwRN8xXnxycFxAgMBAAGj
// SIG // gfowgfcwHQYDVR0OBBYEFF+a9W5czMx0mtTdfe8/2+xM
// SIG // gC7dMDIGCCsGAQUFBwEBBCYwJDAiBggrBgEFBQcwAYYW
// SIG // aHR0cDovL29jc3AudGhhd3RlLmNvbTASBgNVHRMBAf8E
// SIG // CDAGAQH/AgEAMD8GA1UdHwQ4MDYwNKAyoDCGLmh0dHA6
// SIG // Ly9jcmwudGhhd3RlLmNvbS9UaGF3dGVUaW1lc3RhbXBp
// SIG // bmdDQS5jcmwwEwYDVR0lBAwwCgYIKwYBBQUHAwgwDgYD
// SIG // VR0PAQH/BAQDAgEGMCgGA1UdEQQhMB+kHTAbMRkwFwYD
// SIG // VQQDExBUaW1lU3RhbXAtMjA0OC0xMA0GCSqGSIb3DQEB
// SIG // BQUAA4GBAAMJm495739ZMKrvaLX64wkdu0+CBl03X6ZS
// SIG // nxaN6hySCURu9W3rWHww6PlpjSNzCxJvR6muORH4KrGb
// SIG // sBrDjutZlgCtzgxNstAxpghcKnr84nodV0yoZRjpeUBi
// SIG // JZZux8c3aoMhCI5B6t3ZVz8dd0mHKhYGXqY4aiISo1EZ
// SIG // g362MIIEozCCA4ugAwIBAgIQDs/0OMj+vzVuBNhqmBsa
// SIG // UDANBgkqhkiG9w0BAQUFADBeMQswCQYDVQQGEwJVUzEd
// SIG // MBsGA1UEChMUU3ltYW50ZWMgQ29ycG9yYXRpb24xMDAu
// SIG // BgNVBAMTJ1N5bWFudGVjIFRpbWUgU3RhbXBpbmcgU2Vy
// SIG // dmljZXMgQ0EgLSBHMjAeFw0xMjEwMTgwMDAwMDBaFw0y
// SIG // MDEyMjkyMzU5NTlaMGIxCzAJBgNVBAYTAlVTMR0wGwYD
// SIG // VQQKExRTeW1hbnRlYyBDb3Jwb3JhdGlvbjE0MDIGA1UE
// SIG // AxMrU3ltYW50ZWMgVGltZSBTdGFtcGluZyBTZXJ2aWNl
// SIG // cyBTaWduZXIgLSBHNDCCASIwDQYJKoZIhvcNAQEBBQAD
// SIG // ggEPADCCAQoCggEBAKJjCzlEuLsjp0RJuw7/ofBhClOT
// SIG // sJjbrSwPSsVu/4Y8U1UPFc4EPyv9qZaW2b5heQtbyUyG
// SIG // duXgQ0sile7CK0PBn9hotI5AT+6FOLkRxSPyZFjwFTJv
// SIG // TlehroikAtcqHs1L4d1j1ReJMluwXplaqJ0oUA4X7pbb
// SIG // YTtFUR3PElYLkkf8q672Zj1HrHBy55LnX80QucSDZJQZ
// SIG // vSWA4ejSIqXQugJ6oXeTW2XD7hd0vEGGKtwITIySjJEt
// SIG // nndEH2jWqHR32w5bMotWizO92WPISZ06xcXqMwvS8aMb
// SIG // 9Iu+2bNXizveBKd6IrIkri7HcMW+ToMmCPsLvalPmQjh
// SIG // EChyqs0CAwEAAaOCAVcwggFTMAwGA1UdEwEB/wQCMAAw
// SIG // FgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYDVR0PAQH/
// SIG // BAQDAgeAMHMGCCsGAQUFBwEBBGcwZTAqBggrBgEFBQcw
// SIG // AYYeaHR0cDovL3RzLW9jc3Aud3Muc3ltYW50ZWMuY29t
// SIG // MDcGCCsGAQUFBzAChitodHRwOi8vdHMtYWlhLndzLnN5
// SIG // bWFudGVjLmNvbS90c3MtY2EtZzIuY2VyMDwGA1UdHwQ1
// SIG // MDMwMaAvoC2GK2h0dHA6Ly90cy1jcmwud3Muc3ltYW50
// SIG // ZWMuY29tL3Rzcy1jYS1nMi5jcmwwKAYDVR0RBCEwH6Qd
// SIG // MBsxGTAXBgNVBAMTEFRpbWVTdGFtcC0yMDQ4LTIwHQYD
// SIG // VR0OBBYEFEbGaaMOShQe1UzaUmMXP142vA3mMB8GA1Ud
// SIG // IwQYMBaAFF+a9W5czMx0mtTdfe8/2+xMgC7dMA0GCSqG
// SIG // SIb3DQEBBQUAA4IBAQB4O7SRKgBM8I9iMDd4o4QnB28Y
// SIG // st4l3KDUlAOqhk4ln5pAAxzdzuN5yyFoBtq2MrRtv/Qs
// SIG // JmMz5ElkbQ3mw2cO9wWkNWx8iRbG6bLfsundIMZxD82V
// SIG // dNy2XN69Nx9DeOZ4tc0oBCCjqvFLxIgpkQ6A0RH83Vx2
// SIG // bk9eDkVGQW4NsOo4mrE62glxEPwcebSAe6xp9P2ctgwW
// SIG // K/F/Wwk9m1viFsoTgW0ALjgNqCmPLOGy9FqpAa8VnCwv
// SIG // SRvbIrvD/niUUcOGsYKIXfA9tFGheTMrLnu53CAJE3Hr
// SIG // ahlbz+ilMFcsiUk/uc9/yb8+ImhjU5q9aXSsxR08f5Lg
// SIG // w7wc2AR1MIIFhTCCBG2gAwIBAgIQKcFbP6rNUmpOZ708
// SIG // Tn4/8jANBgkqhkiG9w0BAQUFADCBtDELMAkGA1UEBhMC
// SIG // VVMxFzAVBgNVBAoTDlZlcmlTaWduLCBJbmMuMR8wHQYD
// SIG // VQQLExZWZXJpU2lnbiBUcnVzdCBOZXR3b3JrMTswOQYD
// SIG // VQQLEzJUZXJtcyBvZiB1c2UgYXQgaHR0cHM6Ly93d3cu
// SIG // dmVyaXNpZ24uY29tL3JwYSAoYykxMDEuMCwGA1UEAxMl
// SIG // VmVyaVNpZ24gQ2xhc3MgMyBDb2RlIFNpZ25pbmcgMjAx
// SIG // MCBDQTAeFw0xMjA3MjUwMDAwMDBaFw0xNTA5MjAyMzU5
// SIG // NTlaMIHIMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2Fs
// SIG // aWZvcm5pYTETMBEGA1UEBxMKU2FuIFJhZmFlbDEWMBQG
// SIG // A1UEChQNQXV0b2Rlc2ssIEluYzE+MDwGA1UECxM1RGln
// SIG // aXRhbCBJRCBDbGFzcyAzIC0gTWljcm9zb2Z0IFNvZnR3
// SIG // YXJlIFZhbGlkYXRpb24gdjIxHzAdBgNVBAsUFkRlc2ln
// SIG // biBTb2x1dGlvbnMgR3JvdXAxFjAUBgNVBAMUDUF1dG9k
// SIG // ZXNrLCBJbmMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
// SIG // ggEKAoIBAQCoYmDrmd0Gq8ezSsDlfgaJFEFplNPNhWzM
// SIG // 2uFQaYAB/ggpQ11+N4B6ao+TqrNIWDIqt3JKhaU889nx
// SIG // l/7teWGwuOurstI2Z0bEDhXiXam/bicK2HVLyntliQ+6
// SIG // tT+nlgfN8tgB2NzM0BpE1YCnU2b6DwQw4V7BV+/F//83
// SIG // yGFOpePlumzXxNw9EKWkaq81slmmTxf7UxZgP9PGbLw8
// SIG // gLAPk4PTJI97+5BBqhkLb1YqSfWn3PNMfsNKhw/VwAN0
// SIG // dRKeM6H8SkOdz+osr+NyH86lsKQuics4fwK5uFSHQHsI
// SIG // t6Z0tqWvminRqceUi9ugRlGryh9X1ZqCqfL/ggdzYa3Z
// SIG // AgMBAAGjggF7MIIBdzAJBgNVHRMEAjAAMA4GA1UdDwEB
// SIG // /wQEAwIHgDBABgNVHR8EOTA3MDWgM6Axhi9odHRwOi8v
// SIG // Y3NjMy0yMDEwLWNybC52ZXJpc2lnbi5jb20vQ1NDMy0y
// SIG // MDEwLmNybDBEBgNVHSAEPTA7MDkGC2CGSAGG+EUBBxcD
// SIG // MCowKAYIKwYBBQUHAgEWHGh0dHBzOi8vd3d3LnZlcmlz
// SIG // aWduLmNvbS9ycGEwEwYDVR0lBAwwCgYIKwYBBQUHAwMw
// SIG // cQYIKwYBBQUHAQEEZTBjMCQGCCsGAQUFBzABhhhodHRw
// SIG // Oi8vb2NzcC52ZXJpc2lnbi5jb20wOwYIKwYBBQUHMAKG
// SIG // L2h0dHA6Ly9jc2MzLTIwMTAtYWlhLnZlcmlzaWduLmNv
// SIG // bS9DU0MzLTIwMTAuY2VyMB8GA1UdIwQYMBaAFM+Zqep7
// SIG // JvRLyY6P1/AFJu/j0qedMBEGCWCGSAGG+EIBAQQEAwIE
// SIG // EDAWBgorBgEEAYI3AgEbBAgwBgEBAAEB/zANBgkqhkiG
// SIG // 9w0BAQUFAAOCAQEA2OkGvuiY7TyI6yVTQAYmTO+MpOFG
// SIG // C8MflHSbofJiuLxrS1KXbkzsAPFPPsU1ouftFhsXFtDQ
// SIG // 8rMTq/jwugTpbJUREV0buEkLl8AKRhYQTKBKg1I/puBv
// SIG // bkJocDE0pRwtBz3xSlXXEwyYPcbCOnrM3OZ5bKx1Qiii
// SIG // vixlcGWhO3ws904ssutPFf4mV5PDi3U2Yp1HgbBK/Um/
// SIG // FLr6YAYeZaA8KY1CfQEisF3UKTwm72d7S+fJf++SOGea
// SIG // K0kumehVcbavQJTOVebuZ9V+qU0nk1lMrqve9BnQK69B
// SIG // QqNZu77vCO0wm81cfynAxkOYKZG3idY47qPJOgXKkwmI
// SIG // 2+92ozCCBgowggTyoAMCAQICEFIA5aolVvwahu2WydRL
// SIG // M8cwDQYJKoZIhvcNAQEFBQAwgcoxCzAJBgNVBAYTAlVT
// SIG // MRcwFQYDVQQKEw5WZXJpU2lnbiwgSW5jLjEfMB0GA1UE
// SIG // CxMWVmVyaVNpZ24gVHJ1c3QgTmV0d29yazE6MDgGA1UE
// SIG // CxMxKGMpIDIwMDYgVmVyaVNpZ24sIEluYy4gLSBGb3Ig
// SIG // YXV0aG9yaXplZCB1c2Ugb25seTFFMEMGA1UEAxM8VmVy
// SIG // aVNpZ24gQ2xhc3MgMyBQdWJsaWMgUHJpbWFyeSBDZXJ0
// SIG // aWZpY2F0aW9uIEF1dGhvcml0eSAtIEc1MB4XDTEwMDIw
// SIG // ODAwMDAwMFoXDTIwMDIwNzIzNTk1OVowgbQxCzAJBgNV
// SIG // BAYTAlVTMRcwFQYDVQQKEw5WZXJpU2lnbiwgSW5jLjEf
// SIG // MB0GA1UECxMWVmVyaVNpZ24gVHJ1c3QgTmV0d29yazE7
// SIG // MDkGA1UECxMyVGVybXMgb2YgdXNlIGF0IGh0dHBzOi8v
// SIG // d3d3LnZlcmlzaWduLmNvbS9ycGEgKGMpMTAxLjAsBgNV
// SIG // BAMTJVZlcmlTaWduIENsYXNzIDMgQ29kZSBTaWduaW5n
// SIG // IDIwMTAgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
// SIG // ggEKAoIBAQD1I0tepdeKuzLp1Ff37+THJn6tGZj+qJ19
// SIG // lPY2axDXdYEwfwRof8srdR7NHQiM32mUpzejnHuA4Jnh
// SIG // 7jdNX847FO6G1ND1JzW8JQs4p4xjnRejCKWrsPvNamKC
// SIG // TNUh2hvZ8eOEO4oqT4VbkAFPyad2EH8nA3y+rn59wd35
// SIG // BbwbSJxp58CkPDxBAD7fluXF5JRx1lUBxwAmSkA8taEm
// SIG // qQynbYCOkCV7z78/HOsvlvrlh3fGtVayejtUMFMb32I0
// SIG // /x7R9FqTKIXlTBdOflv9pJOZf9/N76R17+8V9kfn+Bly
// SIG // 2C40Gqa0p0x+vbtPDD1X8TDWpjaO1oB21xkupc1+NC2J
// SIG // AgMBAAGjggH+MIIB+jASBgNVHRMBAf8ECDAGAQH/AgEA
// SIG // MHAGA1UdIARpMGcwZQYLYIZIAYb4RQEHFwMwVjAoBggr
// SIG // BgEFBQcCARYcaHR0cHM6Ly93d3cudmVyaXNpZ24uY29t
// SIG // L2NwczAqBggrBgEFBQcCAjAeGhxodHRwczovL3d3dy52
// SIG // ZXJpc2lnbi5jb20vcnBhMA4GA1UdDwEB/wQEAwIBBjBt
// SIG // BggrBgEFBQcBDARhMF+hXaBbMFkwVzBVFglpbWFnZS9n
// SIG // aWYwITAfMAcGBSsOAwIaBBSP5dMahqyNjmvDz4Bq1EgY
// SIG // LHsZLjAlFiNodHRwOi8vbG9nby52ZXJpc2lnbi5jb20v
// SIG // dnNsb2dvLmdpZjA0BgNVHR8ELTArMCmgJ6AlhiNodHRw
// SIG // Oi8vY3JsLnZlcmlzaWduLmNvbS9wY2EzLWc1LmNybDA0
// SIG // BggrBgEFBQcBAQQoMCYwJAYIKwYBBQUHMAGGGGh0dHA6
// SIG // Ly9vY3NwLnZlcmlzaWduLmNvbTAdBgNVHSUEFjAUBggr
// SIG // BgEFBQcDAgYIKwYBBQUHAwMwKAYDVR0RBCEwH6QdMBsx
// SIG // GTAXBgNVBAMTEFZlcmlTaWduTVBLSS0yLTgwHQYDVR0O
// SIG // BBYEFM+Zqep7JvRLyY6P1/AFJu/j0qedMB8GA1UdIwQY
// SIG // MBaAFH/TZafC3ey78DAJ80M5+gKvMzEzMA0GCSqGSIb3
// SIG // DQEBBQUAA4IBAQBWIuY0pMRhy0i5Aa1WqGQP2YyRxLvM
// SIG // DOWteqAif99HOEotbNF/cRp87HCpsfBP5A8MU/oVXv50
// SIG // mEkkhYEmHJEUR7BMY4y7oTTUxkXoDYUmcwPQqYxkbdxx
// SIG // kuZFBWAVWVE5/FgUa/7UpO15awgMQXLnNyIGCb4j6T9E
// SIG // mh7pYZ3MsZBc/D3SjaxCPWU21LQ9QCiPmxDPIybMSyDL
// SIG // kB9djEw0yjzY5TfWb6UgvTTrJtmuDefFmvehtCGRM2+G
// SIG // 6Fi7JXx0Dlj+dRtjP84xfJuPG5aexVN2hFucrZH6rO2T
// SIG // ul3IIVPCglNjrxINUIcRGz1UUpaKLJw9khoImgUux5Ol
// SIG // SJHTMYIEtzCCBLMCAQEwgckwgbQxCzAJBgNVBAYTAlVT
// SIG // MRcwFQYDVQQKEw5WZXJpU2lnbiwgSW5jLjEfMB0GA1UE
// SIG // CxMWVmVyaVNpZ24gVHJ1c3QgTmV0d29yazE7MDkGA1UE
// SIG // CxMyVGVybXMgb2YgdXNlIGF0IGh0dHBzOi8vd3d3LnZl
// SIG // cmlzaWduLmNvbS9ycGEgKGMpMTAxLjAsBgNVBAMTJVZl
// SIG // cmlTaWduIENsYXNzIDMgQ29kZSBTaWduaW5nIDIwMTAg
// SIG // Q0ECECnBWz+qzVJqTme9PE5+P/IwCQYFKw4DAhoFAKCB
// SIG // tDAZBgkqhkiG9w0BCQMxDAYKKwYBBAGCNwIBBDAcBgor
// SIG // BgEEAYI3AgELMQ4wDAYKKwYBBAGCNwIBFTAjBgkqhkiG
// SIG // 9w0BCQQxFgQU61lz2lGARcayvUnkaj00ZydshUUwVAYK
// SIG // KwYBBAGCNwIBDDFGMESgJoAkAEEAdQB0AG8AZABlAHMA
// SIG // awAgAEMAbwBtAHAAbwBuAGUAbgB0oRqAGGh0dHA6Ly93
// SIG // d3cuYXV0b2Rlc2suY29tIDANBgkqhkiG9w0BAQEFAASC
// SIG // AQAYn+xzKxFHY7D7Xb6nzDW7yYjCkvWlay2bxdSnnzo9
// SIG // N0ISk++U98rHozTZS5pJFX3vnSkB+Tpwjj0h59nQf7TQ
// SIG // r93/iTqgTUSgWjnRlXfuaV54EguYY6XA8/2rSi279dOW
// SIG // ThawiO01zAE4qCq4/i44kWakK96xLQpLzGj7OIJfdrEk
// SIG // JNb97RX0ihY0aROeHSUr/XST0gOTB/Qm1rzV8xe6fR/e
// SIG // a51PvgTGWvpTuqgP3Pc9IG9c1RTOBpi34sEc0gI+YNTA
// SIG // Q89Ne2v1SaUahRrx6+EeHrYmWQ1E8HWjVA5bXo7cl2v8
// SIG // HWa2MPI/ZpCTpvfSfpDahI8itilIsdTH/CucoYICCzCC
// SIG // AgcGCSqGSIb3DQEJBjGCAfgwggH0AgEBMHIwXjELMAkG
// SIG // A1UEBhMCVVMxHTAbBgNVBAoTFFN5bWFudGVjIENvcnBv
// SIG // cmF0aW9uMTAwLgYDVQQDEydTeW1hbnRlYyBUaW1lIFN0
// SIG // YW1waW5nIFNlcnZpY2VzIENBIC0gRzICEA7P9DjI/r81
// SIG // bgTYapgbGlAwCQYFKw4DAhoFAKBdMBgGCSqGSIb3DQEJ
// SIG // AzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTE1
// SIG // MDczMDAzNDAyN1owIwYJKoZIhvcNAQkEMRYEFCKGHeA2
// SIG // IRlhAJdZO3pZ5QsTGnN3MA0GCSqGSIb3DQEBAQUABIIB
// SIG // AB14S0QY7CgzD05+QEdudLLO3Z2YVMFSChqL0t+K+WXJ
// SIG // 6nqwfvD+MsKvkfqvRHuB3MMBejDibgx3d8LLN+faCoUq
// SIG // ZsBL+12XGdgDKSu4fOleO7A3DKFkmnaeoN8qEa8JGQ+D
// SIG // vX2DEDclKFbR8VkSXo9rYvH0ekaPxBJS0AT+3QLgZ+J3
// SIG // 9UAc21u7K8mDUt9BApqfofqy68Y5F/RL40qru8PqIa0c
// SIG // VwhbjPSQdTMarFlIMlKpM3c2Dr7Nxsdn7X3c9NrezCAl
// SIG // VTRc5lS5ziNdcVOyj19ZJuSfCE0Lyohh4ghkSXV2xyH6
// SIG // WrWBalikwtiO2KfrkYUha5DhNVEP+DiJdl8=
// SIG // End signature block
