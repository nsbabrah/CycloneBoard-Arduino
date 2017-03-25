/**
 * Tool tip jQuery plugin
 * 1. A plugin to show tooltip on mousehover of an element, hide on mouseout
 * 2. A plugin to show tooltip on click of an element, manual hide either by close icon or by outside tooltip click
 * @param: action - A string which specifies tooltip action, either "show" or "hide"
 * @param: options - An object array to provide tooltip title, content, type, placement
 *
 * Usage:
 * Note:
 * Developer needs to add a class called "tool-tip" to their html element
 * Eg: <span class="tool-tip info-icon">Show Tooltip</span>
 *
 * Show tooltip on mouse hover:
 * $(document).on("mouseenter", ".info-icon", function (e) {
 * 	$(this).tooltip("show", {type: "warning", showClose: false, placement: "top", title: "Tooltip title", content: "content");
 * }
 *
 * Show tooltip on mouse click:
 * $(document).on("mouseclick", ".info-icon", function (e) {
 * 	$(this).tooltip("show", {type: "warning", showClose: true, placement: "top", title: "Tooltip title", content: "content");
 * }
 *
 * Hide tooltip:
 * Developer no need to call hide explicitly, Hide functionality is internally configured. This is an extra feature to call tootip hide externally
 * $(this).tooltip("hide")
 *
 * Default param explanation:
 * type: Decides show/hide of warning icon. Possible values: "warning", "info"
 * showClose: Decides show/hide of Close icon. Possible values: true, false
 * placement: Decides placement of tooltip with respect the element. Possible values: "top-left", "bottom-left", "right"
 * title: Title of the tooltip
 * content: Content of the tooltip
 * @author t_natae
 **/
