#import <CoreFoundation/CoreFoundation.h>
#import <Foundation/Foundation.h>
#import "PolyfillsCC.h"
#import "../Header.h"

@implementation PolyfillsCC

- (UIImage *)iconGlyph {
    return [UIImage imageNamed:@"icon" inBundle:[NSBundle bundleForClass:[self class]] compatibleWithTraitCollection:nil];
}

- (UIColor *)selectedColor {
    return [UIColor systemOrangeColor];
}

- (BOOL)isSelected {
    Boolean keyExists;
    Boolean enabled = CFPreferencesGetAppBooleanValue(key, domain, &keyExists);
    return !keyExists ? YES : enabled;
}

- (void)setSelected:(BOOL)selected {
    CFPreferencesSetAppValue(key, selected ? kCFBooleanTrue : kCFBooleanFalse, domain);
    CFPreferencesAppSynchronize(domain);
}

@end
