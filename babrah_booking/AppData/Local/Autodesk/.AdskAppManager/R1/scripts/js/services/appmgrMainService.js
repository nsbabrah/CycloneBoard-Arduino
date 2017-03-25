appmgrMainApp.service('mainService', function (commonService) {
    this.getAssetClass = function (state, publishState) {
        return {
            'not-applicable-ignored': (state == -2 || publishState.toLowerCase() == "retired"),
            'downloaded': state == 7,
            'installed': state == 14,
            'not-downloaded': (state == 0 || state == 1 || state == 5 || state == 6),
            'not-installed': (state == 8 || state == 12 || state == 13),
            'download-progress': (state == 2 || state == 3 || state == 4),
            'install-progress': (state == 9 || state == 10 || state == 11)
        };
    };

    this.getStatusStr = function (state, isDeploymentMode) {
        if (isDeploymentMode) {
            if (state == 7) { // download-completed
                return this.assetStatus[5]; // "included"
            } else if (state == -2) { // ignored
                return this.assetStatus[2];
            } else {
                return this.assetStatus[4]; // "not included"
            }
        }
        else {
            if (state == 14) { // installed
                return this.assetStatus[1];
            } else if (state == -2) { // ignored
                return this.assetStatus[2];
            } else {
                return this.assetStatus[0]; // "not installed"
            }
        }
    };

    this.getSeverity = function (severity) {
        var str = severity ? severity.toLowerCase() : "";
        if (str == "high") {
            return this.panelHeaders["severity"][1];
        } else if (str == "medium") {
            return this.panelHeaders["severity"][2];
        } else if (str == "low") {
            return this.panelHeaders["severity"][3];
        } else {
            return this.unKnownText;
        }
    };

    this.getDateCategory = function (givenDate, state, isRecommended, panelHeaders) {
    	if (givenDate instanceof Date) {
	        var currDate = new Date(),
	            yearDiff = currDate.getFullYear() - givenDate.getFullYear(),
	            monthDiff = currDate.getMonth() - givenDate.getMonth(),
	            dateDiff = currDate.getDate() - givenDate.getDate(),
	            dayDiff = currDate.getDay() - givenDate.getDay();
	        if (isRecommended && state != 14) {
	            return panelHeaders[0];
	        } else if (state == 0) {
	            return panelHeaders[1];
	        } else if ((yearDiff > 1) || (yearDiff == 1 && monthDiff != -11) || (yearDiff == 0 && monthDiff > 1)) {
	            return panelHeaders[5];
	        } else if ((yearDiff == 1 && monthDiff == -11) || (yearDiff == 0 && monthDiff == 1)) {
	            return panelHeaders[4];
	        } else if (yearDiff == 0 && monthDiff == 0 && (0 <= dateDiff < 7)) {
	            return panelHeaders[2];
	        } else {
	            return panelHeaders[3];
	        }
    	} else {
    		return panelHeaders[5];
    	}
    };
    
    this.getSeverityCategory = function (severity, state, isRecommended, panelHeaders) {
    	severity = severity ? severity.toLowerCase() : "";
	    if (isRecommended && state != 14) {
	    	return panelHeaders[0];
	    } else if (severity == "high") {
	    	return panelHeaders[1];
	    } else if (severity == "medium") {
	    	return panelHeaders[2];
	    } else if (severity == "low") {
	    	return panelHeaders[3];
	    } else {
	    	return panelHeaders[4];
	    }
    };

    this.panelHeaders = {
        "date": [r$.recommended_upd, r$.date_new_upd, r$.date_rec_upd, r$.date_lw_upd, r$.date_lm_upd, r$.date_old_upd, r$.other_label],
        "severity": [r$.recommended_upd, r$.sev_high, r$.sev_med, r$.sev_low, r$.other_label]
    };
    this.sortOptions = [{
        value: "date",
        label: r$.sort_date_optn
    }, {
        value: "severity",
        label: r$.sort_sev_optn
    }];
    this.multiMenuBtns = {
        "installSelected": {
            label: r$.install_sel_label,
            disabled: true,
            hidden: false
        },
        "addSelected": {
            label: r$.add_sel_label,
            disabled: true,
            hidden: false
        },
        "removeSelected": {
            label: r$.remove_sel_label,
            disabled: true,
            hidden: false
        },
        "pauseSelected": {
            label: r$.pause_sel_label,
            disabled: true,
            hidden: false
        },
        "resumeSelected": {
            label: r$.resume_sel_label,
            disabled: true,
            hidden: false
        },
        "cancelSelected": {
            label: r$.cancel_sel_label,
            disabled: true,
            hidden: false
        },
        "ignoreSelected": {
            label: r$.ignore_sel_label,
            disabled: true,
            hidden: false
        }
    };
    this.releasedText = r$.sr_rel;
    this.statusText = r$.sr_status;
    this.publisherText = r$.sr_pub;
    this.updateIdText = r$.sr_uid;
    this.severityText = r$.sr_sev;
    this.sizeText = r$.sr_size;
    this.secondaryRows = {
		"date": [[this.releasedText, this.statusText], [this.publisherText, this.updateIdText], [this.severityText, this.sizeText]],
		"severity": [[this.severityText, this.statusText], [this.publisherText, this.updateIdText], [this.releasedText, this.sizeText]]
    };
    this.assetStatus = [r$.as_not_installed, r$.as_installed, r$.as_ignored, r$.as_not_applicable, r$.as_not_included, r$.as_included];
    this.assetLinkText = [r$.al_details, r$.al_rel_updates, r$.al_rel_notes];
    this.newText = r$.new_label;
    this.retiredText = r$.retired_label;
    this.unKnownText = r$.unknown_label;
    this.emptyTabText = r$.empty_tab_text;
    this.alsoIncludesText = r$.also_includes;
    this.goToFullDetailsText = r$.go_to_full_details;
    this.moreText = r$.more_text;
    this.serverNotReachableErr = r$.server_not_reachable_err;
    this.fallbackThumbUrl = "images/active_appicon.png";
    this.transactionState = {
		"New": 0,
        "Queued": 1,
        "Downloading": 2,
        "PauseDownload": 3,
        "DownloadPaused": 4,
        "ResumeDownload": 5,
        "Downloaded": 6,
        "InstallQueued": 7,
        "Installing": 8,
        "PauseInstall": 9,
        "InstallPaused": 10,
        "ResumeInstall": 11,
        "Completed": 12,
        "AbortDownload": 13,
        "AbortInstall": 14,
        "Aborted": 15
    };
    this.updateState = {
        "ignored": -2,
        "not-applicable" : -1,
        "new": 0,
        "not-downloaded": 1,
        "pending-download": 2,
        "downloading": 3,
        "download-paused": 4,
        "download-canceled": 5,
        "download-failed": 6,
        "download-completed": 7,
        "not-installed": 8,
        "pending-install": 9,
        "installing": 10,
        "install-paused": 11,
        "install-canceled": 12,
        "install-failed": 13,
        "installed": 14,
        "uninstalled": 15
    };
});