(function ($) {
    $.fn.tooltip = function (action, options) {
        var defaults = {
            template: "<div class='tt-wrapper' style='display: none;'><div class='tt-header'><div class='tt-title'></div><div class='tt-close'></div><div class='clr-both'></div></div><div class='tt-content'></div></div>",
            type: "warning",
            showClose: false,
            placement: "top-left",
            title: "",
            content: "",
            controllerId: "",
            width: "300",
            tipOffset: [0, 0]
        },
            options = $.extend(defaults, options),
            element = $(this),
            altPlacementArray = {
        		'right': ['right', 'bottom-left', 'top-left'],
        		'top-left': ['top-left', 'top-center', 'top-right', 'bottom-left', 'right'],
                'top-center': ['top-center', 'top-right', 'top-left', 'bottom-left', 'right'],
                'top-right': ['top-right', 'top-left', 'top-center', 'bottom-left', 'right'],
                'bottom-left': ['bottom-left', 'top-left', 'right']
            };

        function getTip() {
            return $(options.template);
        }

        function getWidth() {
            return $(".tt-wrapper").width();
        }

        function getHeight() {
            return $(".tt-wrapper").height();
        }

        function render() {
            if ($(".tt-wrapper").length <= 0) {
                var $tip = setContent(getTip());
                $("body").append($tip);
            } else {
                setContent($(".tt-wrapper"));
            }
            registerEvents();
            showTip();
        }

        function setContent(ttobj) {
        	/* Set tool tip width */
        	$(ttobj).width(options.width);
            /* Set tool tip type */
            $(ttobj).removeClass("warning info info-black no-title").addClass(options.type.toLowerCase());
            if (options.title == "") {
            	$(ttobj).addClass("no-title");
            }
            /* Show or Hide close icon */
            options.showClose ? $(ttobj).find(".tt-close").show() : $(ttobj).find(".tt-close").hide();
            $(ttobj).find(".tt-title").html(options.title);
            $(ttobj).find(".tt-content").html(options.content);
            return ttobj;
        }

        function registerEvents() {
            /* Unregister the previously attached events */
            unregisterAllEvents();
            /* Attach new set of events */
            if (options.showClose) {
                $(".tt-wrapper").on("click", ".tt-close", onClose);
                $(document).on("click", onClickAway);
                $(window).on("resize scroll", onClickAway);
            } else {
                $(element).on("mouseout", onMouseOut);
            }
        }

        function unregisterAllEvents() {
            $(".tt-wrapper").off("click", ".tt-close", onClose);
            $(element).off("mouseout", onMouseOut);
            $(document).off("click", onClickAway);
            $(window).off("resize scroll", onClickAway);
        }

        function showTip() {
            applyPlacement();
            $(".tt-wrapper").show();
        }

        function hideTip() {
            $(".tt-wrapper").hide();
        }

        function onClose() {
            $(".tt-wrapper").off("click", ".tt-close", onClose);
            hideTip();
        }

        function onMouseOut() {
            $(element).off("mouseout", onMouseOut);
            if ($(".tt-wrapper").find(".tt-close").is(":hidden")) {
                hideTip();
            }
        }

        function onClickAway(e) {
            var eTarget = e.target ? e.target : e.srcElement;
            if (!($(eTarget).hasClass("tool-tip") || ($(eTarget).hasClass("tt-wrapper")) || $(eTarget).parents().hasClass("tt-wrapper"))) {
                $(document).off("click", onClickAway);
                $(window).off("resize scroll", onClickAway);
                hideTip();
            }
        }

        function applyPlacement() {
            setOffset(options.placement);
            $(".tt-wrapper").css({
                left: options.tipOffset[0],
                top: options.tipOffset[1]
            });
        }

        function setOffset(placement) {
            var placeOrder = altPlacementArray[placement],
                ttWidth = getWidth(),
                ttHeight = getHeight(),
                winHeight = $(window).height(),
                winWidth = $(window).width(),
                elemLeft = $(element).offset().left,
                elemTop = $(element).offset().top,
                elemWidth = $(element).width(),
                elemHeight = $(element).height();
            for (var i = 0; i < placeOrder.length; i++) {
                if (isFeasiblePlace(placeOrder[i], ttWidth, ttHeight, winWidth, winHeight, elemWidth, elemHeight, elemLeft, elemTop)) {
                    placement = placeOrder[i];
                    break;
                }
            }

            switch (placement) {
            case 'top-left':
                var ttLeft = (elemLeft + (elemWidth / 2) - ttWidth + 10),
                    ttTop = elemTop - ttHeight - 24;
                options.tipOffset = [ttLeft, ttTop];
                break;
            case 'top-center':
				var ttLeft = (elemLeft + (elemWidth / 2) - (ttWidth / 2)),
					ttTop = elemTop - ttHeight - 18;
				options.tipOffset = [ttLeft, ttTop];
				break;
			case 'top-right':
				var ttLeft = (elemLeft + (elemWidth / 2) - 12),
					ttTop = elemTop - ttHeight - 24;
				options.tipOffset = [ttLeft, ttTop];
				break;
            case 'bottom-left':
                var ttLeft = (elemLeft + (elemWidth / 2) - ttWidth + 10),
                    ttTop = elemTop + elemHeight + 22;
                options.tipOffset = [ttLeft, ttTop];
                break;
            case 'right':
                var ttLeft = elemLeft + elemWidth + 22,
                    ttTop = elemTop + (elemHeight / 2) - 14;
                options.tipOffset = [ttLeft, ttTop];
                break;
            }
            $(".tt-wrapper").removeClass("top-left top-center top-right bottom-left right").addClass(placement);
        }

        function isFeasiblePlace(placement, ttWidth, ttHeight, winWidth, winHeight, elemWidth, elemHeight, elemLeft, elemTop) {
            var isFeasible = false;
            switch (placement) {
            case 'top-left':
                isFeasible = (elemTop > (ttHeight + 25)) && ((elemLeft + (elemWidth / 2)) > (ttWidth - 12)) ? true : false;
                break;
            case 'top-center':
				isFeasible = (elemTop > (ttHeight + 19)) && ((elemLeft + (elemWidth / 2)) >  (ttWidth / 2)) ? true: false;
				break;
			case 'top-right':
				isFeasible = (elemTop > (ttHeight + 25)) && ((elemLeft + (elemWidth / 2)) >  12) ? true: false;
				break;
            case 'bottom-left':
                isFeasible = ((elemTop + elemHeight + 25 + ttHeight) < winHeight) && ((elemLeft + (elemWidth / 2)) > (ttWidth - 12)) ? true : false;
                break;
            case 'right':
                isFeasible = ((elemLeft + elemWidth + 25 + ttWidth) < winWidth) && ((elemTop + (elemHeight / 2) + ttHeight - 12) < winHeight) ? true : false;
                break;
            }
            return isFeasible;
        }

        return (function () {
            if (action == "show") {
                render();
            } else if (action == "hide") {
                hideTip();
            }
        })();
    }
})(jQuery);


