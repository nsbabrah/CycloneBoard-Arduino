var appmgrMainApp = angular.module('appmgr-main', ['ngRoute', 'ngSanitize', 'common-service']);

appmgrMainApp.config(['$routeProvider', '$locationProvider',
            function ($routeProvider, $locationProvider) {
               // $locationProvider.html5Mode(true);
            }
]);

appmgrMainApp.controller('appmgrMainCtrl', ['$scope', '$location', '$timeout', 'mainService', 'commonService',
    function ($scope, $location, $timeout, mainService, commonService) {
        $scope.ms = mainService;
        $scope.cs = commonService;
        $scope.selectedAssets = {};
        $scope.transactionArr = {};
        $scope.errorArr = {};
        $scope.clientAssets = [];
        $scope.cancelIds = [];
        $scope.cancelAllClicked = false;
        $scope.showFooter = false;
        $scope.showStatusError = false;
        $scope.showCancelConfirm = false;
        $scope.showMultiMenu = false;
        $scope.disableMultiAction = true;
        $scope.showMultiMenu = false;
        $scope.selectedTab = "welcome";
        $scope.sortBy = "date";
        $scope.currentAction = "installSelected";
        $scope.statusErrorText = "";
        $scope.cancelTitle = "";
        $scope.cancelContent = "";
        $scope.isDeploymentMode =  $scope.cs.isDeployment();

		$scope.errorStyle = {};
		var langCode = CmdTarget.getLocale();
		if (langCode == "ja_JP") {
			    $scope.errorStyle = {'margin-left':'55px'};
		}
		
		$scope.appiconWrapperStyle = {};
		if (langCode == "ja_JP") {
			    $scope.appiconWrapperStyle = {'width':'30px'};
		}
		
        $scope.openSettings = function () {
            var cmd = {
                Target: 'AppWindow',
                Action: 'settings'
            };
            $scope.invokeCmd(cmd);
        };

        $scope.getAssets = function (tabName) {
            $(".app-loading").removeClass("hide"); // Show spinning wheel
            var cmd = {
                Target: 'AssetMgr',
                Action: 'getAssets',
                Type: 100,
                State: 100
            },
                ret = CmdTarget.invoke(cmd);
            if (ret.Status.toLowerCase() == "success") {
                $scope.addReplaceAssets(ret.AssetList, true);
                $scope.loadAssets(tabName);
            } else if (ret.Status.toLowerCase() == "error") {
                $scope.handleInvokeError(ret);
            }
            $(".app-loading").addClass("hide"); // hide spinning wheel
        };

        /**
         * This method will remove the duplicate assets, add the new assets and 
         * replace the existing assets with the latest version
         */
        $scope.addReplaceAssets = function (assets, refresh) {
            if (refresh) {
                $scope.clientAssets = assets;
            } else {
                $scope.clientAssets = $scope.clientAssets.concat(assets);
            }
            var tempArr = {};
            $.each($scope.clientAssets, function(i, asset){
                tempArr[asset['id']] = asset;
            });
            var tempSelectedAssetArr = $scope.selectedAssets;
            $scope.clientAssets = [];
            $scope.selectedAssets = {};
            $.each(tempArr, function(key, asset){
                $scope.clientAssets.push(asset);
                if (tempSelectedAssetArr[key]) {
                    $scope.selectedAssets[key] = key;
                }
            });
        };

        $scope.loadAssets = function (tabName) {
        	var sortBy = $scope.sortBy,
        		panelHeaders = $scope.ms.panelHeaders[sortBy];
        	$.each($scope.clientAssets, function (i, asset) {
                var state = asset.state;
                	if (!asset.parsedReleaseDate || !asset.addnDetails) {
                		$scope.addnDetails(asset);
                	}
                	asset.addnDetails[$scope.ms.statusText] = $scope.ms.getStatusStr(asset.state, $scope.isDeploymentMode);
                	if (sortBy == "date") {
                		asset["category"] = $scope.ms.getDateCategory(asset.parsedReleaseDate, state, asset.selfUpdate, panelHeaders);
                	} else if (sortBy == "severity") {
                		asset["category"] = $scope.ms.getSeverityCategory(asset.severity, state, asset.selfUpdate, panelHeaders);
                	}
            });
            /* Timeout will be called after the DOM manipulation completed and before the browser renders the UI */
        	$timeout(function () {
                $scope.retainProgress();
                $scope.changeMultiAction();
                $scope.cs.safeApply($scope);
            }, 0);
        };
        
        $scope.addnDetails = function(asset) {
        	asset.parsedReleaseDate = asset.releaseDate ? $scope.cs.parseUTC(asset.releaseDate) : $scope.ms.unKnownText;
        	asset.addnDetails = {};
        	asset.addnDetails[$scope.ms.releasedText] = $scope.cs.localeDate(asset.parsedReleaseDate);
        	asset.addnDetails[$scope.ms.publisherText] = asset.publisher ? asset.publisher : "Autodesk";
        	asset.addnDetails[$scope.ms.updateIdText] = asset.id;
        	asset.addnDetails[$scope.ms.severityText] = $scope.ms.getSeverity(asset.severity);
        	asset.addnDetails[$scope.ms.sizeText] = (asset.files && asset.files[0].size) ? $scope.cs.convertBytes(asset.files[0].size, 1, false) : $scope.ms.unKnownText;
        };

        $scope.getSelectedAssets = function () {
            var assetIds = [];
            $(".check > input:checked").each(function () {
                $(this).parents(".asset").find(".toggle-icon, .cancel").addClass("in-visible");
                assetIds.push($(this).attr("id"));
            });
            return assetIds;
        }

        $scope.installSelected = function () {
            $scope.install($scope.getSelectedAssets());
        };

        $scope.addSelected = function () {
            $scope.add($scope.getSelectedAssets());
        };

        $scope.removeSelected = function () {
            $scope.remove($scope.getSelectedAssets());
        };

        $scope.installSingle = function ($event, assetId, assetState) {
            if ($($event.target).hasClass("disabled")) {
                $event.stopPropagation();
                return false;
            } else {
                if ($scope.isDeploymentMode) {
                    if (assetState == 7) { // downloaded
                        $scope.remove([assetId]);
                    } else
                        $scope.add([assetId]);
                }
                else {
                    $scope.install([assetId]);
                }
            }
        };
        
        $scope.install = function (assetIds) {
            var cmd = {
                Target: 'InstallMgr',
                Action: 'install',
                IDList: assetIds
            };
            $scope.invokeCmd(cmd);
        };

        // Deployment mode only
        $scope.add = function (assetIds) {
            $scope.install(assetIds);
        };

        // Deployment mode only
        $scope.remove = function (assetIds) {
            var cmd = {
                Target: 'InstallMgr',
                Action: 'uninstall',
                IDList: assetIds
            };
            $scope.invokeCmd(cmd);
        };

        $scope.ignoreSelected = function () {
            var assetIds = [];
            $(".not-downloaded, .not-installed").find(".check > input:checked").each(function () {
            	assetIds.push($(this).attr("id"));
            });
            $scope.ignore(assetIds);
        };

        $scope.ignoreSingle = function ($event, assetId) {
            if ($($event.target).hasClass("disabled")) {
                $event.stopPropagation();
                return false;
            } else {
            	$scope.ignore([assetId]);
            }
        };
        
        $scope.ignore = function (assetIds) {
            var cmd = {
                Target: 'AssetMgr',
                Action: 'ignore',
                IDList: assetIds
            };
            $scope.invokeCmd(cmd);
        };

        $scope.onClickToggle = function (target, assetId) {
            if ($(target).hasClass("pause")) {
                $(target).removeClass("pause").addClass("resume");
                $scope.pause([assetId], false);
            } else {
                $(target).removeClass("resume").addClass("pause");
                $scope.resume([assetId]);
            }
        };

        $scope.pauseSelected = function () {
            var assetIds = [];
            $(".check > input:checked").each(function () {
                assetIds.push($(this).attr("id"));
            });
            $scope.pause(assetIds, false);
        };

        $scope.pause = function (assetIds, isCancel) {
            var cmd = {
                Target: 'InstallMgr',
                Action: 'pause',
                IDList: assetIds,
                Cancel: isCancel
            };
            $scope.invokeCmd(cmd, isCancel);
        };

        $scope.afterPaused = function (assetId) {
            if ($scope.transactionArr[assetId].state != $scope.ms.transactionState["Installing"]) {
                var escAssetId = $scope.cs.escChar(assetId),
                    parent = $("#" + escAssetId).parents(".asset");
                $(parent).find(".toggle-icon").removeClass("pause").addClass("resume");
                $(parent).find(".toggle-icon, .cancel").removeClass("in-visible");
                if (!$scope.showCancelConfirm) {
                    $(parent).find(".paused-text").removeClass("in-visible");
                }
                $scope.changeMultiAction();
            }
        };

        $scope.resumeSelected = function () {
            var assetIds = [];
            $(".check > input:checked").each(function () {
                var parent = $(this).parents(".asset");
                assetIds.push($(this).attr("id"));
                $(parent).find(".toggle-icon, .cancel").addClass("in-visible");
                $(parent).find(".toggle-icon").removeClass("resume").addClass("pause");
            });
            $scope.changeMultiAction();
            $scope.resume(assetIds);
        };

        $scope.resume = function (assetIds) {
            var cmd = {
                Target: 'InstallMgr',
                Action: 'resume',
                IDList: assetIds
            };
            $scope.invokeCmd(cmd);
        };

        $scope.onClickCancel = function (assetId) {
            $scope.cancelAllClicked = false;
            $scope.cancelIds = [assetId];
            $scope.pause($scope.cancelIds, true);
        };

        $scope.cancelSelected = function () {
            $scope.cancelAllClicked = true;
            $scope.cancelIds = [];
            $(".check > input:checked").each(function () {
            	$scope.cancelIds.push($(this).attr("id"));
            });
            $scope.pause($scope.cancelIds, true);
        };

        $scope.cancel = function (assetIds) {
            var cmd = {
                Target: 'InstallMgr',
                Action: 'cancel',
                IDList: assetIds
            };
            $scope.invokeCmd(cmd);
        }
        
        $scope.markAssetAsVisited = function (assetId) {
            var newTag = $("#" + $scope.cs.escChar(assetId)).parents(".asset").find(".new");
            if ($(newTag).length > 0 && $(newTag).is(":visible")) {
            	$(newTag).fadeOut("slow");
                $scope.updateAssetState(assetId, "1");
                var cmd = {
                    Target: 'AssetMgr',
                    Action: 'markAssetAsVisited',
                    IDList: [assetId]
                };
                $scope.invokeCmd(cmd);
            }
        };

        $scope.installButtonLabel = function (asset) {
            if ($scope.isDeploymentMode) {
                if (asset.state == $scope.ms.updateState["download-completed"]) {
                    return $scope.cs.btnArray["s"][6]; // "Remove
                } else {
                    return $scope.cs.btnArray["s"][5]; // "Add"
                }
            } else {
                return $scope.cs.btnArray["s"][0]; // "Install"
            }
        };
        /**************************** Multi action menu start ****************************/
        $scope.getMultiMenuBtnName = function () {
            return $scope.ms.multiMenuBtns[$scope.currentAction].label;
        };

        $scope.openMultiMenu = function () {
            $scope.enableMultiMenu();
            $scope.setMultiMenuWidth();
            $scope.showMultiMenu = !$scope.showMultiMenu;
        };

        $scope.enableMultiMenu = function () {
            var inprogress = $(".install-progress, .download-progress").find(".check > input:checked").length,
	            paused = $(".progress-wrapper:not(.hide)").find(".resume").length,
	            resumed = $(".progress-wrapper:not(.hide)").find(".pause").length,
	            ignored = $(".not-applicable-ignored").find(".check > input:checked").length,
	            notinstalled = $(".not-installed").find(".check > input:checked").length,
                notdownloaded = $(".not-downloaded").find(".check > input:checked").length,
                downloaded = $(".downloaded").find(".check > input:checked").length;
            if ($scope.isDeploymentMode) {
                notdownloaded = notdownloaded + ignored + (inprogress - (paused + resumed));
                $scope.ms.multiMenuBtns["installSelected"].hidden = true;
                $scope.ms.multiMenuBtns["addSelected"].hidden = false;
                $scope.ms.multiMenuBtns["removeSelected"].hidden = false;
                $scope.ms.multiMenuBtns["addSelected"].disabled = (notdownloaded > 0) ? false : true;
                $scope.ms.multiMenuBtns["removeSelected"].disabled = (downloaded > 0) ? false : true;
                $scope.ms.multiMenuBtns["ignoreSelected"].disabled = (notdownloaded > ignored) ? false : true;
            }
            else {
                notinstalled = notinstalled + notdownloaded + ignored + (inprogress - (paused + resumed));
                $scope.ms.multiMenuBtns["installSelected"].hidden = false;
                $scope.ms.multiMenuBtns["addSelected"].hidden = true;
                $scope.ms.multiMenuBtns["removeSelected"].hidden = true;
                $scope.ms.multiMenuBtns["installSelected"].disabled = (notinstalled > 0) ? false : true;
                $scope.ms.multiMenuBtns["ignoreSelected"].disabled = (notinstalled > ignored) ? false : true;
            }
            $scope.ms.multiMenuBtns["pauseSelected"].disabled = (resumed > 0) ? false : true;
            $scope.ms.multiMenuBtns["resumeSelected"].disabled = (paused > 0) ? false : true;
            $scope.ms.multiMenuBtns["cancelSelected"].disabled = ((paused + resumed) > 0) ? false : true;
        };

        $scope.setMultiMenuWidth = function () {
            $("#mm_menu").width($("#mm_btn").innerWidth() + $("#mm_icon").innerWidth() + 1);
        };

        $scope.onClickMultiMenu = function ($event, methodName, isDisabled) {
            if (isDisabled) {
                $event.stopPropagation();
                return false;
            } else {
                $scope[methodName]();
            }
        };
        /**************************** Multi action menu end ****************************/
        $scope.invokeCmd = function (cmd, isCancel) {
            var ret = CmdTarget.invoke(cmd);
            if (ret.Status.toLowerCase() == "error") {
                $scope.handleInvokeError(ret, isCancel);
            } else if (cmd.Action == "pause" && isCancel) {
                $scope.cancelConfirm(cmd.IDList);
            }
        };

        $scope.handleInvokeError = function (ret, addnFlag) {
            if (ret.ID == "-2") {
            	var errorRetryData =  ret.ErrorRetryData ? ret.ErrorRetryData : {},
            		retryParams = [errorRetryData, addnFlag];
                $scope.criticalError(ret.ID, ret.ErrorString, ret.ErrorRetry, retryParams);
            }
        };

        $scope.criticalError = function (errorCode, errorString, showRetry, retryParams) {
        	 var errorContent = errorString ? errorString : ("Error code: " + errorCode),
    		     showRetryBtn = (showRetry && showRetry.toLowerCase() == "yes") ? true : false,
    		     options = {
    		         id: "error",
    		         width: "390",
    		         dialogType: "warning",
    		         title: $scope.cs.appmanTitle,
    		         content: errorContent,
    		         controllerId: "appmgrMainCtrl",
    		         ok: {
    		             btnText: $scope.cs.okText
    		         },
    		         retry: {
    		             btnText: $scope.cs.retryText,
    		             method: "retryOnError",
    		             params: retryParams,
    		             show: showRetryBtn
    		         }
    		     };
            $.modaldialog(options);
        };

        $scope.retryOnError = function (retryParams) {
            $timeout(function () {
                $scope.invokeCmd(retryParams[0], retryParams[1]);
            }, 500);
        };

        $scope.retiredError = function () {
            var errorContent = $scope.cs.retiredErr1 + "<br/><br/>" + $scope.cs.retiredErr2 + "<br/><br/>" + $scope.cs.retiredErr3,
                options = {
                    id: "retired",
                    width: "480",
                    dialogType: "warning",
                    title: $scope.cs.retiredErrorTitle,
                    content: errorContent,
                    controllerId: "appmgrMainCtrl",
                    ok: {
   		             btnText: $scope.cs.okText,
   		             method: "closeAppWindow"
   		         	}
                };
            $.modaldialog(options);
        };

        /**
         * Method to enable or disable multi action buttons and update footer status 
         **/
        $scope.changeMultiAction = function () {
            var selected = _.size($scope.selectedAssets),
	            paused = $(".install-progress, .download-progress, .progress-wrapper:not(.hide)").find(".resume").length,
	            resumed = $(".install-progress, download-progress, .progress-wrapper:not(.hide)").find(".pause").length,
                notapplignored = $(".not-applicable-ignored").find(".check > input:checked:enabled").length,
                notdownloaded = $(".not-downloaded, .download-progress").find(".check > input:checked:enabled").length,
                notinstalled = $(".not-installed, .install-progress").find(".check > input:checked:enabled").length,
                downloaded = $(".downloaded").find(".check > input:checked:enabled").length;
            if (selected == 0 || notdownloaded + notinstalled + notapplignored + downloaded > 0) {
                if ($scope.isDeploymentMode) {
                    if (downloaded > 0 && notdownloaded == 0)
                        $scope.currentAction = "removeSelected";
                    else
                        $scope.currentAction = "addSelected";
                }
                else {
                    $scope.currentAction = "installSelected";
                }
            } else if (resumed > 0) {
                $scope.currentAction = "pauseSelected";
            } else if (paused > 0) {
                $scope.currentAction = "resumeSelected";
            }
            $scope.disableMultiAction = (selected > 0 ? false : true);
        };

        $scope.getFooterText = function () {
        	var selected = _.size($scope.selectedAssets);
            if (selected == 0) {
                 return $scope.cs.defaultFooterText[$scope.selectedTab];
            } else if (selected == 1) {
            	return ("(1) " + $scope.cs.dynamicFooterText[$scope.selectedTab][0]);
            } else {
            	return ("(" + selected + ") " + $scope.cs.dynamicFooterText[$scope.selectedTab][1]);
            }
        };

        /**
         * Method will be called upon selecting an asset
         */
        $scope.onCheck = function ($event, assetId) {
            if ($event.target.checked) {
                $scope.selectedAssets[assetId] = assetId;
            } else {
                delete $scope.selectedAssets[assetId];
            }
            $scope.changeMultiAction();
        };

        $scope.advise = function (advice) {
            if (advice.Source == "AppWindow" && advice.Signal == "ShowUpdates") {
                $scope.switchTab("updates");
            } else if (advice.Source == 'AssetMgr' && advice.Signal == "newAsset") {
                $scope.addReplaceAssets(advice.AssetList, false);
                $scope.loadAssets("updates");
            } else if (advice.Source == 'TransactionMgr' && advice.Signal == "transaction") {
            	var id = advice.ID;
            	$scope.transactionArr[id] = {};
            	$scope.transactionArr[id].IDList = advice.IDList;
            	$.each($scope.transactionArr[id].IDList, function(i, id) {
            		var check = $("#" + $scope.cs.escChar(id)),
            			parent = $(check).parents(".asset");
            		$(check).attr("disabled", true);
            		$scope.cs.enableDisableBtn($(parent).find(".install-btn"), false);
            		$scope.cs.enableDisableBtn($(parent).find(".ignore-btn"), false);
            		$scope.selectedAssets[id] = id;
        			delete $scope.errorArr[id];
            	});
            	$scope.changeMultiAction();
            } else if (advice.Source == 'AssetMgr' && advice.Signal == "assetChanged") {
                var aState = advice.State,
	                assetId = advice.ID;
                $scope.updateAssetState(assetId, aState);
                if (aState == $scope.ms.updateState["ignored"]) {
                    $scope.ignoreAsset(assetId);
                } else if (aState == $scope.ms.updateState["not-applicable"]) {
                    $scope.removeAsset(assetId);
                } else if (aState == $scope.ms.updateState["new"]) {
                    $scope.loadAssets("updates");
                } else if ($scope.isDeploymentMode
                           && (aState == $scope.ms.updateState["download-completed"] || aState == $scope.ms.updateState["not-downloaded"])) {
                    delete $scope.selectedAssets[assetId];
                } else if (aState == $scope.ms.updateState["installed"]) {
                    delete $scope.selectedAssets[assetId];
                }
            } else if (advice.Source == 'DownloadMgr' && advice.Signal == 'onlineStateChanged') {
                $scope.showStatusError = (advice.State == 0);
                $scope.statusErrorText = (advice.State == 0) ? $scope.cs.netUnAvailText : "";
            } else if (advice.Source == 'AutoUpdateMgr') { /* To handle non-forced self-update */
                if (advice.Signal == 'AdminDisallowSelfUpdate') {
                    $scope.retiredError();
                } else if (advice.Signal == 'SelfUpdateDownloadCanceled' && advice.ID && ($("#" + $scope.cs.escChar(advice.ID)).length > 0)) {
                	$scope.transactionEnded(advice.ID, false);
                } else if (advice.Signal == 'SelfUpdateDownloadError' || advice.Signal == 'InstallError') {
                    var escAssetId = advice.ID ? $scope.cs.escChar(advice.ID) : "";
                    if ($("#" + escAssetId).length > 0) {
                        $scope.transactionEnded(advice.ID, false);
                    }
                }
            } else if (advice.Source == 'CmdTargetMgr' && advice.Signal == "getAssetsFromSds") {
                $scope.getAssets("updates");
            } else if (advice.Source == 'AppSettingMgr' && advice.Signal == "settingChanged") {
                $scope.showStatusError = false;
            }
            /* Error Handling */
            if (advice.Signal == "error") {
                var id = advice.ID,
                    errorCode = parseInt(advice.ErrorCode, 10),
                    errorString = advice.ErrorString;
                if (id == -1) {
                    $scope.statusErrorText = (errorString ? errorString : "Error code: " + errorCode);
                    $scope.showStatusError = true;
                } else if (id == -2) {
                    $scope.criticalError(errorCode, errorString);
                } else if ($("#" + $scope.cs.escChar(id)).length > 0) {
                    /* Suppress the download canceled error(errorCode = 5) */
                    if ((advice.Source != "DownloadMgr" || errorCode != 5) && (errorCode != 2)) {
                        $scope.errorArr[id] = [errorCode, errorString];
                    }
                }
            }
            $scope.cs.safeApply($scope);
        };
        
        $scope.transactionStateChanged = function(id, state) {
            var parent = $("#" + $scope.cs.escChar(id)).parents(".asset");
            $scope.updateTransactionState(id, state);
            if (state == $scope.ms.transactionState["Queued"] || state == $scope.ms.transactionState["Downloading"]) {
                $scope.downloadQueued(id, parent, state);
            } else if (state == $scope.ms.transactionState["DownloadPaused"] || state == $scope.ms.transactionState["InstallPaused"]) {
                $scope.afterPaused(id);
            } else if (state == $scope.ms.transactionState["Downloaded"] || state == $scope.ms.transactionState["InstallQueued"]) {
                $scope.installQueued(id, parent, $scope.cs.assetProgressText[3]);
            } else if (state == $scope.ms.transactionState["Installing"]) {
                $scope.installing(id, parent, $scope.cs.assetProgressText[4]);
            } else if (state == $scope.ms.transactionState["Completed"]) {
                $scope.transactionEnded(id, true);
            } else if (state == $scope.ms.transactionState["Aborted"]) {
                $scope.transactionEnded(id, false);
            }
        };

		$scope.beginCopyToShare = function(id) {
		    console.log("beginCopyToShare");
			console.log($scope.cs.backupText);
			$scope.backupText = $scope.cs.backupText;
			$("#backup_info_"+id).html($scope.cs.backupText);
            $("#backup_info_"+id).removeClass("hide");
        };
		
		$scope.endCopyToShare = function(id) {
            $("#backup_info_"+id).addClass("hide");
        };
		
        $scope.progressChanged = function (id, bytesReceived, downloadSpeed, remainingTime, totalBytes) {
            if ($scope.showStatusError) {
            	$scope.showStatusError = false;
                $scope.cs.safeApply($scope);
            }
            if ($("#" + $scope.cs.escChar(id)).length > 0) {
                $scope.transactionArr[id].progress = {
                    "elementId": id,
                    "elementWidth": 102,
                    "downloadRatio": bytesReceived / totalBytes,
                    "totalSize": totalBytes,
                    "downloadSpeed": downloadSpeed,
                    "downloadFlag": true
                };
                $scope.cs.progressBar($scope.transactionArr[id].progress, false);
            }
        };

        $scope.removeAsset = function (assetId) {
            delete $scope.transactionArr[assetId];
            delete $scope.selectedAssets[assetId];
            delete $scope.errorArr[assetId];
            $scope.changeMultiAction();
        };

        $scope.ignoreAsset = function (assetId) {
            delete $scope.selectedAssets[assetId];
            $scope.changeMultiAction();
        };

        $scope.ignoreBtnState = function (state) {
            if (state == -2 || ($scope.isDeploymentMode && state == 7))
                return 'disabled';
            return '';
        }

        $scope.updateAssetState = function (assetId, state) {
        	var asset = _.find($scope.clientAssets, function (item) { return item.id == assetId })
        	asset.state = state;
        	if ($scope.isDeploymentMode) {
        	    if (state == 7) // download-completed
        	        asset.addnDetails[$scope.ms.statusText] = $scope.ms.assetStatus[5]; // "included"
        	    else
        	        asset.addnDetails[$scope.ms.statusText] = $scope.ms.assetStatus[4]; // "not included"
        	} else {
        	    if (state == 14) {
        	        asset.addnDetails[$scope.ms.statusText] = $scope.ms.assetStatus[1]; // "installed"
        	    }
        	}
        };
        
        $scope.updateTransactionState = function (assetId, state) {
        	$scope.transactionArr[assetId].state = state;
        };

        $scope.downloadQueued = function (assetId, parent, state) {
			$scope.transactionArr[assetId]["progress"] = {
				"elementId": assetId,
				"elementWidth": 102,
				"downloadRatio": $scope.transactionArr[assetId]["progress"] ? $scope.transactionArr[assetId]["progress"]["downloadRatio"] : 0,
				"totalSize": $scope.transactionArr[assetId]["progress"] ? $scope.transactionArr[assetId]["progress"]["totalSize"] : "",
				"downloadSpeed": $scope.transactionArr[assetId]["progress"] ? $scope.transactionArr[assetId]["progress"]["downloadSpeed"] : "",
				"downloadFlag": true
			};

			if ($scope.isDeploymentMode) {
			    $(parent).find(".install-btn").addClass("hide");
			    $(parent).find(".ignore-btn").addClass("hide");
			} else {
			    $(parent).find(".btn-wrapper").addClass("hide");
			}
            
			$(parent).find(".paused-text").addClass("in-visible");
			if (state == $scope.ms.transactionState["Queued"]) {
				$(parent).find(".progress-detail-info").text($scope.cs.assetProgressText[0]);
			}
			$(parent).find(".toggle-icon").removeClass("resume").addClass("pause");
			$(parent).find(".progress-bar, .progress-wrapper").removeClass("hide");
			$("#" + $scope.cs.escChar(assetId)).attr("disabled",true);
			$scope.selectedAssets[assetId] = assetId;
			delete $scope.errorArr[assetId];
			$scope.changeMultiAction();
    	};

        $scope.installQueued = function (assetId, parent, statusText) {
            if ($scope.isDeploymentMode) {
                // only hide "ignore" in btn-wrapper, but not the -
                // - "install" button in deployment mode, as it can be used for removal
                $(parent).find(".install-btn").removeClass("hide");
                $(parent).find(".ignore-btn, .progress-bar").addClass("hide");
            } else {
                $(parent).find(".btn-wrapper, .progress-bar").addClass("hide");
            }
			$(parent).find(".progress-detail-info").text("");
			$(parent).find(".progress-wrapper, .install-bar").removeClass("hide");
			$scope.endCopyToShare(assetId);
			$(parent).find(".install-bar-text").text(statusText);
			$("#" + $scope.cs.escChar(assetId)).attr("disabled",true);
			$scope.selectedAssets[assetId] = assetId;
			delete $scope.errorArr[assetId];
			$scope.changeMultiAction();
    	};

    	$scope.installing = function(assetId, parent, statusText) {
            $scope.installQueued(assetId, parent, $scope.cs.assetProgressText[4]);
            $(parent).find(".toggle-icon, .cancel, .paused-text").addClass("in-visible");
            /* Disable multi action button if there is only one Install */
            if ($(".install-progress, .download-progress").find(".check > input:checked").length == 1 && _.size($scope.selectedAssets) == 1) {
                $scope.showMultiMenu = false;
                $scope.disableMultiAction = true;
            }
    	}
    	
    	 $scope.transactionEnded = function(assetId, isTransactionSuccess) {
    	     $scope.postStatus(assetId, isTransactionSuccess);
	         $scope.resetProgress(assetId);
	         $scope.cs.safeApply($scope);
    	 };
    	
        /**
         * Method to change the asset status in the UI after the transaction fail or success
         **/
    	 $scope.postStatus = function (assetId, isTransactionSuccess) {
        	var dependentAssets = $scope.transactionArr[assetId].IDList;
        	$.each(dependentAssets, function(i, id) {
        		var check = $("#" + $scope.cs.escChar(id)), 
        			parent = $(check).parents(".asset");
        		if (isTransactionSuccess) {
        		    if ($scope.isDeploymentMode) {
        		        $(check).attr("disabled", false);
        		        $(parent).find(".install-bar, .progress-wrapper").addClass("hide");
        		        $(parent).find(".install-btn").removeClass("hide");
        		        $scope.cs.enableDisableBtn($(parent).find(".install-btn"), true);
        		    } else {
        		        $(parent).find(".install-bar, .progress-wrapper, .btn-wrapper").addClass("hide");
        		    }
        		} else {
        		    $(check).attr("disabled", false);
        		    $scope.cs.enableDisableBtn($(parent).find(".install-btn"), true);
        		    $scope.cs.enableDisableBtn($(parent).find(".ignore-btn"), true);
        		    $(parent).find(".install-bar, .progress-wrapper").addClass("hide");
        		    $(parent).find(".btn-wrapper").removeClass("hide");
        		    if ($scope.isDeploymentMode) {
        		        $(parent).find(".install-btn").removeClass("hide");
        		    }
        		    $(parent).find(".toggle-icon").removeClass("resume").addClass("pause");
        		    $(parent).find(".paused-text").addClass("in-visible");
                 }
                 delete $scope.selectedAssets[id];
                 $(parent).find(".progress-detail-info, .install-bar-text").text("");
        	});
            if ($scope.showMultiMenu) {
                $scope.setMultiMenuWidth();
            }
            delete $scope.transactionArr[assetId];
            $scope.changeMultiAction();
        };

        /**
         * Method to retain the download or install progress information during sorting
         **/
        $scope.retainProgress = function () {
            for (var assetId in $scope.transactionArr) {
                var state = $scope.transactionArr[assetId]["state"],
                    downloadRatio = $scope.transactionArr[assetId]["progress"]["downloadRatio"],
                    check = $("#" + $scope.cs.escChar(assetId)),
                    parent = $(check).parents(".asset");
                if ($(check).length > 0) {
                    if (state == $scope.ms.transactionState["Queued"] || state == $scope.ms.transactionState["Downloading"] || state == $scope.ms.transactionState["DownloadPaused"]) {
                        $(check).attr("disabled", true);
                        $(parent).find(".btn-wrapper").addClass("hide");
                        $scope.cs.progressBar($scope.transactionArr[assetId].progress, false);
                        if (state == $scope.ms.transactionState["Queued"] || (state == $scope.ms.transactionState["DownloadPaused"] && downloadRatio == 0)) {
                            $(parent).find(".progress-detail-info").text($scope.cs.assetProgressText[0]);
                        }
                        if (state == $scope.ms.transactionState["DownloadPaused"]) {
                            $(parent).find(".toggle-icon").removeClass("pause").addClass("resume");
                            $(parent).find(".cancel, .toggle-icon, .paused-text").removeClass("in-visible");
                        }
                        $(parent).find(".progress-wrapper").removeClass("hide");
                    } else if (state == $scope.ms.transactionState["Downloaded"] || state == $scope.ms.transactionState["InstallQueued"] || state == $scope.ms.transactionState["Installing"] || state == $scope.ms.transactionState["InstallPaused"]) {
                        if ($scope.isDeploymentMode) {
                            $(check).attr("disabled", false);
                            // only hide "ignore" in btn-wrapper, but not the -
                            // - "install" button in deployment mode, as it can be used for removal
                            $(parent).find(".install-btn").removeClass("hide");
                            $(parent).find(".ignore-btn, .progress-bar").addClass("hide");
                        } else {
                            $(check).attr("disabled", true);
                            $(parent).find(".btn-wrapper, .progress-bar").addClass("hide");
                        }
                        $(parent).find(".progress-wrapper, .install-bar").removeClass("hide");
                        $(parent).find(".install-bar-text").text(state == $scope.ms.transactionState["Installing"] ? $scope.cs.assetProgressText[4] : $scope.cs.assetProgressText[3]);
                        if (state == $scope.ms.transactionState["InstallPaused"]) {
                            $(parent).find(".toggle-icon, .cancel, .paused-text").removeClass("in-visible");
                            $(parent).find(".toggle-icon").removeClass("pause").addClass("resume");
                        }
                    }
                }
            }
        };

        $scope.cancelConfirm = function (assetIds) {
            var refPosition = $scope.cancelAllClicked ? $("#mm_icon") : $("#" + $scope.cs.escChar(assetIds[0])).parents(".asset").find(".cancel");
            $scope.cancelTitle = $scope.cancelAllClicked ? $scope.cs.cancelConfirmStrings["p"][0] : $scope.cs.cancelConfirmStrings["s"][0];
            $scope.cancelContent = $scope.cancelAllClicked ? $scope.cs.cancelConfirmStrings["p"][1] : $scope.cs.cancelConfirmStrings["s"][1];;
            $scope.positionCancelConfirm(refPosition);
            $scope.showCancelConfirm = true;
        };

        $scope.positionCancelConfirm = function (refPosition) {
            var winHeight = $(window).height(),
                confirmLeft = $(refPosition).offset().left - 270,
                confirmTop = $(refPosition).offset().top;
            if ((winHeight - confirmTop) > 150) {
                $(".cc-wrapper").removeClass("top").addClass("bottom");
                confirmTop += 38;
            } else {
                $(".cc-wrapper").removeClass("bottom").addClass("top");
                confirmTop -= 137;
            }
            $(".cc-wrapper").css({
                left: confirmLeft,
                top: confirmTop
            });
        };

        /**
         * Method to be called on clicking Yes from Cancel confirmation popup 
         **/
        $scope.cancelYes = function () {
        	$.each($scope.cancelIds, function (i, cancelId) {
        		var isDisabled = $("#" + $scope.cs.escChar(cancelId)).attr("disabled");
        		if (!isDisabled) {
        			/* Deselect the updates which are not in transaction */
                    delete $scope.selectedAssets[cancelId];
                }
            });
            $scope.showCancelConfirm = false;
            if ($scope.cancelAllClicked) {
            	$scope.cancel(_.keys($scope.transactionArr));
            } else {
            	$scope.cancel($scope.cancelIds);
            }
        };
        
        $scope.cancelNo = function () {
            $.each($scope.cancelIds, function (i, cancelId) {
                var parent = $("#" + $scope.cs.escChar(cancelId)).parents(".asset");
                $(parent).find(".toggle-icon").removeClass("resume").addClass("pause");
                $(parent).find(".toggle-icon, .cancel, .paused-text").addClass("in-visible");
            });
            $scope.showCancelConfirm = false;
            $scope.changeMultiAction();
            if ($scope.cancelAllClicked) {
            	$scope.resume(_.keys($scope.transactionArr));
            } else {
            	$scope.resume($scope.cancelIds);
            }
        };

        $scope.resetProgress = function(assetId) {
            var progress = {
                "elementId": assetId,
                "elementWidth": 102,
                "downloadRatio": 0,
                "totalSize": "",
                "downloadSpeed": "",
                "downloadFlag": true
            };
            $scope.cs.progressBar(progress, false);
        }
        
        /**
         * More Assets modal dialog
         **/
        $scope.moreAssets = function (depIds) {
            var template = $scope.getAlsoIncludesTemplate(depIds, true),
            	options = {
                    id: "more_assets_modal",
                    width: "485",
                    title: $scope.ms.alsoIncludesText,
                    content: template,
                    controllerId: "appmgrMainCtrl",
                    ok: {
                        btnText: $scope.cs.okText
                    }
                };
            $.modaldialog(options);
            $(".also-includes img").fallbackThumbIcon($scope.ms.fallbackThumbUrl);
        };
        
        $scope.loadAlsoIncludes = function ($event, depIds) {
        	var alsoIncludeSection = $($event.target).parents(".more-info-wrapper").find(".also-includes-wrapper");
        	if ($(alsoIncludeSection).is(":empty")) {
                $(alsoIncludeSection).html($scope.getAlsoIncludesTemplate(depIds.slice(0,4), false));
        	}
        	$(".also-includes img").fallbackThumbIcon($scope.ms.fallbackThumbUrl);
        };

        /** 
         * Method which returns the Also includes section dynamic template
         **/
        $scope.getAlsoIncludesTemplate = function (depIds, includeClearBoth) {
        	var dependentAssets = _.map(depIds, function (id) {
                	return $scope.getDependentAsset($scope.clientAssets, id);
	            }),
	            nonEmptyAssets = _.filter(dependentAssets, function (item) {
	                return item;
	            });
	        return _.template($("#also_includes_template").html(), {"assets": nonEmptyAssets, "includeClearBoth": includeClearBoth});
        };
        
        $scope.getDependentAsset = function (assets, id) {
            return _.find(assets, function (item) {
                return item.id == id;
            });
        };

        $scope.getDependentInfo = function (assets, id) {
            var asset = $scope.getDependentAsset(assets, id);
            return {
                "id": id,
                "displayName": asset.displayName,
                "shortDesc": asset.shortDesc,
                "severity": $scope.ms.getSeverity(asset.severity),
                "viewFullDetail": $scope.ms.goToFullDetailsText,
                "isListed": ($("#" + $scope.cs.escChar(id)).length > 0 ? true : false)
            }
        };

        $scope.checkForValidAssets = function (assets) {
            var validAsset = _.find(assets, function (item) {
                return item.state != $scope.ms.updateState["not-applicable"] && item.visible == 1 && (item.state == $scope.ms.updateState["installed"] || item.publishState.toLowerCase() != "retired")
            });
            return validAsset ? true : false;
        };

        $scope.localize = function() {
    		arb.localizeHtml();
    	};
    	
    	$scope.closeAppWindow = function () {
            var cmd = {
                Target: 'AppWindow',
                Action: 'close'
            };
            $scope.invokeCmd(cmd);
        };
        
        $scope.getNavClass = function (tabName) {
            return {
                'selected': $scope.selectedTab == tabName,
                'prev-clicked': $scope.selectedTab == tabName
            };
        };

        $scope.switchTab = function (tabName) {
            $scope.selectedTab = tabName;
            $scope.showFooter = (tabName == "welcome" ? $scope.showStatusError : true);
            
            if(tabName == "updates" && !$("#tab_updates").hasClass("visited")) {
            	$(".app-loading").removeClass("hide");
            	$("#tab_updates").addClass("visited");
            	$scope.getAssets("updates");
            }
        };

        $scope.getNavClass = function (tabName) {
            return {
                'selected': $scope.selectedTab == tabName,
                'prev-clicked': $scope.selectedTab == tabName
            };
        };
        /*********************** Main window events **********************/
        angular.element(document).ready(function () {
            arb.localizeHtml();
            loadLocaleStyles("main");
            $('.custom-select').selectpicker();
            $(".main_nav li a").each(function () {
                $(this).width($(this).width() + 12);
            });
            try {
                CmdTarget.advice.connect($scope.advise);
                CmdTarget.transactionStateChanged.connect($scope.transactionStateChanged);
				CmdTarget.beginCopyToShare.connect($scope.beginCopyToShare);
                CmdTarget.progressChanged.connect($scope.progressChanged);
            } catch (e) {
                alert(e);
            }

	        $(document).on("mouseenter", ".main_nav li a", function () {
	            $('.main_nav li a.prev-clicked').removeClass("selected");
	            $(this).addClass("selected");
	        });
	
	        $(document).on("mouseleave", ".main_nav li a", function () {
	            if (!$(this).hasClass("prev-clicked")) {
	                $(this).removeClass("selected");
	                $(".main_nav li a.prev-clicked").addClass("selected");
	            }
	        });
	
	        $(document).on("mouseenter", ".asset", function () {
	            $(this).addClass("asset-hover");
	        });
	
	        $(document).on("mouseleave", ".asset", function () {
	            if ($(this).next(".more-info-wrapper").hasClass("hide")) {
	                $(this).removeClass("asset-hover");
	            }
	        });
	
	        $(document).on("click", ".asset", function (e) {
	            var eTarget = e.target ? e.target : e.srcElement;
	            if (eTarget && !($(eTarget).is(".action"))) {
	            	$(this).addClass("asset-hover");
	                $(this).find(".arrow").toggleClass("collapse-detail expand-detail");
	                $(this).find(".secondary-row, .ignore-btn").toggleClass("hide");
	                $(this).next(".more-info-wrapper").toggleClass("hide");
	            }
	            $scope.markAssetAsVisited($(this).find("input:checkbox").attr("id"));
	        });
	        
	        $(document).on("click", ".also-includes .product", function () {
	        	var key = $(this).data("key"), 
	        		data = $scope.getDependentInfo($scope.clientAssets, key);
	        	$(this).tooltip("show", {
                    content: _.template($("#asset_info_tool_tip").html(), data),
                    type: "info-black",
                    placement: "top-center",
                    showClose: true,
                    width: 340
	            });
	        });
	        
	        $(document).on("click", ".view-full-detail", function () {
	        	var id = $(this).data("key"),
	        		asset = $("#table_" + $scope.cs.escChar(id)); 
	        	$(this).tooltip("hide");
	        	$(asset).addClass("asset-hover");
                $(asset).find(".arrow").addClass("expand-detail").removeClass("collapse-detail");
                $(asset).find(".secondary-row, .ignore-btn").removeClass("hide");
                $(asset).next(".more-info-wrapper").removeClass("hide");
                $(asset).parents(".panel-wrapper").scope().show = true;
                $(asset).scope().selectedSubNav = "details";
                $scope.cs.safeApply($scope);
                if ($(".md-close").length > 0) {
                	$(".md-close").click();
                }
                var panelTop = $("#tab_" + $scope.selectedTab).find(".panel-wrapper:first").position().top,
	                absPanelTop = panelTop < 0 ? ((panelTop * -1) + 15) : (panelTop - 15),
	                assetTop = $(asset).position().top + absPanelTop;
	        	$(".scrollable").animate({
	                scrollTop: assetTop + 'px'
	            }, 1000);
	        	$scope.markAssetAsVisited(id);
	        });
	
	        $(document).on("mouseenter", ".progress-wrapper", function () {
	            var id = $(this).attr("id").split("progress_")[1];
	            if (($scope.transactionArr[id]["state"] != $scope.ms.transactionState["Installing"])) {
	                $(this).find(".toggle-icon, .cancel").removeClass("in-visible");
	            }
	        });
	
	        $(document).on("mouseleave", ".progress-wrapper", function () {
	            if (!$scope.showCancelConfirm && $(this).find(".toggle-icon").hasClass("pause")) {
	                $(this).find(".toggle-icon, .cancel").addClass("in-visible");
	            }
	        });
	
	        $(document).on("mouseenter", ".upd-err", function () {
	            var id = $(this).parents(".asset").attr("id").split("table_")[1],
	                errCont = ($scope.errorArr[id] && $scope.errorArr[id][1]) ? $scope.errorArr[id][1] : "Error code: " + $scope.errorArr[id][0];
	            $(this).tooltip("show", {
	                title: $scope.cs.appmanTitle,
	                content: errCont
	            });
	        });
	        
	        $(document).on("click", ".long-desc a", function(e) {
	        	e.preventDefault();
	        	$scope.cs.openURLInBrowser($(this).attr("href"));
	        });
	
	        $(document).on("contextmenu", document.body, function (e) {
	            return false;
	        });
	        
	        $(".scrollable").scroll(function (e) {
	        	$(this).tooltip("hide");
	        });
	        
	        $(window).resize(function () {
	        	/* To position the cancel confirmation popup on window re-size */
	            if ($scope.showCancelConfirm) {
	                if ($scope.cancelAllClicked) {
	                    $scope.positionCancelConfirm($("#mm_icon"));
	                } else {
	                    var asset = $("#" + $scope.cs.escChar($scope.cancelIds[0])).parents(".asset"),
	                        panelTop = $("#tab_" + $scope.selectedTab).find(".panel-wrapper:first").position().top,
	                        absPanelTop = panelTop < 0 ? ((panelTop * -1) + 15) : panelTop,
	                        assetTop = $(asset).position().top + $(asset).height() + absPanelTop,
	                        scrollHeight = $(".scrollable").height(),
	                        scrollTop = (assetTop > scrollHeight) ? (assetTop - scrollHeight) : 0;
	                    $(".scrollable").scrollTop(scrollTop);
	                    $scope.positionCancelConfirm($(asset).find(".cancel"));
	                }
	            }
	        });

                $scope.getAssets("updates");
        });
    }
]);

