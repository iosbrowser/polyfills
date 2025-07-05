/*
 * Polyfills Tweak - Filesystem-based JavaScript injection with async loading
 *
 * This tweak loads JavaScript polyfills dynamically from the filesystem
 * instead of embedding them in header files. This allows for easier
 * management and user customization of polyfills.
 *
 * Performance: Scripts are loaded asynchronously at tweak initialization
 * and cached in memory for fast injection into WKWebViews.
 *
 * Directory structure: /Library/Application Support/Polyfills/
 * ├── scripts/                    # Injected at document start
 * │   ├── base/                   # Base scripts for all iOS versions
 * │   ├── 9.0/                   # Scripts for iOS < 9.0
 * │   ├── 10.0/                  # Scripts for iOS < 10.0
 * │   └── ...                    # Other version directories (auto-discovered)
 * └── scripts-post/               # Injected at document end
 *     ├── base/                   # Base post-scripts for all iOS versions
 *     └── 15.4/, 16.4/           # Version-specific post-scripts (auto-discovered)
 *
 * JavaScript files (.js) in each directory are loaded alphabetically.
 * Version directories are auto-discovered and sorted in ascending order.
 * Version-specific directories are only loaded if the current iOS
 * version is older than the directory version.
 */

#define CHECK_TARGET
#import <HBLog.h>
#import <PSHeader/PS.h>
#import <WebKit/WebKit.h>
#import <theos/IOSMacros.h>
#import <version.h>
#import "Header.h"

@interface _SFReloadOptionsController : NSObject
@end

static BOOL isIOSVersionOrNewer(NSInteger major, NSInteger minor) {
    NSOperatingSystemVersion version = [[NSProcessInfo processInfo] operatingSystemVersion];
    if (version.majorVersion > major) return YES;
    if (version.majorVersion == major && version.minorVersion >= minor) return YES;
    return NO;
}

