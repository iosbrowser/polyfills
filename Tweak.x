#define CHECK_TARGET
#import <PSHeader/PS.h>
#import <WebKit/WebKit.h>
#import <version.h>
#import "Polyfills.h"
#import "Polyfills-Post.h"

%hook WKWebView

- (instancetype)initWithFrame:(CGRect)frame configuration:(WKWebViewConfiguration *)configuration {
    WKUserContentController *controller = configuration.userContentController;
    if (!controller) {
        controller = [[WKUserContentController alloc] init];
        configuration.userContentController = controller;
    }
    [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
    if (!IS_IOS_OR_NEWER(iOS_16_4)) {
        [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_16_4 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
    }
    [controller addUserScript:[[WKUserScript alloc] initWithSource:scriptsPost injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:NO]];
    WKWebView *webView = %orig;
    webView.customUserAgent = @"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
    return webView;
}

%end

%ctor {
    if (!isTarget(TargetTypeApps)) return;
    %init;
}
