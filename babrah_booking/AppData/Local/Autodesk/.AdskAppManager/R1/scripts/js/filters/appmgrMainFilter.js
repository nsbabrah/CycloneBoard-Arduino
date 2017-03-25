appmgrMainApp.filter('filterPanel', function () {
    return function (headers, assets) {
        var panel = [];
        angular.forEach(headers, function (header) {
            var isValidPanel = false;
            angular.forEach(assets, function (asset) {
                if (asset.category == header && asset.state != -1 && asset.visible == 1 && (asset.state == 14 || asset.publishState.toLowerCase() != "retired")) {
                    isValidPanel = true;
                    return false;
                }
            });
            if (isValidPanel) {
                panel.push(header);
            }
        });
        return panel;
    };
});
appmgrMainApp.filter('filterAsset', function () {
    return function (assets, header) {
        var retAssets = [];
        angular.forEach(assets, function (asset) {
            if (asset.category == header && asset.state != -1 && asset.visible == 1 && (asset.state == 14 || asset.publishState.toLowerCase() != "retired")) {
                retAssets.push(asset);
            }
        });
        return retAssets;
    };
});