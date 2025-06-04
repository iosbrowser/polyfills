#define CHECK_TARGET
#import <PSHeader/PS.h>
#import <WebKit/WebKit.h>
#import "Polyfills.h"

%hook WKWebView

- (instancetype)initWithFrame:(CGRect)frame configuration:(WKWebViewConfiguration *)configuration {
    WKUserContentController *controller = configuration.userContentController;
    if (!controller) {
        controller = [[WKUserContentController alloc] init];
        configuration.userContentController = controller;
    }
    WKUserScript *script = [[WKUserScript alloc] initWithSource:polyfillScript injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES];
    [controller removeAllUserScripts];
    [controller addUserScript:script];
    return %orig;
}

%end

%ctor {
    if (!isTarget(TargetTypeApps)) return;
    %init;
}
