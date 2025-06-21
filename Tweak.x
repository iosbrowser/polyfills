#define CHECK_TARGET
#import <HBLog.h>
#import <PSHeader/PS.h>
#import <WebKit/WebKit.h>
#import <theos/IOSMacros.h>
#import <version.h>
#import "Header.h"
#import "Polyfills.h"
#import "Polyfills-Post.h"

@interface _SFReloadOptionsController : NSObject
@end

static NSString *mobileUserAgent = @"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
static NSString *desktopUserAgent = @"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15";

static NSString *getFinalUA(NSString *defaultUA) {
    NSString *finalUA = defaultUA;
    NSString *spoofedVersion = @"16_0";
    NSString *spoofedSafariVersion = @"Version/16.0";
    NSError *regexError = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"OS \\d+_\\d+(?:_\\d+)?" options:0 error:&regexError];
    if (regexError) {
        HBLogDebug(@"Polyfills Regex error: %@", regexError.localizedDescription);
        return finalUA;
    }
    finalUA = [regex stringByReplacingMatchesInString:finalUA options:0 range:NSMakeRange(0, finalUA.length) withTemplate:[NSString stringWithFormat:@"OS %@", spoofedVersion]];
    NSRegularExpression *versionRegex = [NSRegularExpression regularExpressionWithPattern:@"Version/\\d+(\\.\\d+)*" options:0 error:nil];
    finalUA = [versionRegex stringByReplacingMatchesInString:finalUA options:0 range:NSMakeRange(0, finalUA.length) withTemplate:spoofedSafariVersion];
    finalUA = [finalUA stringByReplacingOccurrencesOfString:@"iPod touch" withString:@"iPhone"];
    return finalUA;
}

static void setUserAgent(WKWebView *webView, NSString *userAgent) {
    if (!userAgent) return;
    if ([webView respondsToSelector:@selector(setCustomUserAgent:)])
        webView.customUserAgent = userAgent;
    else {
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        [defaults registerDefaults:@{@"UserAgent": userAgent}];
    }
}

static void overrideUserAgent(WKWebView *webView) {
    if (IS_IOS_OR_NEWER(iOS_16_0)) return;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
    WKContentMode contentMode = WKContentModeRecommended;
    if (IS_IOS_OR_NEWER(iOS_13_0))
        contentMode = webView.configuration.defaultWebpagePreferences.preferredContentMode;
    NSString *ua = IS_IPAD || contentMode == WKContentModeDesktop ? desktopUserAgent : mobileUserAgent;
#pragma clang diagnostic pop
    setUserAgent(webView, ua);
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
        if (!IS_IOS_OR_NEWER(iOS_9_0)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_9_0 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_10_0)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_10_0 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_10_1)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_10_1 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_11_1)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scripts_before_11_1 injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:NO]];
        }
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
        if (!IS_IOS_OR_NEWER(iOS_15_4)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scriptsPost_before_15_4 injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:NO]];
        }
        if (!IS_IOS_OR_NEWER(iOS_16_4)) {
            [controller addUserScript:[[WKUserScript alloc] initWithSource:scriptsPost_before_16_4 injectionTime:WKUserScriptInjectionTimeAtDocumentEnd forMainFrameOnly:NO]];
        }
    }
    WKWebView *webView = %orig;
    overrideUserAgent(webView);
    return webView;
}

- (void)setCustomUserAgent:(NSString *)customUserAgent {
    HBLogDebug(@"Polyfills Setting custom user agent: %@", customUserAgent);
    %orig(getFinalUA(customUserAgent));
}

- (void)setApplicationNameForUserAgent:(NSString *)applicationNameForUserAgent {
    HBLogDebug(@"Polyfills Setting application name for user agent: %@", applicationNameForUserAgent);
    %orig(getFinalUA(applicationNameForUserAgent));
}

%end

%hook _SFReloadOptionsController

- (void)didMarkURLAsNeedingDesktopUserAgent:(id)arg1 {
    if (!IS_IOS_OR_NEWER(iOS_16_0)) {
        HBLogDebug(@"Polyfills didMarkURLAsNeedingDesktopUserAgent called");
        WKWebView *webView = [self valueForKey:@"_webView"];
        if (webView) setUserAgent(webView, desktopUserAgent);
    }
    %orig;
}

- (void)didMarkURLAsNeedingStandardUserAgent:(id)arg1 {
    if (!IS_IOS_OR_NEWER(iOS_16_0)) {
        HBLogDebug(@"Polyfills didMarkURLAsNeedingStandardUserAgent called");
        WKWebView *webView = [self valueForKey:@"_webView"];
        if (webView) setUserAgent(webView, mobileUserAgent);
    }
    %orig;
}

%end

%ctor {
    if (!isTarget(TargetTypeApps)) return;
    Boolean keyExists;
    Boolean enabled = CFPreferencesGetAppBooleanValue(key, domain, &keyExists);
    if (!keyExists ? NO : !enabled) return;
    %init;
}
