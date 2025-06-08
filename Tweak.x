#define CHECK_TARGET
#import <PSHeader/PS.h>
#import <WebKit/WebKit.h>
#import "Polyfills.h"
#import "Polyfills-Post.h"

%hook WKWebView

- (instancetype)initWithFrame:(CGRect)frame configuration:(WKWebViewConfiguration *)configuration {
    WKUserContentController *controller = configuration.userContentController;
    if (!controller) {
        controller = [[WKUserContentController alloc] init];
        configuration.userContentController = controller;
    }
    WKUserScript *userScript = [[WKUserScript alloc] initWithSource:scripts injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO];
    WKUserScript *userScriptPost = [[WKUserScript alloc] initWithSource:scriptsPost injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:NO];
    [controller addUserScript:userScript];
    [controller addUserScript:userScriptPost];
    return %orig;
}

%end

%ctor {
    if (!isTarget(TargetTypeApps)) return;
    %init;
}