// Helper function to load JavaScript content from a file
static NSString *loadJSFromFile(NSString *filePath) {
    if (![[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
        HBLogDebug(@"Polyfills: JS file not found at path: %@", filePath);
        return nil;
    }

    NSError *error;
    NSString *content = [NSString stringWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:&error];
    if (error) {
        HBLogDebug(@"Polyfills: Error reading JS file %@: %@", filePath, error.localizedDescription);
        return nil;
    }

    return content;
}

// Helper function to concatenate all JS files in a directory
static NSString *loadJSFromDirectory(NSString *directoryPath) {
    NSFileManager *fileManager = [NSFileManager defaultManager];
    if (![fileManager fileExistsAtPath:directoryPath]) {
        HBLogDebug(@"Polyfills: Directory not found at path: %@", directoryPath);
        return @"";
    }

    NSError *error;
    NSArray *files = [fileManager contentsOfDirectoryAtPath:directoryPath error:&error];
    if (error) {
        HBLogDebug(@"Polyfills: Error reading directory %@: %@", directoryPath, error.localizedDescription);
        return @"";
    }

    // Filter for .js files and sort them
    NSArray *jsFiles = [[files filteredArrayUsingPredicate:[NSPredicate predicateWithFormat:@"pathExtension == 'js'"]]
                       sortedArrayUsingSelector:@selector(localizedCaseInsensitiveCompare:)];

    NSMutableString *combinedScript = [NSMutableString string];
    for (NSString *fileName in jsFiles) {
        NSString *filePath = [directoryPath stringByAppendingPathComponent:fileName];
        NSString *content = loadJSFromFile(filePath);
        if (content) {
            [combinedScript appendString:content];
            [combinedScript appendString:@"\n"];
        }
    }

    return [combinedScript copy];
}

// Helper function to get base polyfills directory path
static NSString *getPolyfillsBasePath() {
    return PS_ROOT_PATH_NS(@"/Library/Application Support/Polyfills");
}

// Global variables for script loading
static dispatch_queue_t scriptLoadingQueue;

// Helper function to load scripts for a specific iOS version or older
// If injectionCallback is provided, scripts are injected immediately as they're loaded
static NSString *loadScriptsForIOSVersion(NSString *basePath, BOOL isPost, void (^injectionCallback)(NSString *script, BOOL isPost)) {
    NSString *scriptsDir = isPost ? @"scripts-post" : @"scripts";
    NSString *fullBasePath = [basePath stringByAppendingPathComponent:scriptsDir];

    NSMutableString *combinedScripts = [NSMutableString string];

    // Load base scripts (always included)
    NSString *baseScriptsPath = [fullBasePath stringByAppendingPathComponent:@"base"];
    NSString *baseScripts = loadJSFromDirectory(baseScriptsPath);
    if (baseScripts.length > 0) {
        if (injectionCallback) {
            injectionCallback(baseScripts, isPost);
        }
        [combinedScripts appendString:baseScripts];
        [combinedScripts appendString:@"\n"];
    }

    // Dynamically discover version directories
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSError *error;
    NSArray *allItems = [fileManager contentsOfDirectoryAtPath:fullBasePath error:&error];
    if (error) {
        HBLogDebug(@"Polyfills: Error reading scripts directory %@: %@", fullBasePath, error.localizedDescription);
        return [combinedScripts copy];
    }

    // Filter for version directories (directories that match version pattern like "9.0", "10.1", etc.)
    NSMutableArray *versionDirs = [NSMutableArray array];
    NSRegularExpression *versionRegex = [NSRegularExpression regularExpressionWithPattern:@"^\\d+\\.\\d+$" options:0 error:nil];

    for (NSString *item in allItems) {
        NSString *itemPath = [fullBasePath stringByAppendingPathComponent:item];
        BOOL isDirectory;
        if ([fileManager fileExistsAtPath:itemPath isDirectory:&isDirectory] && isDirectory) {
            if ([versionRegex numberOfMatchesInString:item options:0 range:NSMakeRange(0, item.length)] > 0) {
                [versionDirs addObject:item];
            }
        }
    }

    // Sort version directories in ascending order (9.0, 10.0, 10.1, etc.)
    [versionDirs sortUsingComparator:^NSComparisonResult(NSString *version1, NSString *version2) {
        NSArray *components1 = [version1 componentsSeparatedByString:@"."];
        NSArray *components2 = [version2 componentsSeparatedByString:@"."];

        NSInteger major1 = [components1[0] integerValue];
        NSInteger major2 = [components2[0] integerValue];

        if (major1 != major2) {
            return major1 < major2 ? NSOrderedAscending : NSOrderedDescending;
        }

        NSInteger minor1 = components1.count > 1 ? [components1[1] integerValue] : 0;
        NSInteger minor2 = components2.count > 1 ? [components2[1] integerValue] : 0;

        if (minor1 != minor2) {
            return minor1 < minor2 ? NSOrderedAscending : NSOrderedDescending;
        }

        return NSOrderedSame;
    }];

    // Load scripts from version directories if current iOS version is older
    for (NSString *versionStr in versionDirs) {
        NSArray *components = [versionStr componentsSeparatedByString:@"."];
        NSInteger vMajor = [components[0] integerValue];
        NSInteger vMinor = components.count > 1 ? [components[1] integerValue] : 0;

        // If current iOS version is less than this polyfill version, include it
        if (!isIOSVersionOrNewer(vMajor, vMinor)) {
            NSString *versionPath = [fullBasePath stringByAppendingPathComponent:versionStr];
            NSString *versionScripts = loadJSFromDirectory(versionPath);
            if (versionScripts.length > 0) {
                if (injectionCallback) {
                    injectionCallback(versionScripts, isPost);
                }
                [combinedScripts appendString:versionScripts];
                [combinedScripts appendString:@"\n"];
            }
        }
    }

    return [combinedScripts copy];
}

static NSString *mobileUserAgent = @"Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1.36";
static NSString *desktopUserAgent = @"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15";

static NSString *getFinalUA(NSString *defaultUA) {
    NSString *finalUA = defaultUA;
    NSString *spoofedVersion = @"16_3";
    NSString *spoofedSafariVersion = @"Version/16.3";
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
    if (isIOSVersionOrNewer(16, 3)) return;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
    WKContentMode contentMode = WKContentModeRecommended;
    if (isIOSVersionOrNewer(13, 0))
        contentMode = webView.configuration.defaultWebpagePreferences.preferredContentMode;
    NSString *ua = IS_IPAD || contentMode == WKContentModeDesktop ? desktopUserAgent : mobileUserAgent;
#pragma clang diagnostic pop
    setUserAgent(webView, ua);
}

// Function to load and inject scripts immediately as they're loaded
static void loadAndInjectScriptsImmediately(WKUserContentController *controller) {
    NSString *polyfillsBasePath = getPolyfillsBasePath();

    void (^injectionCallback)(NSString *, BOOL) = ^(NSString *script, BOOL isPost) {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (script.length > 0 && controller) {
                WKUserScriptInjectionTime injectionTime = isPost ?
                    WKUserScriptInjectionTimeAtDocumentEnd :
                    WKUserScriptInjectionTimeAtDocumentStart;

                [controller addUserScript:[[WKUserScript alloc] initWithSource:script
                                                                  injectionTime:injectionTime
                                                               forMainFrameOnly:NO]];

                HBLogDebug(@"Polyfills: Injected %@ script (%lu chars)",
                          isPost ? @"post" : @"main", (unsigned long)script.length);
            }
        });
    };

    // Load and inject scripts immediately as they're loaded
    dispatch_async(scriptLoadingQueue, ^{
        @autoreleasepool {
            // Load main scripts with immediate injection
            loadScriptsForIOSVersion(polyfillsBasePath, NO, injectionCallback);

            // Load post scripts with immediate injection
            loadScriptsForIOSVersion(polyfillsBasePath, YES, injectionCallback);
        }
    });
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

        // Always use immediate injection for best performance
        loadAndInjectScriptsImmediately(controller);
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
    if (!isIOSVersionOrNewer(16, 3)) {
        HBLogDebug(@"Polyfills didMarkURLAsNeedingDesktopUserAgent called");
        WKWebView *webView = [self valueForKey:@"_webView"];
        if (webView) setUserAgent(webView, desktopUserAgent);
    }
    %orig;
}

- (void)didMarkURLAsNeedingStandardUserAgent:(id)arg1 {
    if (!isIOSVersionOrNewer(16, 3)) {
        HBLogDebug(@"Polyfills didMarkURLAsNeedingStandardUserAgent called");
        WKWebView *webView = [self valueForKey:@"_webView"];
        if (webView) setUserAgent(webView, mobileUserAgent);
    }
    %orig;
}

%end

%hook NSRegularExpression

- (void)enumerateMatchesInString:(NSString *)string options:(NSMatchingOptions)options range:(NSRange)range usingBlock:(void (^)(NSTextCheckingResult *result, NSMatchingFlags flags, BOOL *stop))block {
    if (!string) {
        HBLogDebug(@"Polyfills: Skipping regex match enumeration for empty string");
        return;
    }
    %orig(string, options, range, block);
}

%end

%ctor {
    if (!isTarget(TargetTypeApps)) return;
    Boolean keyExists;
    Boolean enabled = CFPreferencesGetAppBooleanValue(key, domain, &keyExists);
    if (!keyExists ? NO : !enabled) return;

    // Create queue for async script loading
    scriptLoadingQueue = dispatch_queue_create("com.polyfills.scriptloading", DISPATCH_QUEUE_SERIAL);

    %init;
}