/**
 * Modal dialog jQuery plugin
 * 1. A plugin to create Modal dialog with OK and Optoinal Retry button
 * 2. A plugin to show tooltip on click, and manual hide either by close icon click or by click on outside tooltip
 * @param: options - An object array to provide Modal dialog title, content, type, button callback method
 *
 * Usage:
 * Show Modal dialog:
 * $.modaldialog({id: "retired", width: "480", title: "title", content: "content", ok: {btnText: "OK", method: "methodName"}});
 *
 * Hide Modal dialog:
 * Modal dialog hide is configured internally. Click on Close icon, OK button or Retry button will close the modal dialog
 *
 * Default param explanation:
 * id: A mandatory value in order to differentiate one modal dialog with other
 * dialogType: Show warning or info icon. Possible values: "warning", "info"
 * title: Title of the modal dialog
 * content: Content of the modal dialog
 * width: Width of the modal dialog
 * ok: OK button array [Button text, Method]
 * retry: Retry button array [btton text, method, params, show]
 * @author t_natae
 **/
(function ($) {
    $.modaldialog = function (options) {
        var defaults = {
            id: null,
            template: "<div class='modal-overlay'><div class='md-wrapper'><div class='md-header'><div class='md-type'></div><div class='md-title'></div>" +
                "<div class='md-close'></div><div class='clr-both'></div></div><div class='md-content'></div><div class='md-footer'>" +
                "<div class='md-btns'><a class='md-retry btn-gray left-btn' href='javascript:void(0);'></a>" +
                "<a class='md-ok btn-blue right-btn' href='javascript:void(0);'></a></div></div></div></div>",
            dialogType: "",
            title: "",
            content: "",
            width: "400",
            minHeight: "250",
            ok: {btnText: "", method: "", params: []},
            retry: {btnText: "", method: "", params: [], show: false}
        },
            options = $.extend(defaults, options);

        function getModalDialog() {
            return $(options.template);
        }

        function showDialog() {
            var $modaldialog = setOptions(getModalDialog());
            $("body").prepend($modaldialog);
            registerEvents();
        }

        function setOptions(mdobj) {
            /* Set modal dialog id, width, min height */
            $(mdobj).find(".md-wrapper").attr("id", "modal_" + options.id).css({
                "width": options.width + "px",
                "min-height": options.minHeight + "px"
            });

            /* Set dialog type */
            $(mdobj).find(".md-type").addClass(options.dialogType.toLowerCase());

            /* Set title and title width */
            $(mdobj).find(".md-title").css("width", (options.width - 70) + "px").html(options.title);

            /* Set content */
            $(mdobj).find(".md-content").html(options.content);

            /* Set footer width */
            $(mdobj).find(".md-footer").css("width", options.width + "px");

            /* Set Retry button text, show/hide Retry button */
            $(mdobj).find(".md-retry").text(options.retry.btnText);
            if (options.retry.show) {
                $(mdobj).find(".md-retry").removeClass("hide");
            } else {
                $(mdobj).find(".md-retry").addClass("hide");
            }

            /* Set OK button text */
            $(mdobj).find(".md-ok").text(options.ok.btnText);

            return mdobj;
        }

        function registerEvents() {
            /* Register an event for close and OK button */
            $("#modal_" + options.id).on("click", ".md-close, .md-ok", hideDialog);

            /* Register an event for Retry button */
            $("#modal_" + options.id).on("click", ".md-retry", onRetryBtnClick);
        }

        function hideDialog() {
            if (options.ok.method) {
                var fn = $("#" + options.controllerId).scope()[options.ok.method];
                if (typeof fn === "function") {
                    if (options.ok.params) {
                        fn(options.ok.params);
                    } else {
                        fn();
                    }
                }
            } else {
                unregisterAllEvents;
                $("#modal_" + options.id).parents(".modal-overlay").remove();
            }
        }

        function onRetryBtnClick() {
            var fn = $("#" + options.controllerId).scope()[options.retry.method]; //window[options.retry.method];
            unregisterAllEvents;
            $("#modal_" + options.id).parents(".modal-overlay").remove();
            if (typeof fn === "function") {
                if (options.retry.params) {
                    fn(options.retry.params);
                } else {
                    fn();
                }
            }
        }

        function unregisterAllEvents() {
            $("#modal_" + options.id).off("click", ".md-close, .md-ok", hideDialog);
            $("#modal_" + options.id).off("click", ".md-retry", onRetryBtnClick);
        }

        return showDialog();
    }
})(jQuery);

