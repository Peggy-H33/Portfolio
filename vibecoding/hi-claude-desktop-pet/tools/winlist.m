// Lists on-screen normal windows (layer 0) as JSON [[x,y,w,h,pid,winid],...].
// Build: clang -O2 -framework CoreGraphics -framework Foundation -o winlist winlist.m
#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

int main(void) {
  @autoreleasepool {
    CFArrayRef list = CGWindowListCopyWindowInfo(
        kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements,
        kCGNullWindowID);
    NSMutableArray *out = [NSMutableArray array];
    for (NSDictionary *w in (__bridge NSArray *)list) {
      if ([w[(id)kCGWindowLayer] intValue] != 0) continue;
      id alpha = w[(id)kCGWindowAlpha];
      if (alpha && [alpha doubleValue] < 0.1) continue;
      NSDictionary *b = w[(id)kCGWindowBounds];
      if ([b[@"Width"] doubleValue] < 40 || [b[@"Height"] doubleValue] < 40) continue;
      [out addObject:@[ b[@"X"], b[@"Y"], b[@"Width"], b[@"Height"],
                        w[(id)kCGWindowOwnerPID] ?: @0,
                        w[(id)kCGWindowNumber] ?: @0 ]];
    }
    if (list) CFRelease(list);
    NSData *d = [NSJSONSerialization dataWithJSONObject:out options:0 error:nil];
    fwrite(d.bytes, 1, d.length, stdout);
    fputc('\n', stdout);
  }
  return 0;
}
