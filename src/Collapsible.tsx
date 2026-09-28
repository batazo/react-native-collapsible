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

export type EasingString = keyof typeof Easing | string;
export type EasingMode = EasingString | ((value: number) => number);

export interface CollapsibleProps {
  align?: 'top' | 'center' | 'bottom';
  collapsed?: boolean;
  collapsedHeight?: number;
  enablePointerEvents?: boolean;
  duration?: number;
  easing?: EasingMode;
  onAnimationEnd?: () => void;
  renderChildrenCollapsed?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  name?: string;
  logging?: boolean;
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
    | 'name'
    | 'logging'
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
  name: 'N/A',
  logging: false,
};

export const getResolvedEasing = (
  easingName?: EasingMode
): ((value: number) => number) => {
  if (typeof easingName === 'function') {
    return easingName;
  }

  if (typeof easingName === 'string') {
    for (const prefix of ANIMATED_EASING_PREFIXES) {
      if (easingName.startsWith(prefix)) {
        const mode = prefix.slice(4).toLowerCase();
        const rawFunc = easingName.slice(prefix.length);
        const func = rawFunc.charAt(0).toLowerCase() + rawFunc.slice(1);

        const easingModeFunc = Easing[mode as keyof typeof Easing] as
          | ((e: (v: number) => number) => (v: number) => number)
          | undefined;
        const targetEasing = (Easing[func as keyof typeof Easing] ||
          Easing[rawFunc as keyof typeof Easing]) as
          | ((v: number) => number)
          | undefined;

        if (
          typeof easingModeFunc === 'function' &&
          typeof targetEasing === 'function'
        ) {
          return easingModeFunc(targetEasing);
        }
      }
    }

    const directEasing = Easing[easingName as keyof typeof Easing] as
      | ((v: number) => number)
      | undefined;
    if (typeof directEasing === 'function') {
      return directEasing;
    }
  }

  return Easing.ease;
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
    name,
    logging,
    style,
    children,
  } = { ...defaultProps, ...props };

  const [measuring, setMeasuring] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [animating, setAnimating] = useState(false);

  const contentHeightRef = useRef(0);
  const measuredRef = useRef(false);
  const isFirstRender = useRef(true);
  const heightAnim = useRef(
    new Animated.Value(collapsed ? collapsedHeight : 0)
  ).current;
  const contentRef = useRef<View | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const unmounted = useRef(false);

  const transitionToHeight = useCallback(
    (targetHeight: number, shouldAnimate: boolean = true) => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }

      if (!shouldAnimate || duration === 0) {
        heightAnim.setValue(targetHeight);
        setAnimating(false);
        onAnimationEnd?.();
        return;
      }

      const easingFn = getResolvedEasing(easing);
      setAnimating(true);

      const anim = Animated.timing(heightAnim, {
        toValue: targetHeight,
        duration,
        easing: easingFn,
        useNativeDriver: false,
      });

      animationRef.current = anim;
      anim.start(({ finished }) => {
        if (!unmounted.current) {
          setAnimating(false);
          if (finished) {
            onAnimationEnd?.();
          }
        }
      });
    },
    [duration, easing, heightAnim, onAnimationEnd]
  );

  const measureContentFallback = useCallback(() => {
    setMeasuring(true);
    requestAnimationFrame(() => {
      if (unmounted.current) return;
      const node = contentRef.current;
      if (!node) {
        setMeasuring(false);
        return;
      }

      node.measure?.((_x, _y, _width, height) => {
        if (unmounted.current) return;
        setMeasuring(false);
        if (height > 0) {
          contentHeightRef.current = height;
          setContentHeight(height);
          measuredRef.current = true;
          setMeasured(true);
          if (!collapsed) {
            transitionToHeight(height, true);
          }
        }
      });
    });
  }, [collapsed, transitionToHeight]);

  useEffect(() => {
    if (logging) {
      console.log(`Collapsed (${name}) ::: ${collapsed}`);
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (collapsed) {
        heightAnim.setValue(collapsedHeight);
        return;
      }
      if (measuredRef.current && contentHeightRef.current > 0) {
        heightAnim.setValue(contentHeightRef.current);
        return;
      }
      measureContentFallback();
      return;
    }

    if (collapsed) {
      setMeasuring(false);
      transitionToHeight(collapsedHeight, true);
    } else if (measuredRef.current && contentHeightRef.current > 0) {
      setMeasuring(false);
      transitionToHeight(contentHeightRef.current, true);
    } else {
      measureContentFallback();
    }
  }, [
    collapsed,
    collapsedHeight,
    heightAnim,
    logging,
    measureContentFallback,
    name,
    transitionToHeight,
  ]);

  useEffect(() => {
    if (logging) {
      console.log(`Animating (${name}) ::: ${JSON.stringify(animating)}`);
    }
  }, [animating, logging, name]);

  useEffect(() => {
    return () => {
      unmounted.current = true;
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const height = event?.nativeEvent?.layout?.height ?? 0;
    if (logging) {
      console.log(`Height (${name}) ::: ${height}`);
    }

    if (height <= 0) {
      return;
    }

    const heightChanged = contentHeightRef.current !== height;
    contentHeightRef.current = height;
    setContentHeight(height);
    measuredRef.current = true;
    setMeasured(true);

    if (measuring) {
      setMeasuring(false);
      if (!collapsed) {
        transitionToHeight(height, true);
      }
      return;
    }

    if (!collapsed && !animating && heightChanged) {
      heightAnim.setValue(height);
    }
  };

  const hasKnownHeight = !measuring && (measured || collapsed);
  const containerStyle: Animated.WithAnimatedObject<ViewStyle> = {
    overflow: 'hidden',
    height: hasKnownHeight ? heightAnim : undefined,
  };

  const animatedContentStyle: Animated.WithAnimatedObject<ViewStyle> = {};
  if (measuring) {
    animatedContentStyle.position = 'absolute';
    animatedContentStyle.opacity = 0;
  } else if (align === 'center') {
    const validHeight = contentHeight > 0 ? contentHeight : 1;
    animatedContentStyle.transform = [
      {
        translateY: heightAnim.interpolate({
          inputRange: [0, validHeight],
          outputRange: [-validHeight / 2, 0],
        }),
      },
    ];
  } else if (align === 'bottom') {
    const validHeight = contentHeight > 0 ? contentHeight : 1;
    animatedContentStyle.transform = [
      {
        translateY: heightAnim.interpolate({
          inputRange: [0, validHeight],
          outputRange: [-validHeight, 0],
        }),
      },
    ];
  }

  if (animating && contentHeight > 0) {
    animatedContentStyle.height = contentHeight;
  }

  const shouldRenderChildren =
    renderChildrenCollapsed || !collapsed || animating || measuring;

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
        onLayout={handleLayout}
      >
        {shouldRenderChildren && children}
      </Animated.View>
    </Animated.View>
  );
};

Collapsible.displayName = 'Collapsible';