/**
 * A plugin to replace the broken thumbnail icons 
 * @param fallbackURL: The fallback thumbnail url
**/
(function($){
	$.fn.fallbackThumbIcon = function (fallbackURL) {
	    return this.one('error', function () {
	    	$(this).attr('src', fallbackURL);
	    });
	};
})(jQuery);
// SIG // Begin signature block
// SIG // MIIZewYJKoZIhvcNAQcCoIIZbDCCGWgCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFK1Yv4mEDrtA
// SIG // 3ycTKINoNRitoHJToIIUMDCCA+4wggNXoAMCAQICEH6T
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
// SIG // 9w0BCQQxFgQUFEuqefoH5ereO+kzA41C7k1R1dEwVAYK
// SIG // KwYBBAGCNwIBDDFGMESgJoAkAEEAdQB0AG8AZABlAHMA
// SIG // awAgAEMAbwBtAHAAbwBuAGUAbgB0oRqAGGh0dHA6Ly93
// SIG // d3cuYXV0b2Rlc2suY29tIDANBgkqhkiG9w0BAQEFAASC
// SIG // AQCQkfIZoEHZTBhLU6YkYhJxRo4Qws29jGPab2BWmY7I
// SIG // sd+q73562fO0xxmAQPBjuuFk8HNHh0EcSMBf0QKcaUfr
// SIG // xkRiRW2c8Wl/RztDii4MZDLGFsiB8h33kg3sUsyOQByw
// SIG // s6nXjRB0hpnyJZXENjeWTVGJELQBiIsksb5v0Mw6qR4r
// SIG // ogjaYBhj49+cKz7pqIo1G0lAjH0U1mGTSAMyiMUxkFm9
// SIG // GYOHs0ew4A2R0CzEay6E3CN7VX2pVlb1ULr7D9WMz/Fg
// SIG // ocrWsLKiUQlq9h+CM+vPG9J5aW6trWcDBE3URll63uba
// SIG // StbFIGAiihBMgLBqrcqSygmV6RikBWDzW86qoYICCzCC
// SIG // AgcGCSqGSIb3DQEJBjGCAfgwggH0AgEBMHIwXjELMAkG
// SIG // A1UEBhMCVVMxHTAbBgNVBAoTFFN5bWFudGVjIENvcnBv
// SIG // cmF0aW9uMTAwLgYDVQQDEydTeW1hbnRlYyBUaW1lIFN0
// SIG // YW1waW5nIFNlcnZpY2VzIENBIC0gRzICEA7P9DjI/r81
// SIG // bgTYapgbGlAwCQYFKw4DAhoFAKBdMBgGCSqGSIb3DQEJ
// SIG // AzELBgkqhkiG9w0BBwEwHAYJKoZIhvcNAQkFMQ8XDTE1
// SIG // MDczMDAzNDAyNlowIwYJKoZIhvcNAQkEMRYEFCCTt6Uk
// SIG // tdXKvslkXDlneeAjWlh3MA0GCSqGSIb3DQEBAQUABIIB
// SIG // AA675wYSxo0fdIdlYgRvrZkR5t9vojdjZFioH+UNzA0z
// SIG // Y0M8QBxVWyLYnEeMg5ZdKGZdoOA0qcc9VELEm5ia0Yrr
// SIG // gTh06vvTA0e8KI+TKQaLb5LTftMqvKXEh/NWzbTXjrck
// SIG // T3dM/OBEVVs7bLRVNB767Vejb4pMRVxamgAEpxvhGJAh
// SIG // usocGWwl/MyRIxLvu/Z6y/cvgx3AMvxkkrQFDyveNWa9
// SIG // ZC4Ls123WeiIbGGhQ0+s29Y6hplauz6UgAj3vhXsgEbQ
// SIG // Vh7kJHSM84faN0SJmzLrw+LOVXli8yJzjxLWQc1LN/3u
// SIG // ls+lWr+YWsHT63MEDdwD77uURKQXl7cnWnA=
// SIG // End signature block
