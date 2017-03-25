angular.module("common-service", []).service('commonService', function ($rootScope) {
    this.openURLInBrowser = function (url) {
        CmdTarget.openUrl(url);
    };

    this.isDeployment = function () {
        var search = window.location.search.split("=");
        for (i = 0; i < search.length - 1; i++) {
            if (search[i] == "?mode" && search[i + 1]) {
                return search[i + 1] == "deployment";
            }
        }
        return false;
    };

	this.openReleaseNotes = function (url) {
	        var cmd = {
            Target: 'AppWindow',
            Action: 'openReleaseNotes',
			URL: url
        };
        CmdTarget.invoke(cmd);
	};
	
    this.showMainWindow = function () {
        var cmd = {
            Target: 'AppWindow',
            Action: 'showMainWindow'
        };
        CmdTarget.invoke(cmd);
    };

    this.openHelp = function () {
        var cmd = {
            Target: 'AppWindow',
            Action: 'mainhelp'
        };
        CmdTarget.invoke(cmd);
    };

    this.closeAlertWindow = function () {
        var cmd = {
            Target: 'AppWindow',
            Action: 'hideAlertWindow'
        };
        CmdTarget.invoke(cmd);
    };

    this.localeTime = function (date) {
        return Globalize.format(date ? date : new Date(), 't');
    };

    this.removeScripts = function(txt) {
    	var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    	return txt.replace(SCRIPT_REGEX, "");
    };
    
    this.getTime = function () {
        return this.localeTime();
    };

    this.parseUTC = function (date) {
        /* This method parse the date in "2013-10-14T22:16:52+0000" or "2013-10-14T22:16:52+00" or "2013-10-14T22:16:52z" format */
        var checkIndex = date.length - 3,
            charAtIndex = date.charAt(checkIndex);
        if ((date.toLowerCase().indexOf('z') == -1) && charAtIndex != ":" && charAtIndex != "+" && charAtIndex != "-") {
            date = date.slice(0, checkIndex + 1) + ":" + date.slice(checkIndex + 1);
        }
        return new Date(Date.parse(date));
    };

    this.localeDate = function (date) {
        return Globalize.format(date, 'd');
    };

    this.enableDisableBtn = function (btn, enable) {
        var button = (typeof btn == "string") ? $("#" + btn) : btn;
        if (enable) {
            $(button).removeClass("disabled");
        } else {
            $(button).addClass("disabled");
        }
    };

    this.progressBar = function (progressArr, showRemainTime) {
        var escAssetId = this.escChar(progressArr["elementId"]),
            element = $("#progress_" + escAssetId),
            downloadRatio = progressArr["downloadRatio"],
            elementWidth = progressArr["elementWidth"];
        if (element.length > 0) {
            if (progressArr["downloadFlag"]) {
                var percent = isNaN(downloadRatio) ? 0 : Math.round(downloadRatio * 100),
                    downloadSpeed = this.convertBytes(progressArr["downloadSpeed"], 0, true),
                    totalSize = this.convertBytes(progressArr["totalSize"], 1, false),
                    progressWidth = (Math.round(downloadRatio * elementWidth)) + "px";
                $(element).find(".download-bar").animate({
                    width: progressWidth
                }, 0);
                if (downloadSpeed != "" && totalSize != "") {
                    $("#progress_info_" + escAssetId).text(percent + "% - " + totalSize + " - " + downloadSpeed);
                }
                if (showRemainTime) {
                    var remainingTime = this.convertSeconds(progressArr["remainingTime"]);
                    $("#remain_" + escAssetId).html(this.boldNumerals(remainingTime) + " " + this.remainingText);
                }
            } else {
                var progressWidth = (Math.round(downloadRatio * elementWidth)) + "px";
                $(element).find(".install-bar").animate({
                    width: progressWidth
                }, 0);
            }
        }
    };

    /* Method to convert bytes into readable format */
    this.convertBytes = function (bytes, precision, isSpeed) {
        var kilobyte = 1024,
            megabyte = kilobyte * 1024,
            gigabyte = megabyte * 1024,
            terabyte = gigabyte * 1024;
        if ((bytes >= 0) && (bytes < kilobyte)) {
            return bytes + (isSpeed ? this.speedStrings[0] : " " + this.sizeStrings[0]);
        } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
            return (bytes / kilobyte).toFixed(precision) + (isSpeed ? this.speedStrings[1] : " " + this.sizeStrings[1]);
        } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
            return (bytes / megabyte).toFixed(precision) + (isSpeed ? this.speedStrings[2] : " " + this.sizeStrings[2]);
        } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
            return (bytes / gigabyte).toFixed(precision) + (isSpeed ? this.speedStrings[3] : " " + this.sizeStrings[3]);
        } else if (bytes >= terabyte) {
            return (bytes / terabyte).toFixed(precision) + (isSpeed ? this.speedStrings[4] : " " + this.sizeStrings[4]);
        } else {
            return "";
        }
    };

    /* Method to convert seconds to a readable time format */
    this.convertSeconds = function (seconds) {
        var seconds = (seconds > 0 ? seconds : 0),
            years = Math.floor(seconds / 31536000),
            days = Math.floor((seconds % 31536000) / 86400),
            hours = Math.floor(((seconds % 31536000) % 86400) / 3600),
            minutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60),
            seconds = (seconds < 60) ? seconds : (((seconds % 31536000) % 86400) % 3600) % 60,
            str = "";
        if (years > 0) {
            str += (years + (years == 1 ? " " + this.timeStrings["s"][6] + " " : " " + this.timeStrings["p"][6] + " "));
        }
        if (days > 0) {
            str += (days + (days == 1 ? " " + this.timeStrings["s"][3] + " " : " " + this.timeStrings["p"][3] + " "));
        } else if (years > 0) {
            str += "0 " + timeStrings["s"][3] + " ";
        }
        if (hours > 0) {
            str += (hours + (hours == 1 ? " " + this.timeStrings["s"][2] + " " : " " + this.timeStrings["p"][2] + " "));
        } else if (years > 0 || days > 0) {
            str += " 0 " + timeStrings["s"][2] + " ";
        }
        if (minutes > 0) {
            str += (minutes + (minutes == 1 ? " " + this.timeStrings["s"][1] + " " : " " + this.timeStrings["p"][1] + " "));
        } else if (years > 0 || days > 0 || hours > 0) {
            str += " 0 " + timeStrings["s"][1] + " ";
        }
        str += (seconds + (seconds <= 1 ? " " + this.timeStrings["s"][0] : " " + this.timeStrings["p"][0]));
        return str;
    };

    this.escChar = function (str) {
        return (typeof str == "string") ? (str).replace(/([^a-zA-Z0-9])/g, '\\$1') : str;
    };

    this.boldNumerals = function (str) {
        return str.replace(/(\d+)/g, "<b>$1</b>");
    };

    this.noSort = function (obj) {
        if (!obj) {
            return [];
        } else {
            return Object.keys(obj);
        }
    };

    this.safeApply = function ($scope, fn) {
        var phase = $scope.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn) {
                $scope.$eval(fn);
            }
        } else {
            if (fn) {
                $scope.$apply(fn);
            } else {
                $scope.$apply();
            }
        }
    };

    this.defaultFooterText = {
        "software": arb.msg(r$.default_footer_text, r$.sw_label),
        "updates": arb.msg(r$.default_footer_text, r$.prod_label),
        "apps": arb.msg(r$.default_footer_text, r$.apps_label)
    };
    this.dynamicFooterText = {
        "software": [arb.msg(r$.dynamic_footer_text, r$.sw_label), arb.msg(r$.dynamic_footer_text, r$.sws_label)],
        "updates": [arb.msg(r$.dynamic_footer_text, r$.prod_label), arb.msg(r$.dynamic_footer_text, r$.prods_label)],
        "apps": [arb.msg(r$.dynamic_footer_text, r$.apps_label), arb.msg(r$.dynamic_footer_text, r$.apps_label)]
    };
    this.btnArray = {
        "s": [r$.install_label, r$.pause_label, r$.resume_label, r$.cancel_label, r$.ignore_label, r$.add_label, r$.remove_label],
        "p": [r$.install_sel_label, r$.pause_sel_label, r$.resume_sel_label, r$.cancel_sel_label, r$.ignore_sel_label, r$.add_sel_label, r$.remove_sel_label]
    };
    this.timeStrings = {
        "s": [r$.sec_label, r$.min_label, r$.hour_label, r$.day_label, r$.week_label, r$.month_label, r$.year_label],
        "p": [r$.sec_label, r$.mins_label, r$.hours_label, r$.days_label, r$.weeks_label, r$.months_label, r$.years_label]
    };
    this.cancelConfirmStrings = {
        "s": [r$.cancel_label, r$.cancel_conf_label],
        "p": [r$.cancel_all_label, r$.cancel_all_conf_label]
    };
    this.sizeStrings = ["B", "KB", "MB", "GB", "TB"];
    this.speedStrings = ["Bps", "Kbps", "Mbps", "Gbps", "Tbps"];
    this.assetProgressText = [r$.ap_pending_download, r$.ap_downloading, r$.ap_download_paused, r$.ap_pending_install, r$.ap_installing, r$.ap_install_paused];
    this.remainingText = r$.rem_label;
    this.activeText = r$.active_label;
    this.allPaused = r$.all_paused;
    this.netUnAvailText = r$.net_unavail_label;
    this.okText = r$.ok_label;
    this.retryText = r$.retry_label;
    this.todayAt = r$.today_at;
    this.successText = r$.sr_updated_label;
    this.installFailedText = r$.insfailed_err;
    this.dwldFailedText = r$.dwldfailed_err;
    this.hostNotFoundText = r$.host_not_found_err;
    this.viewDetailsText = r$.view_details;
    this.pausedText = r$.paused_label;
	this.backupText = r$.backup_label;
    this.appmanTitle = "Autodesk Application Manager";
    this.retiredErrorTitle = r$.retired_err_title;
    this.retiredErr1 = r$.retired_err1;
    this.retiredErr2 = r$.retired_err2;
    this.retiredErr3 = r$.retired_err3;
});