// SIG // Begin signature block
// SIG // MIIZewYJKoZIhvcNAQcCoIIZbDCCGWgCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFDtQ3jkBFqwO
// SIG // mLHc7RLzicKjsycDoIIUMDCCA+4wggNXoAMCAQICEH6T
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
// SIG // 9w0BCQQxFgQUNVR1K0PuWYRHdsQWQbDyzXjiIaAwVAYK
// SIG // KwYBBAGCNwIBDDFGMESgJoAkAEEAdQB0AG8AZABlAHMA
// SIG // awAgAEMAbwBtAHAAbwBuAGUAbgB0oRqAGGh0dHA6Ly93
// SIG // d3cuYXV0b2Rlc2suY29tIDANBgkqhkiG9w0BAQEFAASC
// SIG // AQB2Qtk2qG56hc1Bpj0fO2qLa8ih9Wx4L91PsFdSJSud
// SIG // rmlZ9v4SdZcNrE5pHUxPSki6DpzWhIjpfaQQ4H0JIhRd
// SIG // NgnUb2bPOSHmihMpEyIjuLd4InvTW2X82Dptkb5Z8i4i
// SIG // XtU8KFgUvqDWr45Fbt4sSl2mSTe5Ko1C2fMC7Gry1H4C
// SIG // gA/hKhH3piFMGSfmpDoUNCWnIU4JGYyfHowtZirOyq8V
// SIG // 4fK8uukIiSSK1DNNOH5rvjq+OA0kMBjjd9ARmSLGBaZj
// SIG // kPCqPBJCcuk9hYVp1ycLBDn2JWWp5+b+P1XD2N07SyMd
// SIG // yJSqUrdMHyBs0p1QFQSkyI/MbH6TZ5o4p9hMoYICCzCC
// SIG // AgcGCSqGSIb3DQEJBjGCAfgwggH0AgEBMHIwXjELMAkG
// SIG // A1UEBhMCVVMxHTAbBgNVBAoTFFN5bWFudGVjIENvcnBv
// SIG // cmF0aW9uMTAwLgYDVQQDEydTeW1hbnRlYyBUaW1lIFN0
// SIG // YW1waW5nIFNlcnZpY2VzIENBIC0gRzICEA7P9DjI/r81
// SIG // bgTYapgbGlAwCQYFKw4DAhoFAKBdMBgGCSqGSIb3DQEJ
// SIG // AzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTE1
// SIG // MDczMDAzNDAyNlowIwYJKoZIhvcNAQkEMRYEFHbZylzr
// SIG // fUlhYBxu+34Tik2FMb3mMA0GCSqGSIb3DQEBAQUABIIB
// SIG // ABVaR6LGjSnILWAzK3uevkTIVLL3Y5DekrjhMhefB+S/
// SIG // mFjsX2z6kuprV6o2g5EYSe31v3j+7e5C58nYubFou7bn
// SIG // w34A7gEW3VJLEQ0tROC3sbQTbUZKj64scJhxHPkDko+K
// SIG // CeSN06120jjrepWNe6Hrm0ozvhrpO+Keder7R+Aw8n5m
// SIG // eFeztOlBUCMSTA1A8tS8rNPyfsUqmYNw2+76YVov8Pip
// SIG // EsS30qLd2zK26bwgCyttCQEpD5FDE5AJaDf/lq94gH22
// SIG // /RiXNpoNbgQ9PHgaXJReO88ycaMnm2on9esOaG3Cgfsw
// SIG // FmWKxbHkB+3K51NhIQklme0GeOWcbFcQGD0=
// SIG // End signature block
