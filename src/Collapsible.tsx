import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';

const ANIMATED_EASING_PREFIXES = ['easeInOut', 'easeOut', 'easeIn'] as const;

type EasingString = keyof typeof Easing | string;

interface CollapsibleProps {
  align?: 'top' | 'center' | 'bottom';
  collapsed?: boolean;
  collapsedHeight?: number;
  enablePointerEvents?: boolean;
  duration?: number;
  easing?: EasingString;
  onAnimationEnd?: () => void;
  renderChildrenCollapsed?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const defaultProps: Required<
  Pick<
    CollapsibleProps,
    | 'align'
    | 'collapsed'
    | 'collapsedHeight'
    | 'enablePointerEvents'
    | 'duration'
    | 'easing'
    | 'onAnimationEnd'
    | 'renderChildrenCollapsed'
  >
> = {
  align: 'top',
  collapsed: true,
  collapsedHeight: 0,
  enablePointerEvents: false,
  duration: 300,
  easing: 'easeOutCubic',
  onAnimationEnd: () => null,
  renderChildrenCollapsed: true,
};

export const Collapsible: React.FC<CollapsibleProps> = (props) => {
  const {
    align,
    collapsed,
    collapsedHeight,
    duration,
    easing,
    enablePointerEvents,
    onAnimationEnd,
    renderChildrenCollapsed,
    style,
    children,
  } = { ...defaultProps, ...props };

  const [measuring, setMeasuring] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [animating, setAnimating] = useState(false);
  const heightAnim = useRef(new Animated.Value(collapsedHeight)).current;
  const contentRef = useRef<View | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const unmounted = useRef(false);

  const getResolvedEasing = (
    easingName: EasingString
  ): ((value: number) => number) => {
    if (typeof easingName === 'string') {
      for (const prefix of ANIMATED_EASING_PREFIXES) {
        if (easingName.startsWith(prefix)) {
          const func = easingName.slice(prefix.length);
          const resolvedFunc = Easing[func as keyof typeof Easing];
          if (
            Easing[prefix.slice(4).toLowerCase() as keyof typeof Easing] &&
            resolvedFunc
          ) {
            const baseEasing =
              Easing[prefix.slice(4).toLowerCase() as keyof typeof Easing];
            if (typeof baseEasing === 'function' && resolvedFunc) {
              if (
                typeof baseEasing === 'function' &&
                typeof resolvedFunc === 'function'
              ) {
                if (
                  typeof baseEasing === 'function' &&
                  typeof resolvedFunc === 'function'
                ) {
                  // @ts-ignore
                  return baseEasing(resolvedFunc);
                }
                return Easing.ease;
              }
              return Easing.ease;
            }
            return Easing.ease;
          }
        }
      }

      const easingFunction = Easing[easingName as keyof typeof Easing];
      return typeof easingFunction === 'function'
        ? // @ts-ignore
          (value: number) => easingFunction(value)
        : Easing.ease;
    }
    return Easing.ease;
  };

  const measureContent = useCallback(
    (callback: (height: number) => void) => {
      setMeasuring(true);
      requestAnimationFrame(() => {
        const node = contentRef.current;
        if (!node) {
          setMeasuring(false);
          callback(collapsedHeight);
          return;
        }
        node.measure?.((x, y, width, height) => {
          setMeasuring(false);
          setMeasured(true);
          setContentHeight(height);
          callback(height);
        });
      });
    },
    [collapsedHeight]
  );

  const transitionToHeight = useCallback(
    (targetHeight: number) => {
      if (animationRef.current) {
        animationRef.current.stop();
      }

      const easingFn = getResolvedEasing(easing);
      setAnimating(true);

      animationRef.current = Animated.timing(heightAnim, {
        toValue: targetHeight,
        duration,
        easing: easingFn,
        useNativeDriver: false,
      });

      animationRef.current.start(() => {
        if (!unmounted.current) {
          setAnimating(false);
          onAnimationEnd();
        }
      });
    },
    [duration, easing, heightAnim, onAnimationEnd]
  );

  const toggleCollapsed = useCallback(
    (isCollapsed: boolean) => {
      if (isCollapsed) {
        transitionToHeight(collapsedHeight);
      } else if (measured) {
        transitionToHeight(contentHeight);
      } else {
        measureContent((measuredHeight) => {
          transitionToHeight(measuredHeight);
        });
      }
    },
    [
      collapsedHeight,
      contentHeight,
      measured,
      measureContent,
      transitionToHeight,
    ]
  );

  useEffect(() => {
    toggleCollapsed(collapsed);
  }, [collapsed, toggleCollapsed]);

  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (animating || collapsed || measuring || contentHeight === height) {
      return;
    }
    heightAnim.setValue(height);
    setContentHeight(height);
  };

  const hasKnownHeight = !measuring && (measured || collapsed);
  const containerStyle: Animated.WithAnimatedObject<ViewStyle> = {
    overflow: 'hidden',
    height: hasKnownHeight ? heightAnim : 0,
  };

  const animatedContentStyle: Animated.WithAnimatedObject<ViewStyle> = {};
  if (measuring) {
    animatedContentStyle.position = 'absolute';
    animatedContentStyle.opacity = 0;
  } else if (align === 'center') {
    animatedContentStyle.transform = [
      {
        translateY: heightAnim.interpolate({
          inputRange: [0, contentHeight],
          outputRange: [-contentHeight / 2, 0],
        }),
      },
    ];
  } else if (align === 'bottom') {
    animatedContentStyle.transform = [
      {
        translateY: heightAnim.interpolate({
          inputRange: [0, contentHeight],
          outputRange: [-contentHeight, 0],
        }),
      },
    ];
  }

  if (animating) {
    animatedContentStyle.height = contentHeight;
  }

  const shouldRenderChildren =
    renderChildrenCollapsed ||
    ((!collapsed || (collapsed && animating)) &&
      (animating || measuring || measured));

  return (
    <Animated.View
      style={containerStyle}
      pointerEvents={!enablePointerEvents && collapsed ? 'none' : 'auto'}
    >
      <Animated.View
        ref={(ref) => {
          contentRef.current = ref as View | null;
        }}
        style={[style, animatedContentStyle]}
        onLayout={!animating ? handleLayout : undefined}
      >
        {shouldRenderChildren && children}
      </Animated.View>
    </Animated.View>
  );
};

Collapsible.displayName = 'Collapsible';