// SIG // Begin signature block
// SIG // MIIZewYJKoZIhvcNAQcCoIIZbDCCGWgCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFIiPgXWfcZV1
// SIG // rfIZiH48UyksmeEmoIIUMDCCA+4wggNXoAMCAQICEH6T
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
// SIG // 9w0BCQQxFgQU+24Yw+ylsoJwKwI45SJPAV13yg0wVAYK
// SIG // KwYBBAGCNwIBDDFGMESgJoAkAEEAdQB0AG8AZABlAHMA
// SIG // awAgAEMAbwBtAHAAbwBuAGUAbgB0oRqAGGh0dHA6Ly93
// SIG // d3cuYXV0b2Rlc2suY29tIDANBgkqhkiG9w0BAQEFAASC
// SIG // AQB2xw5goVxnNv6b4vrBHe9VvFSSiU2TiLeSXmNbK/1a
// SIG // X+3fH2GDYtPTU+H7QqwmlpoivwRJeF7yYLZXn7UPF0A4
// SIG // lbu0YEp7akHO++hON4hIT26xoY3XtnHt0gL8i4Qi8ZFO
// SIG // /ZhnKibYdrZMKexPbKHDfHc2e+soKdXLySSNQnr1+5dX
// SIG // 3BxGNNbRLtQ9pYEQFv/osAQKUGXK38QMGFqLnbVuWzxW
// SIG // +TxAZIqJx6B+xLrdwp8ur5yEW7InYyfqfDloz5KNaHYg
// SIG // syY44PALXvqfQ7u2Ux+/CCw7tjn8fmkmz4pSXHAl9Vq2
// SIG // KxjnpTY3oxvarLu/do5KC2FLNhw7w42SU2n/oYICCzCC
// SIG // AgcGCSqGSIb3DQEJBjGCAfgwggH0AgEBMHIwXjELMAkG
// SIG // A1UEBhMCVVMxHTAbBgNVBAoTFFN5bWFudGVjIENvcnBv
// SIG // cmF0aW9uMTAwLgYDVQQDEydTeW1hbnRlYyBUaW1lIFN0
// SIG // YW1waW5nIFNlcnZpY2VzIENBIC0gRzICEA7P9DjI/r81
// SIG // bgTYapgbGlAwCQYFKw4DAhoFAKBdMBgGCSqGSIb3DQEJ
// SIG // AzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTE1
// SIG // MDczMDAzNDAyOFowIwYJKoZIhvcNAQkEMRYEFPDclKl7
// SIG // yWi0zHkqUgg/fXcK89C0MA0GCSqGSIb3DQEBAQUABIIB
// SIG // AE5/1/o1Kg7Cw8o8YqkdQ6RIr8T4OQD/ZYI2Ui3lW20C
// SIG // iXanyiWwDMhvJyiktBo5YJDQ92CHvK8oTfCwIN9lllBt
// SIG // j/C7vgGq99EgKMCIndN1XKg9SzrUuHTNmgJC1MMKLoA/
// SIG // bLv9rHIi0+JrqNjeIB0/K8WpAY0BKA9dJChDHhR3DOEm
// SIG // 0/JVT+IpAxU+Yx22kvCGXBOq28D0MgkN6YeTv0VhM/2u
// SIG // 9BvH2JsjGyduz0xTu+oBuPU/fhZ5cKw1XMsLKZYljBeS
// SIG // sTkEhBwafctmFccUgXNz6hP8sBzufA/nOxqjsVSAAx8q
// SIG // PL/DsQD43Bg5AFQeb8vsAaLfeE5jFmPGVRE=
// SIG // End signature block
