#define CHECK_TARGET
#import <HBLog.h>
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
    [webView evaluateJavaScript:@"navigator.userAgent" completionHandler:^(id result, NSError *error) {
        if (error || ![result isKindOfClass:[NSString class]]) {
            HBLogDebug(@"Failed to get user agent: %@", error.localizedDescription);
            return;
        }
        NSString *defaultUA = (NSString *)result;
        NSString *spoofedVersion = @"18_5";
        NSString *spoofedSafariVersion = @"Version/18.5";
        NSError *regexError = nil;
        NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"OS \\d+_\\d+(?:_\\d+)?" options:0 error:&regexError];
        if (regexError) {
            HBLogDebug(@"Regex error: %@", regexError.localizedDescription);
            return;
        }
        NSString *uaWithOS = [regex stringByReplacingMatchesInString:defaultUA options:0 range:NSMakeRange(0, defaultUA.length) withTemplate:[NSString stringWithFormat:@"OS %@", spoofedVersion]];
        NSRegularExpression *versionRegex = [NSRegularExpression regularExpressionWithPattern:@"Version/\\d+(\\.\\d+)*" options:0 error:nil];
        NSString *finalUA = [versionRegex stringByReplacingMatchesInString:uaWithOS options:0 range:NSMakeRange(0, uaWithOS.length) withTemplate:spoofedSafariVersion];
        webView.customUserAgent = finalUA;
        HBLogDebug(@"Custom User Agent: %@", finalUA);
    }];

    return webView;
}

%end

%ctor {
    if (!isTarget(TargetTypeApps)) return;
    %init;
}