// SIG // Begin signature block
// SIG // MIIZewYJKoZIhvcNAQcCoIIZbDCCGWgCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFHksExpG1l0z
// SIG // lL9Hp3kn62Qk/7d6oIIUMDCCA+4wggNXoAMCAQICEH6T
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
// SIG // 9w0BCQQxFgQUg5nOKnsc4XMpP9Vgil/y4mKgy14wVAYK
// SIG // KwYBBAGCNwIBDDFGMESgJoAkAEEAdQB0AG8AZABlAHMA
// SIG // awAgAEMAbwBtAHAAbwBuAGUAbgB0oRqAGGh0dHA6Ly93
// SIG // d3cuYXV0b2Rlc2suY29tIDANBgkqhkiG9w0BAQEFAASC
// SIG // AQAREwt8w9ZAuESirtSBimJgf8vHN9ymFwR4Vj/emwwp
// SIG // WAq23UqOBfOmpb4N4KoV80oc8uCOy17RYCEPU9PPwH7H
// SIG // RzP0Ny1ABZIZ13umE4d1zh5FTibmiKGF5tyzginuYI+0
// SIG // gzm2wgeL9V3+5XCrb6XIWehil4o5Av/yda35nmaHe0X1
// SIG // FeRjwrcWE8o1lFP6bUMWD1myaIlUODYaS7H0I8X1ZOcp
// SIG // +VasENOkKmwIBYQsRBCgTVA3mgXQ3GYqhbfoEWfmRam+
// SIG // 9kb0bRIVOzQVTqauLw0jfAlUHzqwYzeA9uxHAXJta6LM
// SIG // tW74h0hfJCopFGnR2l0zZCycVQlejsvOVreZoYICCzCC
// SIG // AgcGCSqGSIb3DQEJBjGCAfgwggH0AgEBMHIwXjELMAkG
// SIG // A1UEBhMCVVMxHTAbBgNVBAoTFFN5bWFudGVjIENvcnBv
// SIG // cmF0aW9uMTAwLgYDVQQDEydTeW1hbnRlYyBUaW1lIFN0
// SIG // YW1waW5nIFNlcnZpY2VzIENBIC0gRzICEA7P9DjI/r81
// SIG // bgTYapgbGlAwCQYFKw4DAhoFAKBdMBgGCSqGSIb3DQEJ
// SIG // AzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTE1
// SIG // MDczMDAzNDAyOFowIwYJKoZIhvcNAQkEMRYEFHRDGKxx
// SIG // qhshFa7z7Gy/1v0NWm2bMA0GCSqGSIb3DQEBAQUABIIB
// SIG // AJz+zZnJ59El/F7EyXaEAK5e9ionb9UDikFj0NSe1lu5
// SIG // VrdlqEJHsevB5XSd7wQACBE9Olbv61qBN0/ZJEpGWdsj
// SIG // lKjFPputBnWaRL8sbbHCe2FI2CPfyxseaWz8WVd0jifu
// SIG // DZiFO61aKRTSuZYBKhpPcTD1I2uzPiKHdd+bYtTeWSdY
// SIG // Vg/if8nFYonAD0Mx2YxssoG+ODDTZNMKcDNZpPh37IKP
// SIG // cw45eQ63Gfs26niHg8giqrnlubF6Np+AnZtvTtnrLezi
// SIG // iw0EU/W7CooDGBKJ0tsMGB+yz9dQVRAmVmsWMaPVc+FX
// SIG // hKJ1k2WTNVfoMqIMkZwAhj+sKRkN+ejGQr0=
// SIG // End signature block
