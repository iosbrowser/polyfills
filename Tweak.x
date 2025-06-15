#define CHECK_TARGET
#import <HBLog.h>
#import <PSHeader/PS.h>
#import <WebKit/WebKit.h>
#import <version.h>
#import "Polyfills.h"
#import "Polyfills-Post.h"

static void overrideUserAgent(WKWebView *webView) {
    if (IS_IOS_OR_NEWER(iOS_16_0)) return;
    [webView evaluateJavaScript:@"navigator.userAgent" completionHandler:^(id result, NSError *error) {
        if (error || ![result isKindOfClass:[NSString class]]) {
            HBLogDebug(@"Failed to get user agent: %@", error.localizedDescription);
            return;
        }
        NSString *defaultUA = (NSString *)result;
        NSString *spoofedVersion = @"16_0";
        NSString *spoofedSafariVersion = @"Version/16.0";
        NSError *regexError = nil;
        NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"OS \\d+_\\d+(?:_\\d+)?" options:0 error:&regexError];
        if (regexError) {
            HBLogDebug(@"Regex error: %@", regexError.localizedDescription);
            return;
        }
        NSString *uaWithOS = [regex stringByReplacingMatchesInString:defaultUA options:0 range:NSMakeRange(0, defaultUA.length) withTemplate:[NSString stringWithFormat:@"OS %@", spoofedVersion]];
        NSRegularExpression *versionRegex = [NSRegularExpression regularExpressionWithPattern:@"Version/\\d+(\\.\\d+)*" options:0 error:nil];
        NSString *finalUA = [versionRegex stringByReplacingMatchesInString:uaWithOS options:0 range:NSMakeRange(0, uaWithOS.length) withTemplate:spoofedSafariVersion];
        HBLogDebug(@"Custom User Agent: %@", finalUA);
        webView.customUserAgent = finalUA;
    }];
}

%hook WKWebView

static const void *InjectedKey = &InjectedKey;

- (instancetype)initWithFrame:(CGRect)frame configuration:(WKWebViewConfiguration *)configuration {
    WKUserContentController *controller = configuration.userContentController;
    if (!controller) {
        controller = [[WKUserContentController alloc] init];
        configuration.userContentController = controller;
    }
    if (!objc_getAssociatedObject(controller, InjectedKey)) {
        objc_setAssociatedObject(controller, InjectedKey, @YES, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
        [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        if (!IS_IOS_OR_NEWER(iOS_12_0)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_12_0 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_13_0)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_13_0 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_13_1)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_13_1 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_14_1)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_14_1 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_15_4)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_15_4 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_16_0)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_16_0 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_16_4)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_16_4 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        [controller addUserScript:[[WKUserScript alloc] initWithSource:scriptsPost injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:NO]];
    }
    WKWebView *webView = %orig;
    overrideUserAgent(webView);
    return webView;
}

- (void)setCustomUserAgent:(NSString *)customUserAgent {
    %orig;
    overrideUserAgent(self);
}

%end

%ctor {
    if (!isTarget(TargetTypeApps)) return;
    %init;
}
